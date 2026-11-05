package com.meridian.service;

import com.meridian.domain.*;
import com.meridian.dto.*;
import com.meridian.repository.DepartmentRepository;
import com.meridian.repository.EmployeeRepository;
import com.meridian.security.MeridianOidcUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class EmployeeService {

    private static final Logger log = LoggerFactory.getLogger(EmployeeService.class);

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditService auditService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           DepartmentRepository departmentRepository,
                           AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeSummaryDto> searchEmployees(String query, Long departmentId, Role role,
                                                    EmploymentStatus status, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isBlank()) ? query.trim() : null;
        return employeeRepository.searchEmployees(cleanQuery, departmentId, role, status, pageable)
                .map(EmployeeSummaryDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public EmployeeDetailDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findByIdWithDepartmentAndManager(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found with id: " + id));
        return EmployeeDetailDto.fromEntity(employee);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        Employee current = getCurrentEmployee();
        List<String> authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream().map(a -> a.getAuthority()).toList();
        return UserProfileDto.fromEntity(current, authorities);
    }

    @Transactional
    public EmployeeDetailDto createEmployee(CreateEmployeeRequest request) {
        if (employeeRepository.existsByEmailIgnoreCase(request.email())) {
            throw new IllegalArgumentException("An employee with email '" + request.email() + "' already exists.");
        }

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NoSuchElementException("Department not found with id: " + request.departmentId()));

        Employee manager = null;
        if (request.managerId() != null) {
            manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new NoSuchElementException("Manager not found with id: " + request.managerId()));
        }

        Employee employee = new Employee();
        employee.setEmail(request.email().toLowerCase().trim());
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setJobTitle(request.jobTitle().trim());
        employee.setRole(request.role());
        employee.setStatus(EmploymentStatus.ACTIVE);
        employee.setDepartment(department);
        employee.setManager(manager);
        employee.setPhone(request.phone());
        employee.setHireDate(request.hireDate() != null ? request.hireDate() : LocalDate.now());

        Employee saved = employeeRepository.save(employee);
        log.info("Created new employee: id={}, email={}, role={}", saved.getId(), saved.getEmail(), saved.getRole());

        // Audit log
        recordAudit(AuditAction.EMPLOYEE_CREATED, "employees/" + saved.getId(),
                String.format("Created employee %s (%s) with role %s in department %s",
                        saved.getFullName(), saved.getEmail(), saved.getRole(), department.getName()));

        return EmployeeDetailDto.fromEntity(saved);
    }

    @Transactional
    public EmployeeDetailDto updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findByIdWithDepartmentAndManager(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found with id: " + id));

        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NoSuchElementException("Department not found with id: " + request.departmentId()));

        Employee manager = null;
        if (request.managerId() != null) {
            if (request.managerId().equals(id)) {
                throw new IllegalArgumentException("An employee cannot be their own manager.");
            }
            manager = employeeRepository.findById(request.managerId())
                    .orElseThrow(() -> new NoSuchElementException("Manager not found with id: " + request.managerId()));
        }

        Role oldRole = employee.getRole();
        EmploymentStatus oldStatus = employee.getStatus();

        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setJobTitle(request.jobTitle().trim());
        employee.setRole(request.role());
        employee.setStatus(request.status());
        employee.setDepartment(department);
        employee.setManager(manager);
        employee.setPhone(request.phone());

        Employee updated = employeeRepository.save(employee);

        // Audit role or status changes
        if (oldRole != request.role()) {
            recordAudit(AuditAction.ROLE_CHANGED, "employees/" + id,
                    String.format("Role changed for %s (%s) from %s to %s",
                            updated.getFullName(), updated.getEmail(), oldRole, request.role()));
        }

        if (oldStatus == EmploymentStatus.ACTIVE && request.status() == EmploymentStatus.INACTIVE) {
            recordAudit(AuditAction.EMPLOYEE_DEACTIVATED, "employees/" + id,
                    String.format("Deactivated employee account for %s (%s)", updated.getFullName(), updated.getEmail()));
        } else {
            recordAudit(AuditAction.EMPLOYEE_UPDATED, "employees/" + id,
                    String.format("Updated profile details for %s (%s)", updated.getFullName(), updated.getEmail()));
        }

        return EmployeeDetailDto.fromEntity(updated);
    }

    @Transactional
    public EmployeeDetailDto deactivateEmployee(Long id) {
        Employee employee = employeeRepository.findByIdWithDepartmentAndManager(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found with id: " + id));

        // Prevent self-deactivation of current admin
        Employee current = getCurrentEmployee();
        if (current.getId().equals(id)) {
            throw new IllegalArgumentException("You cannot deactivate your own account.");
        }

        employee.setStatus(EmploymentStatus.INACTIVE);
        Employee saved = employeeRepository.save(employee);

        recordAudit(AuditAction.EMPLOYEE_DEACTIVATED, "employees/" + id,
                String.format("Deactivated employee %s (%s)", saved.getFullName(), saved.getEmail()));

        log.info("Deactivated employee id={}, email={}", saved.getId(), saved.getEmail());
        return EmployeeDetailDto.fromEntity(saved);
    }

    @Transactional
    public EmployeeDetailDto activateEmployee(Long id) {
        Employee employee = employeeRepository.findByIdWithDepartmentAndManager(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found with id: " + id));

        employee.setStatus(EmploymentStatus.ACTIVE);
        Employee saved = employeeRepository.save(employee);

        recordAudit(AuditAction.EMPLOYEE_UPDATED, "employees/" + id,
                String.format("Activated employee %s (%s)", saved.getFullName(), saved.getEmail()));

        log.info("Activated employee id={}, email={}", saved.getId(), saved.getEmail());
        return EmployeeDetailDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(DepartmentDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EmployeeSummaryDto> getManagersList() {
        return employeeRepository.findAll().stream()
                .filter(e -> e.getRole() == Role.MANAGER || e.getRole() == Role.ADMIN || e.getRole() == Role.HR)
                .map(EmployeeSummaryDto::fromEntity)
                .toList();
    }

    public Employee getCurrentEmployee() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("User is not authenticated");
        }

        if (auth.getPrincipal() instanceof MeridianOidcUser meridianUser) {
            return employeeRepository.findByIdWithDepartmentAndManager(meridianUser.getEmployeeId())
                    .orElseThrow(() -> new NoSuchElementException("Authenticated employee record not found"));
        }

        // Fallback for tests or standard mock auth
        String email = auth.getName();
        return employeeRepository.findByEmailWithDepartmentAndManager(email)
                .orElseThrow(() -> new NoSuchElementException("Authenticated employee record not found for: " + email));
    }

    private void recordAudit(AuditAction action, String targetResource, String details) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actorEmail = auth != null ? auth.getName() : "system";
        String actorRole = "SYSTEM";
        if (auth != null && auth.getPrincipal() instanceof MeridianOidcUser u && u.getRole() != null) {
            actorRole = u.getRole().name();
        }
        auditService.record(action, actorEmail, actorRole, targetResource, "internal", "Meridian-Service", details);
    }
}

