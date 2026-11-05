package com.meridian.dto;

import java.time.LocalDateTime;

public record SentEmailDto(
        String id,
        String to,
        String subject,
        String type,
        String actionUrl,
        String previewText,
        String deliveredVia,
        LocalDateTime sentAt
) {}

