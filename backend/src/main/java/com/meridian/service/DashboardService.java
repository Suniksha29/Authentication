package com.meridian.service;

import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.LeaveStatus;
import com.meridian.dto.AuditLogDto;
import com.meridian.dto.DashboardSummaryDto;
import com.meridian.dto.LeaveRequestDto;
import com.meridian.repository.AuditLogRepository;
import com.meridian.repository.EmployeeRepository;
import com.meridian.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final LeaveService leaveService;

    public DashboardService(EmployeeRepository employeeRepository,
                            LeaveRequestRepository leaveRequestRepository,
                            AuditLogRepository auditLogRepository,
                            LeaveService leaveService) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.auditLogRepository = auditLogRepository;
        this.leaveService = leaveService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        long total = employeeRepository.count();
        long active = employeeRepository.countByStatus(EmploymentStatus.ACTIVE);
        long inactive = total - active;
        long pendingLeaves = leaveRequestRepository.countByStatus(LeaveStatus.PENDING);

        Map<String, Long> deptCounts = new LinkedHashMap<>();
        for (Object[] row : employeeRepository.countActiveEmployeesByDepartment()) {
            deptCounts.put((String) row[0], ((Number) row[1]).longValue());
        }

        List<AuditLogDto> recentLogs = auditLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(AuditLogDto::fromEntity)
                .toList();

        List<LeaveRequestDto> pendingApprovals = leaveService.getPendingApprovalsForCurrent();

        return new DashboardSummaryDto(
                total,
                active,
                inactive,
                pendingLeaves,
                deptCounts,
                recentLogs,
                pendingApprovals
        );
    }
}

