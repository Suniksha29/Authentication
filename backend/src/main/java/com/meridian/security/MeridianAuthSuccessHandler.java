package com.meridian.security;

import com.meridian.domain.AuditAction;
import com.meridian.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class MeridianAuthSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(MeridianAuthSuccessHandler.class);

    private final AuditService auditService;

    public MeridianAuthSuccessHandler(AuditService auditService) {
        super("/dashboard");
        this.auditService = auditService;
        this.setAlwaysUseDefaultTargetUrl(false);
        this.setDefaultTargetUrl("/dashboard");
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String email = authentication.getName();
        String roleStr = "UNKNOWN";

        if (authentication.getPrincipal() instanceof MeridianOidcUser meridianUser) {
            email = meridianUser.getEmail();
            if (meridianUser.getRole() != null) {
                roleStr = meridianUser.getRole().name();
            }
        }

        log.info("Authentication SUCCESS for email='{}', role='{}'", email, roleStr);

        auditService.record(
                AuditAction.LOGIN_SUCCESS,
                email,
                roleStr,
                "auth/session",
                AuditService.extractClientIp(request),
                request.getHeader("User-Agent"),
                "User successfully authenticated via Google OIDC and authorized as " + roleStr
        );

        response.sendRedirect("/dashboard");
    }
}

