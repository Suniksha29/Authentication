package com.meridian.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record AuthInspectorTraceDto(
        String traceId,
        String email,
        String outcome,
        String summary,
        List<AuthStepDto> steps,
        Map<String, Object> maskedClaims,
        Map<String, Object> sessionMetadata,
        String ipAddress,
        String userAgent,
        LocalDateTime timestamp,
        boolean isDemoTrace
) {}

