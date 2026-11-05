package com.meridian.dto;

import com.meridian.domain.LeaveStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewLeaveRequest(
        @NotNull(message = "Review status must be either APPROVED or REJECTED")
        LeaveStatus status,

        @Size(max = 1000, message = "Review notes cannot exceed 1000 characters")
        String reviewNotes
) {}

