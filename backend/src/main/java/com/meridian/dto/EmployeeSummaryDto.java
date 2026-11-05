package com.meridian.dto;

import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;

public record EmployeeSummaryDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String jobTitle,
        Role role,
        EmploymentStatus status,
        String departmentName,
        String managerName,
        String avatarUrl
) {
    public static EmployeeSummaryDto fromEntity(Employee employee) {
        return new EmployeeSummaryDto(
                employee.getId(),
                employee.getEmail(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getFullName(),
                employee.getJobTitle(),
                employee.getRole(),
                employee.getStatus(),
                employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                employee.getManager() != null ? employee.getManager().getFullName() : null,
                employee.getAvatarUrl()
        );
    }
}

