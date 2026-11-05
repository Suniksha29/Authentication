package com.meridian.security;

import com.meridian.domain.AuditAction;
import com.meridian.service.AuditService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class MeridianLogoutSuccessHandler implements LogoutSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(MeridianLogoutSuccessHandler.class);

    private final AuditService auditService;

    public MeridianLogoutSuccessHandler(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response,
                                Authentication authentication) throws IOException {
        String email = "anonymous";
        String roleStr = "ANONYMOUS";

        if (authentication != null) {
            email = authentication.getName();
            if (authentication.getPrincipal() instanceof MeridianOidcUser meridianUser) {
                email = meridianUser.getEmail();
                if (meridianUser.getRole() != null) {
                    roleStr = meridianUser.getRole().name();
                }
            }
        }

        log.info("Logout for email='{}'", email);

        auditService.record(
                AuditAction.LOGOUT,
                email,
                roleStr,
                "auth/session",
                AuditService.extractClientIp(request),
                request.getHeader("User-Agent"),
                "User signed out. Session invalidated."
        );

        // Expire cookies explicitly
        for (String cookieName : new String[]{"SESSION", "JSESSIONID", "XSRF-TOKEN"}) {
            Cookie cookie = new Cookie(cookieName, "");
            cookie.setPath("/");
            cookie.setMaxAge(0);
            cookie.setHttpOnly(true);
            response.addCookie(cookie);
        }

        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":true,\"message\":\"Successfully signed out.\"}");
        } else {
            response.sendRedirect("/login?logout=true");
        }
    }
}

