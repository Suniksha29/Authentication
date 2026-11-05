package com.meridian.dto;

import java.util.Map;

public record AuthStepDto(
        int stepNumber,
        String key,
        String title,
        String category, // CLIENT, GOOGLE_OIDC, BACKEND_AUTH, BACKEND_AUTHORIZATION, SESSION
        String description,
        String status, // SUCCESS, FAILED, SKIPPED, IN_PROGRESS
        String timestamp,
        Map<String, Object> details
) {}

