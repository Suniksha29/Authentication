package com.meridian.dto;

import java.util.List;
import java.util.Map;

public record DashboardSummaryDto(
        long totalEmployees,
        long activeEmployees,
        long inactiveEmployees,
        long pendingLeavesCount,
        Map<String, Long> departmentHeadcount,
        List<AuditLogDto> recentActivities,
        List<LeaveRequestDto> pendingApprovals
) {}

