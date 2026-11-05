package com.meridian.dto;

import com.meridian.domain.LeaveRequest;
import com.meridian.domain.LeaveStatus;
import com.meridian.domain.LeaveType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record LeaveRequestDto(
        Long id,
        Long employeeId,
        String employeeName,
        String employeeEmail,
        String departmentName,
        LeaveType leaveType,
        LocalDate startDate,
        LocalDate endDate,
        Integer daysCount,
        String reason,
        LeaveStatus status,
        Long reviewerId,
        String reviewerName,
        String reviewNotes,
        LocalDateTime reviewedAt,
        LocalDateTime createdAt
) {
    public static LeaveRequestDto fromEntity(LeaveRequest lr) {
        return new LeaveRequestDto(
                lr.getId(),
                lr.getEmployee() != null ? lr.getEmployee().getId() : null,
                lr.getEmployee() != null ? lr.getEmployee().getFullName() : null,
                lr.getEmployee() != null ? lr.getEmployee().getEmail() : null,
                lr.getEmployee() != null && lr.getEmployee().getDepartment() != null
                        ? lr.getEmployee().getDepartment().getName() : null,
                lr.getLeaveType(),
                lr.getStartDate(),
                lr.getEndDate(),
                lr.getDaysCount(),
                lr.getReason(),
                lr.getStatus(),
                lr.getReviewer() != null ? lr.getReviewer().getId() : null,
                lr.getReviewer() != null ? lr.getReviewer().getFullName() : null,
                lr.getReviewNotes(),
                lr.getReviewedAt(),
                lr.getCreatedAt()
        );
    }
}

