package com.meridian.service;

import com.meridian.config.MeridianProperties;
import com.meridian.domain.*;
import com.meridian.dto.ApiResponse;
import com.meridian.repository.DepartmentRepository;
import com.meridian.repository.EmployeeRepository;
import com.meridian.repository.RegistrationRequestRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class RegistrationService {

    private static final Logger log = LoggerFactory.getLogger(RegistrationService.class);

    private final RegistrationRequestRepository registrationRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmailService emailService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;
    private final MeridianProperties properties;

    public RegistrationService(RegistrationRequestRepository registrationRepository,
                               EmployeeRepository employeeRepository,
                               DepartmentRepository departmentRepository,
                               EmailService emailService,
                               AuditService auditService,
                               PasswordEncoder passwordEncoder,
                               MeridianProperties properties) {
        this.registrationRepository = registrationRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.emailService = emailService;
        this.auditService = auditService;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Transactional
    public RegistrationRequest register(String fullName, String email, String password, HttpServletRequest request) {
        String cleanEmail = email.trim().toLowerCase();
        String cleanName = fullName.trim();

        // Check if an active employee already exists
        Optional<Employee> existingEmployee = employeeRepository.findByEmailIgnoreCase(cleanEmail);
        if (existingEmployee.isPresent() && existingEmployee.get().getStatus() == EmploymentStatus.ACTIVE) {
            throw new IllegalArgumentException("An account with email " + cleanEmail + " is already active.");
        }

        String passwordHash = passwordEncoder.encode(password);
        String verificationToken = UUID.randomUUID().toString();
        String approvalToken = UUID.randomUUID().toString();

        // Create or update RegistrationRequest
        RegistrationRequest regRequest = registrationRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseGet(RegistrationRequest::new);

        regRequest.setFullName(cleanName);
        regRequest.setEmail(cleanEmail);
        regRequest.setPasswordHash(passwordHash);
        regRequest.setStatus(RegistrationStatus.PENDING_VERIFICATION);
        regRequest.setVerificationToken(verificationToken);
        regRequest.setApprovalToken(approvalToken);
        regRequest.setVerifiedAt(null);
        regRequest.setApprovedAt(null);

        RegistrationRequest savedReg = registrationRepository.save(regRequest);

        // Provision Employee in INACTIVE status (blocked until admin approves)
        String[] nameParts = cleanName.split("\\s+", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "Employee";

        Department defaultDept = departmentRepository.findByCode("ENG")
                .or(() -> departmentRepository.findById(2L))
                .orElseGet(() -> departmentRepository.findAll().stream().findFirst().orElse(null));

        Employee employee = existingEmployee.orElseGet(Employee::new);
        employee.setEmail(cleanEmail);
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setJobTitle("Associate");
        employee.setRole(Role.EMPLOYEE);
        employee.setStatus(EmploymentStatus.INACTIVE); // Inactive until Admin approves!
        employee.setPasswordHash(passwordHash);
        if (employee.getDepartment() == null && defaultDept != null) {
            employee.setDepartment(defaultDept);
        }
        if (employee.getHireDate() == null) {
            employee.setHireDate(LocalDate.now());
        }

        employeeRepository.save(employee);

        // Dispatch 1: Send verification email to candidate
        emailService.sendVerificationEmail(savedReg);

        // Dispatch 2: Send approval request to Admin (suniksha2329@gmail.com)
        emailService.sendAdminApprovalRequest(savedReg);

        // Audit Log
        String clientIp = request != null ? AuditService.extractClientIp(request) : "127.0.0.1";
        String userAgent = request != null ? request.getHeader("User-Agent") : "Browser";
        auditService.record(
                AuditAction.REGISTRATION_SUBMITTED,
                cleanEmail,
                "ANONYMOUS",
                "auth/register",
                clientIp,
                userAgent,
                "Registration submitted for " + cleanName + ". Verification sent to candidate; Approval email sent to Admin (" + properties.getBootstrapAdminEmail() + ")."
        );

        log.info("Registration processed for '{}'. Verification token and Admin approval dispatched.", cleanEmail);
        return savedReg;
    }

    @Transactional
    public Optional<RegistrationRequest> verifyEmail(String token) {
        if (token == null || token.isBlank()) return Optional.empty();

        Optional<RegistrationRequest> opt = registrationRepository.findByVerificationToken(token.trim());
        if (opt.isEmpty()) return Optional.empty();

        RegistrationRequest reg = opt.get();
        if (reg.getStatus() == RegistrationStatus.PENDING_VERIFICATION) {
            reg.setStatus(RegistrationStatus.VERIFIED_AWAITING_APPROVAL);
            reg.setVerifiedAt(LocalDateTime.now());
            registrationRepository.save(reg);

            auditService.record(
                    AuditAction.EMAIL_VERIFIED,
                    reg.getEmail(),
                    "CANDIDATE",
                    "auth/verify-email",
                    "127.0.0.1",
                    "Email-Client",
                    "Candidate successfully verified email address: " + reg.getEmail()
            );

            log.info("Email verified for candidate '{}'. Status now VERIFIED_AWAITING_APPROVAL.", reg.getEmail());
        }

        return Optional.of(reg);
    }

    @Transactional
    public Optional<RegistrationRequest> approveRegistration(String token) {
        if (token == null || token.isBlank()) return Optional.empty();

        Optional<RegistrationRequest> opt = registrationRepository.findByApprovalToken(token.trim());
        if (opt.isEmpty()) return Optional.empty();

        RegistrationRequest reg = opt.get();
        reg.setStatus(RegistrationStatus.APPROVED);
        reg.setApprovedAt(LocalDateTime.now());
        registrationRepository.save(reg);

        // Activate employee in directory
        Optional<Employee> empOpt = employeeRepository.findByEmailIgnoreCase(reg.getEmail());
        if (empOpt.isPresent()) {
            Employee emp = empOpt.get();
            emp.setStatus(EmploymentStatus.ACTIVE);
            employeeRepository.save(emp);

            auditService.record(
                    AuditAction.REGISTRATION_APPROVED,
                    properties.getBootstrapAdminEmail(),
                    "ADMIN",
                    "employees/" + emp.getId(),
                    "127.0.0.1",
                    "Admin-Action",
                    "Admin approved and activated account for " + reg.getFullName() + " (" + reg.getEmail() + ")."
            );

            log.info("Admin approved account for '{}'. Employee ID {} is now ACTIVE.", reg.getEmail(), emp.getId());
        }

        // Send confirmation email to candidate
        emailService.sendAccountApprovedEmail(reg.getEmail(), reg.getFullName());

        return Optional.of(reg);
    }

    @Transactional
    public Optional<RegistrationRequest> rejectRegistration(String token) {
        if (token == null || token.isBlank()) return Optional.empty();

        Optional<RegistrationRequest> opt = registrationRepository.findByApprovalToken(token.trim());
        if (opt.isEmpty()) return Optional.empty();

        RegistrationRequest reg = opt.get();
        reg.setStatus(RegistrationStatus.REJECTED);
        registrationRepository.save(reg);

        Optional<Employee> empOpt = employeeRepository.findByEmailIgnoreCase(reg.getEmail());
        empOpt.ifPresent(emp -> {
            emp.setStatus(EmploymentStatus.INACTIVE);
            employeeRepository.save(emp);
        });

        auditService.record(
                AuditAction.REGISTRATION_REJECTED,
                properties.getBootstrapAdminEmail(),
                "ADMIN",
                "auth/registration/" + reg.getId(),
                "127.0.0.1",
                "Admin-Action",
                "Admin rejected registration request for " + reg.getEmail()
        );

        return Optional.of(reg);
    }

    public void resendVerification(String email) {
        String cleanEmail = email.trim().toLowerCase();
        Optional<RegistrationRequest> opt = registrationRepository.findByEmailIgnoreCase(cleanEmail);
        if (opt.isPresent()) {
            RegistrationRequest reg = opt.get();
            // Re-dispatch verification to candidate and approval request to admin
            emailService.sendVerificationEmail(reg);
            emailService.sendAdminApprovalRequest(reg);
            log.info("Resent verification and approval notification for '{}'", cleanEmail);
        }
    }
}

