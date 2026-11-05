package com.meridian.security;

import com.meridian.config.MeridianProperties;
import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;
import com.meridian.dto.AuthStepDto;
import com.meridian.repository.EmployeeRepository;
import com.meridian.security.inspector.AuthFlowInspectorService;
import com.meridian.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;

@Service
public class MeridianOidcUserService extends OidcUserService {

    private static final Logger log = LoggerFactory.getLogger(MeridianOidcUserService.class);

    private final EmployeeRepository employeeRepository;
    private final MeridianProperties properties;
    private final AuthFlowInspectorService inspectorService;

    public MeridianOidcUserService(EmployeeRepository employeeRepository,
                                  MeridianProperties properties,
                                  AuthFlowInspectorService inspectorService) {
        this.employeeRepository = employeeRepository;
        this.properties = properties;
        this.inspectorService = inspectorService;
    }

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        // Delegate to standard Spring Security OIDC processor to validate JWT signature with Google JWKS
        OidcUser oidcUser = super.loadUser(userRequest);

        Map<String, Object> rawClaims = oidcUser.getIdToken().getClaims();
        Map<String, Object> maskedClaims = inspectorService.maskClaims(rawClaims);

        HttpServletRequest currentRequest = getCurrentHttpRequest();
        String clientIp = AuditService.extractClientIp(currentRequest);
        String userAgent = currentRequest != null ? currentRequest.getHeader("User-Agent") : "unknown";

        String email = oidcUser.getEmail();
        if (email == null || email.isBlank()) {
            email = (String) rawClaims.get("email");
        }

        // Rule 1: Validate email_verified claim
        Boolean emailVerified = oidcUser.getIdToken().getEmailVerified();
        if (emailVerified == null || !emailVerified) {
            log.warn("OIDC login rejected for email={}: email_verified is false or missing", email);
            recordInspectorTrace(email, "FAILED", "Google ID token email_verified claim is false or missing.",
                    inspectorService.createStandardSteps(email, null, false, "Email is unverified with Google", maskedClaims),
                    maskedClaims, clientIp, userAgent);
            throw new OidcAuthExceptions.UnverifiedEmailException("Google account email is not verified. Please verify your Google email address.");
        }

        // Rule 2: Validate issuer is Google
        String issuer = oidcUser.getIdToken().getIssuer() != null ? oidcUser.getIdToken().getIssuer().toString() : "";
        if (!issuer.contains("accounts.google.com")) {
            log.warn("OIDC login rejected for email={}: invalid issuer '{}'", email, issuer);
            recordInspectorTrace(email, "FAILED", "Invalid token issuer: " + issuer,
                    inspectorService.createStandardSteps(email, null, false, "Issuer is not Google accounts", maskedClaims),
                    maskedClaims, clientIp, userAgent);
            throw new OAuth2AuthenticationException("Invalid token issuer. Identity provider is not trusted.");
        }

        // Rule 3: Configurable hosted domain (hd) check
        String allowedDomain = properties.getAllowedDomain();
        if (allowedDomain != null && !allowedDomain.isBlank()) {
            String hd = (String) rawClaims.get("hd");
            if (hd == null || !allowedDomain.equalsIgnoreCase(hd)) {
                log.warn("OIDC login rejected for email={}: hosted domain '{}' does not match allowed domain '{}'", email, hd, allowedDomain);
                recordInspectorTrace(email, "FAILED", "Hosted domain mismatch: required '" + allowedDomain + "', got '" + hd + "'",
                        inspectorService.createStandardSteps(email, null, false, "Domain mismatch: requires @" + allowedDomain, maskedClaims),
                        maskedClaims, clientIp, userAgent);
                throw new OidcAuthExceptions.UnauthorizedDomainException("Google domain @" + hd + " is not authorized. Must be @" + allowedDomain);
            }
        }

        // Rule 4: Look up email in Meridian database
        Optional<Employee> employeeOpt = employeeRepository.findByEmailWithDepartmentAndManager(email);

        if (employeeOpt.isEmpty()) {
            log.warn("OIDC login rejected: authenticated Google email '{}' not found in Meridian employees database", email);
            recordInspectorTrace(email, "DENIED_UNAUTHORIZED", "Authenticated with Google, but not registered in Meridian.",
                    inspectorService.createStandardSteps(email, null, false, "Employee not registered in Meridian directory", maskedClaims),
                    maskedClaims, clientIp, userAgent);
            throw new OidcAuthExceptions.UnauthorizedEmployeeException(email,
                    "Your Google account (" + email + ") is authenticated, but you are not registered in the Meridian directory.");
        }

        Employee employee = employeeOpt.get();

        // Rule 5: Status must be ACTIVE
        if (employee.getStatus() != EmploymentStatus.ACTIVE) {
            log.warn("OIDC login rejected: employee '{}' is INACTIVE / deactivated", email);
            recordInspectorTrace(email, "DENIED_INACTIVE", "Employee account status is INACTIVE.",
                    inspectorService.createStandardSteps(email, employee.getRole().name(), false, "Employee account is inactive/deactivated", maskedClaims),
                    maskedClaims, clientIp, userAgent);
            throw new OidcAuthExceptions.InactiveEmployeeException(email,
                    "Your Meridian account is currently inactive. Please contact your HR administrator.");
        }

        // Update Google subject ID and profile photo if available
        boolean updated = false;
        String sub = oidcUser.getSubject();
        if (sub != null && !sub.equals(employee.getGoogleSub())) {
            employee.setGoogleSub(sub);
            updated = true;
        }
        String picture = (String) rawClaims.get("picture");
        if (picture != null && !picture.isBlank() && !picture.equals(employee.getAvatarUrl())) {
            employee.setAvatarUrl(picture);
            updated = true;
        }
        if (updated) {
            employeeRepository.save(employee);
        }

        // Map organizational role to Spring Security Authority
        Role role = employee.getRole();
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(role.toAuthority()));

        // Record successful trace in Inspector
        List<AuthStepDto> successSteps = inspectorService.createStandardSteps(email, role.name(), true, null, maskedClaims);
        recordInspectorTrace(email, "SUCCESS", "Identity verified via Google OIDC and authorized as " + role.name(),
                successSteps, maskedClaims, clientIp, userAgent);

        log.info("OIDC authentication & authorization SUCCESS for email='{}', role='{}'", email, role);
        return new MeridianOidcUser(oidcUser, employee, authorities);
    }

    private void recordInspectorTrace(String email, String outcome, String summary,
                                      List<AuthStepDto> steps, Map<String, Object> claims,
                                      String ip, String userAgent) {
        Map<String, Object> sessionMeta = Map.of(
                "cookiePolicy", "HttpOnly; SameSite=Lax",
                "idleTimeoutMinutes", properties.getSessionIdleTimeoutMinutes(),
                "maxTimeoutHours", properties.getSessionAbsoluteTimeoutHours()
        );
        inspectorService.recordTrace(email, outcome, summary, steps, claims, sessionMeta, ip, userAgent);
    }

    private HttpServletRequest getCurrentHttpRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }
}

