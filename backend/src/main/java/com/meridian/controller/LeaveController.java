package com.meridian.controller;

import com.meridian.domain.LeaveStatus;
import com.meridian.dto.ApiResponse;
import com.meridian.dto.CreateLeaveRequest;
import com.meridian.dto.LeaveRequestDto;
import com.meridian.dto.ReviewLeaveRequest;
import com.meridian.service.LeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leave")
@Tag(name = "Leave Management", description = "Endpoints for employee leave requests and manager/HR approval workflows")
public class LeaveController {

    private final LeaveService leaveService;

    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get current employee's leave requests")
    public ResponseEntity<ApiResponse<Page<LeaveRequestDto>>> getMyLeaves(
            @RequestParam(required = false) LeaveStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<LeaveRequestDto> leaves = leaveService.getMyLeaves(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Submit a new leave request")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> createLeaveRequest(
            @Valid @RequestBody CreateLeaveRequest request
    ) {
        LeaveRequestDto created = leaveService.createLeaveRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Leave request submitted successfully.", created));
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Get leave requests from manager's direct reports (Manager only)")
    public ResponseEntity<ApiResponse<Page<LeaveRequestDto>>> getTeamLeaves(
            @RequestParam(required = false) LeaveStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<LeaveRequestDto> leaves = leaveService.getTeamLeaves(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Get company-wide leave requests (HR/Admin only)")
    public ResponseEntity<ApiResponse<Page<LeaveRequestDto>>> getAllLeaves(
            @RequestParam(required = false) LeaveStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<LeaveRequestDto> leaves = leaveService.getAllLeaves(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER')")
    @Operation(summary = "Approve or reject a leave request")
    public ResponseEntity<ApiResponse<LeaveRequestDto>> reviewLeave(
            @PathVariable Long id,
            @Valid @RequestBody ReviewLeaveRequest request
    ) {
        LeaveRequestDto reviewed = leaveService.reviewLeaveRequest(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Leave request " + request.status().name().toLowerCase() + ".", reviewed));
    }
}

