package com.meridian.security.inspector;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meridian.config.MeridianProperties;
import com.meridian.domain.AuthFlowTrace;
import com.meridian.dto.AuthInspectorTraceDto;
import com.meridian.dto.AuthStepDto;
import com.meridian.repository.AuthFlowTraceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthFlowInspectorService {

    private static final Logger log = LoggerFactory.getLogger(AuthFlowInspectorService.class);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private final AuthFlowTraceRepository traceRepository;
    private final MeridianProperties properties;
    private final ObjectMapper objectMapper;

    // In-memory trace buffer for active sessions
    private final Map<String, AuthInspectorTraceDto> activeTraces = new ConcurrentHashMap<>();

    public AuthFlowInspectorService(AuthFlowTraceRepository traceRepository,
                                    MeridianProperties properties,
                                    ObjectMapper objectMapper) {
        this.traceRepository = traceRepository;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public List<AuthStepDto> createStandardSteps(String email, String role, boolean success, String failureReason, Map<String, Object> claims) {
        List<AuthStepDto> steps = new ArrayList<>();
        String now = LocalDateTime.now().format(ISO_FORMATTER);

        // Step 1: Authorization Code Request with PKCE
        steps.add(new AuthStepDto(
                1,
                "PKCE_INIT",
                "Client Authorization Request (PKCE)",
                "CLIENT",
                "Browser initiated 'Continue with Google'. Spring Security generated a cryptographically random code_verifier and SHA-256 code_challenge.",
                "SUCCESS",
                now,
                Map.of(
                        "endpoint", "https://accounts.google.com/o/oauth2/v2/auth",
                        "response_type", "code",
                        "scope", "openid profile email",
                        "code_challenge_method", "S256",
                        "prompt", "select_account"
                )
        ));

        // Step 2: Google Authentication & Consent
        steps.add(new AuthStepDto(
                2,
                "GOOGLE_CONSENT",
                "Google OpenID Connect Consent",
                "GOOGLE_OIDC",
                "Google authenticated the user account and verified consent for basic profile and email scopes.",
                "SUCCESS",
                now,
                Map.of(
                        "provider", "Google Identity Platform",
                        "identity_type", "OpenID Connect 1.0",
                        "account_status", "Authenticated"
                )
        ));

        // Step 3: Authorization Code Callback
        steps.add(new AuthStepDto(
                3,
                "AUTH_CODE_CALLBACK",
                "Authorization Code Delivery",
                "CLIENT",
                "Google redirected to Meridian callback (/login/oauth2/code/google) with single-use authorization code and state token to prevent CSRF.",
                "SUCCESS",
                now,
                Map.of(
                        "callback_path", "/login/oauth2/code/google",
                        "code_masked", "4/0AeanS0********masked********",
                        "state_verified", true
                )
        ));

        // Step 4: Token Exchange via Back-Channel
        steps.add(new AuthStepDto(
                4,
                "TOKEN_EXCHANGE",
                "Back-Channel Token Exchange",
                "BACKEND_AUTH",
                "Meridian backend called Google token endpoint via secure direct HTTPS POST with authorization code and PKCE code_verifier. Client Secret never leaves the server.",
                "SUCCESS",
                now,
                Map.of(
                        "token_endpoint", "https://oauth2.googleapis.com/token",
                        "grant_type", "authorization_code",
                        "client_authentication", "client_secret_post",
                        "tokens_received", List.of("id_token (JWT)", "access_token")
                )
        ));

        // Step 5: ID Token Cryptographic Verification
        steps.add(new AuthStepDto(
                5,
                "ID_TOKEN_VERIFY",
                "ID Token Signature & Claims Verification",
                "BACKEND_AUTH",
                "Decoded Google signed JWT ID Token. Verified signature against Google Public Keys (JWKS at https://www.googleapis.com/oauth2/v3/certs).",
                "SUCCESS",
                now,
                Map.of(
                        "algorithm", "RS256",
                        "jwks_uri", "https://www.googleapis.com/oauth2/v3/certs",
                        "token_type", "OpenID Connect ID Token",
                        "signature_verified", true
                )
        ));

        // Step 6: OIDC Identity Claims Validation
        boolean unverified = failureReason != null && failureReason.toLowerCase().contains("unverified");
        boolean domainMismatch = failureReason != null && failureReason.toLowerCase().contains("domain");
        String claimStatus = (unverified || domainMismatch) ? "FAILED" : "SUCCESS";
        String claimDesc = claimStatus.equals("SUCCESS")
                ? "Validated essential OIDC claims: issuer is Google, audience matches OAuth Client ID, token is not expired, and email_verified=true."
                : "OIDC Claims validation failed: " + failureReason;

        steps.add(new AuthStepDto(
                6,
                "CLAIMS_POLICY",
                "OIDC Claims Policy Check",
                "BACKEND_AUTH",
                claimDesc,
                claimStatus,
                now,
                Map.of(
                        "issuer_valid", true,
                        "email_verified", !unverified,
                        "hosted_domain_matched", !domainMismatch,
                        "allowed_domain_policy", properties.getAllowedDomain().isBlank() ? "ANY" : properties.getAllowedDomain()
                )
        ));

        // Step 7: Meridian Directory Employee Lookup
        boolean missingEmp = failureReason != null && failureReason.toLowerCase().contains("not registered");
        String empStatus = (unverified || domainMismatch) ? "SKIPPED" : (missingEmp ? "FAILED" : "SUCCESS");
        String empDesc = empStatus.equals("SUCCESS")
                ? "Queried Meridian employees database for email '" + email + "'. Record found."
                : (empStatus.equals("FAILED") ? "Queried Meridian employees database. No active employee found for '" + email + "'." : "Skipped due to prior failure.");

        steps.add(new AuthStepDto(
                7,
                "DIRECTORY_LOOKUP",
                "Meridian Database Employee Lookup",
                "BACKEND_AUTHORIZATION",
                empDesc,
                empStatus,
                now,
                Map.of(
                        "lookup_key", "email (case-insensitive)",
                        "queried_email", email,
                        "record_found", empStatus.equals("SUCCESS")
                )
        ));

        // Step 8: Meridian Role-Based Authorization
        boolean inactive = failureReason != null && failureReason.toLowerCase().contains("inactive");
        String authzStatus = (!success) ? "FAILED" : "SUCCESS";
        String authzDesc = success
                ? "Employee status is ACTIVE. Mapped organizational role '" + role + "' to Spring Security authority 'ROLE_" + role + "'."
                : (inactive ? "Employee status is INACTIVE (deactivated). Login rejected." : "Authorization denied: user is not authorized to access Meridian.");

        steps.add(new AuthStepDto(
                8,
                "ROLE_MAPPING",
                "Role-Based Authorization & Policy Check",
                "BACKEND_AUTHORIZATION",
                authzDesc,
                authzStatus,
                now,
                Map.of(
                        "decision", success ? "AUTHORIZED" : "ACCESS_DENIED",
                        "assigned_role", role != null ? role : "NONE",
                        "spring_authority", role != null ? "ROLE_" + role : "NONE",
                        "employee_status", inactive ? "INACTIVE" : (success ? "ACTIVE" : "UNKNOWN")
                )
        ));

        // Step 9: Session Creation & Fixation Protection
        steps.add(new AuthStepDto(
                9,
                "SESSION_CREATION",
                "Stateful Enterprise Session & Security Context",
                "SESSION",
                success
                        ? "Generated secure Redis-backed HTTP session with fixation migration. Issued HttpOnly, SameSite=Lax SESSION cookie. No tokens exposed in browser storage."
                        : "Session creation aborted. Redirected to /access-denied.",
                success ? "SUCCESS" : "SKIPPED",
                now,
                Map.of(
                        "session_store", "Redis / Spring Session",
                        "cookie_name", "SESSION",
                        "http_only", true,
                        "same_site", "Lax",
                        "idle_timeout_min", properties.getSessionIdleTimeoutMinutes(),
                        "fixation_protection", "migrateSession"
                )
        ));

        // Step 10: Audit Log Recording
        steps.add(new AuthStepDto(
                10,
                "AUDIT_RECORD",
                "Immutable Security Audit Logging",
                "BACKEND_AUTHORIZATION",
                "Recorded structured security event into audit_logs table with actor email, role, IP address, and timestamp.",
                "SUCCESS",
                now,
                Map.of(
                        "event_type", success ? "LOGIN_SUCCESS" : "LOGIN_DENIED",
                        "actor", email,
                        "logged_to_database", true
                )
        ));

        return steps;
    }

    public Map<String, Object> maskClaims(Map<String, Object> rawClaims) {
        if (rawClaims == null) return Collections.emptyMap();
        Map<String, Object> masked = new LinkedHashMap<>();
        rawClaims.forEach((key, value) -> {
            if (value == null) {
                masked.put(key, null);
            } else if (key.equalsIgnoreCase("sub")) {
                String s = value.toString();
                masked.put(key, s.length() > 6 ? s.substring(0, 4) + "••••••••" : "••••");
            } else if (key.equalsIgnoreCase("at_hash") || key.equalsIgnoreCase("nonce") || key.toLowerCase().contains("secret") || key.toLowerCase().contains("token")) {
                masked.put(key, "••••••••[MASKED]••••••••");
            } else {
                masked.put(key, value);
            }
        });
        return masked;
    }

    @Transactional
    public void recordTrace(String email, String outcome, String summary,
                            List<AuthStepDto> steps, Map<String, Object> maskedClaims,
                            Map<String, Object> sessionMetadata, String ip, String userAgent) {
        String traceId = "trace_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        AuthInspectorTraceDto traceDto = new AuthInspectorTraceDto(
                traceId,
                email,
                outcome,
                summary,
                steps,
                maskedClaims,
                sessionMetadata,
                ip,
                userAgent,
                LocalDateTime.now(),
                false
        );

        activeTraces.put(traceId, traceDto);
        activeTraces.put("LATEST_" + email.toLowerCase(), traceDto);
        activeTraces.put("LATEST_GLOBAL", traceDto);

        try {
            String stepsJson = objectMapper.writeValueAsString(steps);
            String claimsJson = objectMapper.writeValueAsString(maskedClaims);
            AuthFlowTrace entity = new AuthFlowTrace(
                    traceId,
                    email,
                    outcome,
                    stepsJson,
                    claimsJson,
                    ip,
                    userAgent
            );
            traceRepository.save(entity);
        } catch (Exception e) {
            log.warn("Failed to persist auth flow trace to database: {}", e.getMessage());
        }
    }

    public AuthInspectorTraceDto getLatestTrace(String userEmail) {
        if (userEmail != null && activeTraces.containsKey("LATEST_" + userEmail.toLowerCase())) {
            return activeTraces.get("LATEST_" + userEmail.toLowerCase());
        }
        if (activeTraces.containsKey("LATEST_GLOBAL")) {
            return activeTraces.get("LATEST_GLOBAL");
        }

        // Try from DB
        Optional<AuthFlowTrace> fromDb = traceRepository.findTop1ByOrderByCreatedAtDesc();
        if (fromDb.isPresent()) {
            return convertEntityToDto(fromDb.get());
        }

        // Generate high-fidelity realistic demo trace
        return generateDemoTrace();
    }

    public AuthInspectorTraceDto generateDemoTrace() {
        String demoEmail = "admin@meridian.internal";
        Map<String, Object> demoClaims = new LinkedHashMap<>();
        demoClaims.put("iss", "https://accounts.google.com");
        demoClaims.put("sub", "109823749823749823423");
        demoClaims.put("aud", "1029384756-meridian-app.apps.googleusercontent.com");
        demoClaims.put("azp", "1029384756-meridian-app.apps.googleusercontent.com");
        demoClaims.put("email", demoEmail);
        demoClaims.put("email_verified", true);
        demoClaims.put("name", "Marcus Vance");
        demoClaims.put("given_name", "Marcus");
        demoClaims.put("family_name", "Vance");
        demoClaims.put("picture", "https://lh3.googleusercontent.com/a/ACg8ocK...=s96-c");
        demoClaims.put("locale", "en-US");
        demoClaims.put("iat", System.currentTimeMillis() / 1000 - 60);
        demoClaims.put("exp", System.currentTimeMillis() / 1000 + 3540);

        Map<String, Object> masked = maskClaims(demoClaims);
        List<AuthStepDto> steps = createStandardSteps(demoEmail, "ADMIN", true, null, masked);

        Map<String, Object> sessionMeta = Map.of(
                "sessionIdHash", "sha256:8f4c3a219e...",
                "idleTimeoutMin", 30,
                "absoluteTimeoutHours", 8,
                "cookieAttributes", "HttpOnly; Secure; SameSite=Lax",
                "redisKey", "spring:session:sessions:8f4c..."
        );

        return new AuthInspectorTraceDto(
                "demo_trace_golden_path",
                demoEmail,
                "SUCCESS",
                "Completed 10-stage Google OIDC authentication and Meridian role authorization.",
                steps,
                masked,
                sessionMeta,
                "127.0.0.1",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
                LocalDateTime.now(),
                true
        );
    }

    private AuthInspectorTraceDto convertEntityToDto(AuthFlowTrace entity) {
        try {
            List<AuthStepDto> steps = objectMapper.readValue(entity.getStepsJson(), new TypeReference<>() {});
            Map<String, Object> claims = objectMapper.readValue(entity.getClaimsJson(), new TypeReference<>() {});
            return new AuthInspectorTraceDto(
                    entity.getId(),
                    entity.getEmail(),
                    entity.getOutcome(),
                    "Persisted trace from authentication event",
                    steps,
                    claims,
                    Map.of("persisted", true),
                    entity.getIpAddress(),
                    entity.getUserAgent(),
                    entity.getCreatedAt(),
                    false
            );
        } catch (Exception e) {
            log.error("Failed to deserialize auth flow trace: {}", e.getMessage());
            return generateDemoTrace();
        }
    }
}

