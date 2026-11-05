package com.meridian.controller;

import com.meridian.domain.AuditAction;
import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.RegistrationRequest;
import com.meridian.dto.ApiResponse;
import com.meridian.dto.SentEmailDto;
import com.meridian.dto.UserProfileDto;
import com.meridian.repository.EmployeeRepository;
import com.meridian.service.AuditService;
import com.meridian.service.EmailOutboxService;
import com.meridian.service.EmployeeService;
import com.meridian.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication & Session", description = "Current user session, profile, and registration endpoints")
public class AuthController {

    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;
    private final RegistrationService registrationService;
    private final EmailOutboxService emailOutboxService;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${meridian.bootstrap-admin-email:suniksha2329@gmail.com}")
    private String bootstrapEmail;

    public AuthController(EmployeeService employeeService,
                          EmployeeRepository employeeRepository,
                          AuditService auditService,
                          RegistrationService registrationService,
                          EmailOutboxService emailOutboxService,
                          PasswordEncoder passwordEncoder) {
        this.employeeService = employeeService;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
        this.registrationService = registrationService;
        this.emailOutboxService = emailOutboxService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser() {
        UserProfileDto profile = employeeService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @GetMapping("/status")
    @Operation(summary = "Check authentication status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuthStatus(Authentication authentication) {
        boolean authenticated = authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal());

        if (authenticated) {
            UserProfileDto profile = employeeService.getCurrentUserProfile();
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "authenticated", true,
                    "email", profile.email(),
                    "role", profile.role(),
                    "fullName", profile.fullName(),
                    "avatarUrl", profile.avatarUrl() != null ? profile.avatarUrl() : ""
            )));
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("authenticated", false)));
    }

    @GetMapping("/config")
    @Operation(summary = "Get auth configuration capabilities")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuthConfig() {
        boolean googleReady = googleClientId != null
                && !googleClientId.isBlank()
                && !googleClientId.contains("placeholder")
                && !googleClientId.contains("your-actual");

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "googleConfigured", googleReady,
                "bootstrapAdminEmail", bootstrapEmail != null ? bootstrapEmail : "suniksha2329@gmail.com"
        )));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in directly with corporate email and password or demo credentials")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        Employee employee = employeeRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (employee == null || employee.getStatus() != EmploymentStatus.ACTIVE) {
            auditService.record(
                    AuditAction.LOGIN_DENIED,
                    email,
                    "ANONYMOUS",
                    "auth/session",
                    AuditService.extractClientIp(request),
                    request.getHeader("User-Agent"),
                    "Login denied: " + (employee == null ? "Email not registered" : "Account is INACTIVE")
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password"));
        }

        // Validate password if employee has password hash stored
        if (employee.getPasswordHash() != null && !employee.getPasswordHash().isBlank()) {
            if (password == null || password.isBlank() || !passwordEncoder.matches(password, employee.getPasswordHash())) {
                auditService.record(
                        AuditAction.LOGIN_DENIED,
                        email,
                        "ANONYMOUS",
                        "auth/session",
                        AuditService.extractClientIp(request),
                        request.getHeader("User-Agent"),
                        "Login denied: Incorrect password"
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid email or password"));
            }
        }

        String roleAuthority = "ROLE_" + employee.getRole().name();
        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(roleAuthority));

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(employee.getEmail(), null, authorities);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        auditService.record(
                AuditAction.LOGIN_SUCCESS,
                employee.getEmail(),
                employee.getRole().name(),
                "auth/session",
                AuditService.extractClientIp(request),
                request.getHeader("User-Agent"),
                "User successfully authenticated and authorized as " + employee.getRole().name()
        );

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "authenticated", true,
                "redirect", "/dashboard",
                "email", employee.getEmail(),
                "role", employee.getRole().name(),
                "fullName", employee.getFullName()
        )));
    }

    @PostMapping("/register")
    @Operation(summary = "Submit new candidate account registration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String fullName = body.get("fullName");
        String email = body.get("email");
        String password = body.get("password");

        if (fullName == null || fullName.trim().length() < 2) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Full name must be at least 2 characters"));
        }
        if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please enter a valid work email address"));
        }
        if (password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 8 characters"));
        }

        try {
            RegistrationRequest reg = registrationService.register(fullName, email, password, request);
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "registered", true,
                    "email", reg.getEmail(),
                    "fullName", reg.getFullName(),
                    "status", reg.getStatus().name(),
                    "message", "Registration received. Please check your inbox for verification."
            )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify candidate email with token link")
    public void verifyEmail(@RequestParam(value = "token", required = false) String token, HttpServletResponse response) throws IOException {
        if (token == null || token.isBlank()) {
            response.sendRedirect("/login?error=invalid_verification_token");
            return;
        }
        Optional<RegistrationRequest> opt = registrationService.verifyEmail(token);
        if (opt.isPresent()) {
            RegistrationRequest reg = opt.get();
            String encodedEmail = URLEncoder.encode(reg.getEmail(), StandardCharsets.UTF_8);
            response.sendRedirect("/awaiting-approval?verified=true&email=" + encodedEmail);
        } else {
            response.sendRedirect("/login?error=invalid_verification_token");
        }
    }

    @GetMapping(value = "/approve-registration", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Admin 1-click registration approval endpoint")
    public String approveRegistration(@RequestParam(value = "token", required = false) String token) {
        if (token == null || token.isBlank()) {
            return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Invalid Token - Meridian</title>"
                    + "<style>body{margin:0;padding:40px;background:#FAFAF8;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:80vh;}"
                    + ".card{max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;text-align:center;}"
                    + "h2{color:#b91c1c;}p{color:#64748b;font-size:14px;}</style></head><body>"
                    + "<div class='card'><h2>Missing Approval Token</h2><p>No valid approval token was provided in the link.</p><a href='/dashboard' style='color:#0f172a;font-weight:600;'>Return to Dashboard</a></div></body></html>";
        }
        Optional<RegistrationRequest> opt = registrationService.approveRegistration(token);
        if (opt.isPresent()) {
            RegistrationRequest reg = opt.get();
            return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Account Approved - Meridian</title>"
                    + "<style>"
                    + "body { margin: 0; padding: 40px 20px; background: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 80vh; color: #0B0D11; }"
                    + ".card { max-width: 520px; width: 100%; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }"
                    + ".badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #DCFCE7; color: #166534; font-size: 12px; font-weight: 700; border-radius: 999px; margin-bottom: 20px; border: 1px solid #BBF7D0; }"
                    + "h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px; color: #0B0D11; letter-spacing: -0.02em; }"
                    + "p { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px; }"
                    + ".details { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin-bottom: 28px; text-align: left; font-size: 13px; }"
                    + ".btn { display: inline-block; background: #0B0D11; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.2s; }"
                    + ".btn:hover { background: #1E293B; }"
                    + "</style></head><body>"
                    + "<div class='card'>"
                    + "<div class='badge'>&#10003; ACCOUNT ACTIVATED</div>"
                    + "<h1>Registration Approved</h1>"
                    + "<p>You have authorized and activated the account for <strong>" + escape(reg.getFullName()) + "</strong>. The employee has been marked <strong>ACTIVE</strong> in the directory.</p>"
                    + "<div class='details'>"
                    + "<div><strong>Full Name:</strong> " + escape(reg.getFullName()) + "</div>"
                    + "<div style='margin-top:6px;'><strong>Work Email:</strong> " + escape(reg.getEmail()) + "</div>"
                    + "<div style='margin-top:6px;'><strong>Directory Status:</strong> <span style='color:#166534;font-weight:600;'>ACTIVE</span></div>"
                    + "</div>"
                    + "<a class='btn' href='/dashboard'>Go to Meridian Dashboard &rarr;</a>"
                    + "</div>"
                    + "</body></html>";
        } else {
            return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Invalid or Expired - Meridian</title>"
                    + "<style>body{margin:0;padding:40px;background:#FAFAF8;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:80vh;}"
                    + ".card{max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;text-align:center;}"
                    + "h2{color:#0f172a;}p{color:#64748b;font-size:14px;}</style></head><body>"
                    + "<div class='card'><h2>Registration Already Processed</h2><p>This registration request has already been approved or the token is no longer valid.</p><a href='/dashboard' style='color:#0f172a;font-weight:600;'>Return to Dashboard</a></div></body></html>";
        }
    }

    @GetMapping(value = "/reject-registration", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Admin 1-click registration rejection endpoint")
    public String rejectRegistration(@RequestParam(value = "token", required = false) String token) {
        if (token == null || token.isBlank()) {
            return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Invalid Token - Meridian</title>"
                    + "<style>body{margin:0;padding:40px;background:#FAFAF8;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:80vh;}"
                    + ".card{max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;text-align:center;}"
                    + "h2{color:#b91c1c;}p{color:#64748b;font-size:14px;}</style></head><body>"
                    + "<div class='card'><h2>Missing Rejection Token</h2><p>No valid token was provided in the link.</p><a href='/dashboard' style='color:#0f172a;font-weight:600;'>Return to Dashboard</a></div></body></html>";
        }
        Optional<RegistrationRequest> opt = registrationService.rejectRegistration(token);
        return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Registration Rejected - Meridian</title>"
                + "<style>body{margin:0;padding:40px;background:#FAFAF8;font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:80vh;}"
                + ".card{max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;text-align:center;}"
                + "h2{color:#b91c1c;}p{color:#64748b;font-size:14px;}</style></head><body>"
                + "<div class='card'><h2>Registration Rejected</h2><p>The registration request has been rejected. The account remains inactive.</p><a href='/dashboard' style='color:#0f172a;font-weight:600;'>Return to Dashboard</a></div></body></html>";
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification email to candidate and approval notification to admin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email != null && !email.isBlank()) {
            registrationService.resendVerification(email);
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("resent", true, "message", "Verification email dispatched.")));
    }

    @GetMapping("/outbox")
    @Operation(summary = "Inspect recently dispatched system emails (verification and admin approvals)")
    public ResponseEntity<ApiResponse<List<SentEmailDto>>> getEmailOutbox() {
        return ResponseEntity.ok(ApiResponse.ok(emailOutboxService.getRecentEmails()));
    }

    @GetMapping("/csrf")
    @Operation(summary = "Fetch current CSRF token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCsrfToken(CsrfToken csrfToken) {
        if (csrfToken != null) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "token", csrfToken.getToken(),
                    "headerName", csrfToken.getHeaderName(),
                    "parameterName", csrfToken.getParameterName()
            )));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "none")));
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
