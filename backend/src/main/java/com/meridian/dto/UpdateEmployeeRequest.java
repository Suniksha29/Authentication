package com.meridian.dto;

import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateEmployeeRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name cannot exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name cannot exceed 100 characters")
        String lastName,

        @NotBlank(message = "Job title is required")
        @Size(max = 150, message = "Job title cannot exceed 150 characters")
        String jobTitle,

        @NotNull(message = "Role is required")
        Role role,

        @NotNull(message = "Status is required")
        EmploymentStatus status,

        @NotNull(message = "Department ID is required")
        Long departmentId,

        Long managerId,

        @Size(max = 50, message = "Phone cannot exceed 50 characters")
        String phone
) {}

