package com.meridian.dto;

import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;

import java.time.LocalDate;
import java.util.List;

public record UserProfileDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        String fullName,
        String jobTitle,
        Role role,
        EmploymentStatus status,
        DepartmentDto department,
        String avatarUrl,
        String phone,
        LocalDate hireDate,
        List<String> authorities
) {
    public static UserProfileDto fromEntity(Employee employee, List<String> authorities) {
        return new UserProfileDto(
                employee.getId(),
                employee.getEmail(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getFullName(),
                employee.getJobTitle(),
                employee.getRole(),
                employee.getStatus(),
                DepartmentDto.fromEntity(employee.getDepartment()),
                employee.getAvatarUrl(),
                employee.getPhone(),
                employee.getHireDate(),
                authorities
        );
    }
}

