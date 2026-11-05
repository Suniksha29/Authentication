package com.meridian.service;

import com.meridian.domain.AuditAction;
import com.meridian.domain.AuditLog;
import com.meridian.domain.Role;
import com.meridian.dto.AuditLogDto;
import com.meridian.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditAction action, String actorEmail, String actorRole,
                       String targetResource, String ipAddress, String userAgent, String details) {
        try {
            AuditLog auditLog = new AuditLog(action, actorEmail, actorRole, targetResource, ipAddress, userAgent, details);
            auditLogRepository.save(auditLog);
            log.info("AUDIT [{}] actor={} role={} target={} ip={} details={}",
                    action, actorEmail, actorRole, targetResource, ipAddress, details);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage(), e);
        }
    }

    public void recordWithRequest(AuditAction action, String actorEmail, Role actorRole,
                                  String targetResource, HttpServletRequest request, String details) {
        String ip = extractClientIp(request);
        String ua = request != null ? request.getHeader("User-Agent") : "unknown";
        String roleStr = actorRole != null ? actorRole.name() : "ANONYMOUS";
        record(action, actorEmail, roleStr, targetResource, ip, ua, details);
    }

    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(AuditAction action, String actorEmail, Pageable pageable) {
        return auditLogRepository.findWithFilters(action, actorEmail, pageable)
                .map(AuditLogDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getRecentLogs() {
        return auditLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(AuditLogDto::fromEntity)
                .toList();
    }
}

