package com.meridian.dto;

import com.meridian.domain.AuditAction;
import com.meridian.domain.AuditLog;

import java.time.LocalDateTime;

public record AuditLogDto(
        Long id,
        AuditAction action,
        String actorEmail,
        String actorRole,
        String targetResource,
        String ipAddress,
        String userAgent,
        String details,
        LocalDateTime createdAt
) {
    public static AuditLogDto fromEntity(AuditLog log) {
        return new AuditLogDto(
                log.getId(),
                log.getAction(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getTargetResource(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}

