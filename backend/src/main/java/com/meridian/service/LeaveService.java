package com.meridian.service;

import com.meridian.domain.*;
import com.meridian.dto.CreateLeaveRequest;
import com.meridian.dto.LeaveRequestDto;
import com.meridian.dto.ReviewLeaveRequest;
import com.meridian.repository.LeaveRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class LeaveService {

    private static final Logger log = LoggerFactory.getLogger(LeaveService.class);

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeService employeeService;
    private final AuditService auditService;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        EmployeeService employeeService,
                        AuditService auditService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeService = employeeService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestDto> getMyLeaves(LeaveStatus status, Pageable pageable) {
        Employee current = employeeService.getCurrentEmployee();
        return leaveRequestRepository.findByEmployeeId(current.getId(), status, pageable)
                .map(LeaveRequestDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestDto> getTeamLeaves(LeaveStatus status, Pageable pageable) {
        Employee current = employeeService.getCurrentEmployee();
        return leaveRequestRepository.findByManagerId(current.getId(), status, pageable)
                .map(LeaveRequestDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestDto> getAllLeaves(LeaveStatus status, Pageable pageable) {
        return leaveRequestRepository.findAllWithDetails(status, pageable)
                .map(LeaveRequestDto::fromEntity);
    }

    @Transactional
    public LeaveRequestDto createLeaveRequest(CreateLeaveRequest request) {
        Employee current = employeeService.getCurrentEmployee();

        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Leave end date cannot be before start date.");
        }

        long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;

        LeaveRequest leave = new LeaveRequest();
        leave.setEmployee(current);
        leave.setLeaveType(request.leaveType());
        leave.setStartDate(request.startDate());
        leave.setEndDate(request.endDate());
        leave.setDaysCount((int) days);
        leave.setReason(request.reason().trim());
        leave.setStatus(LeaveStatus.PENDING);

        LeaveRequest saved = leaveRequestRepository.save(leave);
        log.info("Leave request created: id={}, employee={}", saved.getId(), current.getEmail());

        auditService.record(
                AuditAction.LEAVE_REQUESTED,
                current.getEmail(),
                current.getRole().name(),
                "leave/" + saved.getId(),
                "internal",
                "Meridian-App",
                String.format("Requested %d day(s) of %s leave from %s to %s",
                        days, request.leaveType(), request.startDate(), request.endDate())
        );

        return LeaveRequestDto.fromEntity(saved);
    }

    @Transactional
    public LeaveRequestDto reviewLeaveRequest(Long id, ReviewLeaveRequest request) {
        Employee current = employeeService.getCurrentEmployee();
        LeaveRequest leave = leaveRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NoSuchElementException("Leave request not found with id: " + id));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only pending leave requests can be reviewed.");
        }

        // Authorization check:
        // Admin & HR can review all leaves.
        // Manager can review only if the employee's manager is the current user.
        boolean isHrOrAdmin = current.getRole() == Role.ADMIN || current.getRole() == Role.HR;
        boolean isDirectManager = leave.getEmployee().getManager() != null
                && leave.getEmployee().getManager().getId().equals(current.getId());

        if (!isHrOrAdmin && !isDirectManager) {
            throw new AccessDeniedException("You are not authorized to review leave requests for this employee.");
        }

        leave.setStatus(request.status());
        leave.setReviewer(current);
        leave.setReviewNotes(request.reviewNotes());
        leave.setReviewedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(leave);

        AuditAction action = request.status() == LeaveStatus.APPROVED ? AuditAction.LEAVE_APPROVED : AuditAction.LEAVE_REJECTED;
        auditService.record(
                action,
                current.getEmail(),
                current.getRole().name(),
                "leave/" + saved.getId(),
                "internal",
                "Meridian-App",
                String.format("%s leave request for %s. Notes: %s",
                        request.status(), leave.getEmployee().getFullName(),
                        request.reviewNotes() != null ? request.reviewNotes() : "None")
        );

        return LeaveRequestDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestDto> getPendingApprovalsForCurrent() {
        Employee current = employeeService.getCurrentEmployee();
        if (current.getRole() == Role.ADMIN || current.getRole() == Role.HR) {
            return leaveRequestRepository.findAllWithDetails(LeaveStatus.PENDING, Pageable.ofSize(5))
                    .map(LeaveRequestDto::fromEntity)
                    .getContent();
        } else if (current.getRole() == Role.MANAGER) {
            return leaveRequestRepository.findByManagerId(current.getId(), LeaveStatus.PENDING, Pageable.ofSize(5))
                    .map(LeaveRequestDto::fromEntity)
                    .getContent();
        }
        return List.of();
    }
}

