package com.meridian.dto;

import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeDetailDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String jobTitle,
        Role role,
        EmploymentStatus status,
        Long departmentId,
        String departmentName,
        Long managerId,
        String managerName,
        String avatarUrl,
        String phone,
        LocalDate hireDate,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static EmployeeDetailDto fromEntity(Employee employee) {
        return new EmployeeDetailDto(
                employee.getId(),
                employee.getEmail(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getFullName(),
                employee.getJobTitle(),
                employee.getRole(),
                employee.getStatus(),
                employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                employee.getManager() != null ? employee.getManager().getId() : null,
                employee.getManager() != null ? employee.getManager().getFullName() : null,
                employee.getAvatarUrl(),
                employee.getPhone(),
                employee.getHireDate(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}

