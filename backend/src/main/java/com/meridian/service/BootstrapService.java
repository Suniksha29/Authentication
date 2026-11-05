package com.meridian.service;

import com.meridian.config.MeridianProperties;
import com.meridian.domain.AuditAction;
import com.meridian.domain.Department;
import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;
import com.meridian.repository.DepartmentRepository;
import com.meridian.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class BootstrapService {

    private static final Logger log = LoggerFactory.getLogger(BootstrapService.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final MeridianProperties properties;
    private final AuditService auditService;

    public BootstrapService(EmployeeRepository employeeRepository,
                            DepartmentRepository departmentRepository,
                            MeridianProperties properties,
                            AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.properties = properties;
        this.auditService = auditService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onStartup() {
        String bootstrapEmail = properties.getBootstrapAdminEmail();
        if (bootstrapEmail == null || bootstrapEmail.trim().isBlank()) {
            return;
        }

        String email = bootstrapEmail.trim().toLowerCase();
        Optional<Employee> existingOpt = employeeRepository.findByEmailIgnoreCase(email);

        if (existingOpt.isPresent()) {
            Employee emp = existingOpt.get();
            boolean changed = false;
            if (emp.getRole() != Role.ADMIN) {
                emp.setRole(Role.ADMIN);
                changed = true;
            }
            if (emp.getStatus() != EmploymentStatus.ACTIVE) {
                emp.setStatus(EmploymentStatus.ACTIVE);
                changed = true;
            }
            if (changed) {
                employeeRepository.save(emp);
                log.info("Bootstrap admin email '{}' verified and updated to ACTIVE ADMIN", email);
            }
        } else {
            // Provision new Admin
            Department execDept = departmentRepository.findByCode("EXEC")
                    .or(() -> departmentRepository.findById(1L))
                    .orElseGet(() -> departmentRepository.save(new Department(null, "Executive Leadership", "EXEC")));

            Employee admin = new Employee();
            admin.setEmail(email);
            admin.setFirstName("Bootstrap");
            admin.setLastName("Admin");
            admin.setJobTitle("Enterprise System Administrator");
            admin.setRole(Role.ADMIN);
            admin.setStatus(EmploymentStatus.ACTIVE);
            admin.setDepartment(execDept);
            admin.setHireDate(LocalDate.now());

            Employee saved = employeeRepository.save(admin);
            log.info("Provisioned new bootstrap admin account for '{}' (ID: {})", email, saved.getId());

            auditService.record(
                    AuditAction.EMPLOYEE_CREATED,
                    "bootstrap@system",
                    "SYSTEM",
                    "employees/" + saved.getId(),
                    "127.0.0.1",
                    "System-Bootstrap",
                    "Auto-provisioned initial Admin account from BOOTSTRAP_ADMIN_EMAIL: " + email
            );
        }
    }
}

