package com.meridian.security;

import com.meridian.domain.AuditAction;
import com.meridian.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class MeridianAuthFailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(MeridianAuthFailureHandler.class);

    private final AuditService auditService;

    public MeridianAuthFailureHandler(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        String attemptedEmail = "unknown";
        String reason = exception.getMessage();
        String errorType = "unauthorized";

        if (exception instanceof OidcAuthExceptions.UnauthorizedEmployeeException uee) {
            attemptedEmail = uee.getEmail();
            errorType = "not_found";
        } else if (exception instanceof OidcAuthExceptions.InactiveEmployeeException iee) {
            attemptedEmail = iee.getEmail();
            errorType = "inactive";
        } else if (exception instanceof OidcAuthExceptions.UnverifiedEmailException) {
            errorType = "unverified";
        } else if (exception instanceof OidcAuthExceptions.UnauthorizedDomainException) {
            errorType = "invalid_domain";
        }

        log.warn("Authentication DENIED: email='{}', errorType='{}', reason='{}'", attemptedEmail, errorType, reason);

        auditService.record(
                AuditAction.LOGIN_DENIED,
                attemptedEmail,
                "ANONYMOUS",
                "auth/session",
                AuditService.extractClientIp(request),
                request.getHeader("User-Agent"),
                "Authentication rejected: " + reason
        );

        String redirectUrl = "/access-denied?error=" + URLEncoder.encode(errorType, StandardCharsets.UTF_8)
                + "&email=" + URLEncoder.encode(attemptedEmail, StandardCharsets.UTF_8)
                + "&message=" + URLEncoder.encode(reason, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}

