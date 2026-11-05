package com.meridian.config;

import com.meridian.security.*;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final MeridianOidcUserService oidcUserService;
    private final MeridianAuthSuccessHandler successHandler;
    private final MeridianAuthFailureHandler failureHandler;
    private final MeridianLogoutSuccessHandler logoutSuccessHandler;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;
    private final RateLimitingFilter rateLimitingFilter;

    public SecurityConfig(MeridianOidcUserService oidcUserService,
                          MeridianAuthSuccessHandler successHandler,
                          MeridianAuthFailureHandler failureHandler,
                          MeridianLogoutSuccessHandler logoutSuccessHandler,
                          CustomAuthenticationEntryPoint authenticationEntryPoint,
                          CustomAccessDeniedHandler accessDeniedHandler,
                          RateLimitingFilter rateLimitingFilter) {
        this.oidcUserService = oidcUserService;
        this.successHandler = successHandler;
        this.failureHandler = failureHandler;
        this.logoutSuccessHandler = logoutSuccessHandler;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "https://localhost:*",
            "https://*.vercel.app",
            "https://*.onrender.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("X-XSRF-TOKEN", "Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");

        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // CSRF Configuration
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/resend-verification",
                    "/api/auth/verify-email",
                    "/api/auth/approve-registration",
                    "/api/auth/reject-registration",
                    "/actuator/**"
                )
            )

            // Security Headers (OWASP aligned)
            .headers(headers -> {
                headers.contentTypeOptions(HeadersConfigurer.ContentTypeOptionsConfig::disable);
                headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::deny);
                headers.referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                headers.permissionsPolicy(permissions -> permissions.policy("camera=(), microphone=(), geolocation=(), payment=()"));
                headers.contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline'; " +
                    "style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data: https://lh3.googleusercontent.com https://images.unsplash.com; " +
                    "connect-src 'self'; " +
                    "font-src 'self' data:; " +
                    "frame-ancestors 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self' https://accounts.google.com;"
                ));
            })

            // Session Management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().migrateSession()
                .maximumSessions(2)
            )

            // Exception Handling
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )

            // URL Authorization Rules
            .authorizeHttpRequests(auth -> auth
                // Static assets & SPA entry points
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/login",
                    "/register",
                    "/verify-email",
                    "/awaiting-approval",
                    "/access-denied",
                    "/assets/**",
                    "/favicon.ico",
                    "/*.js",
                    "/*.css",
                    "/*.svg",
                    "/*.png",
                    "/*.woff",
                    "/*.woff2"
                ).permitAll()

                // OAuth2 & OIDC endpoints
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

                // Health & OpenApi
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()

                // Public auth status/csrf/login/registration endpoints
                .requestMatchers(
                    "/api/auth/csrf",
                    "/api/auth/status",
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/verify-email",
                    "/api/auth/approve-registration",
                    "/api/auth/reject-registration",
                    "/api/auth/resend-verification",
                    "/api/auth/outbox",
                    "/api/auth/config"
                ).permitAll()

                // Demo Auth Inspector trace (for interactive demoing)
                .requestMatchers(HttpMethod.GET, "/api/auth/inspector/demo").permitAll()

                // All other API endpoints require authentication (fine-grained @PreAuthorize on controllers)
                .requestMatchers("/api/**").authenticated()

                // Any other SPA page routes
                .anyRequest().permitAll()
            )

            // OAuth2 Login with Google OIDC
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService))
                .successHandler(successHandler)
                .failureHandler(failureHandler)
            )

            // Logout
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(logoutSuccessHandler)
                .invalidateHttpSession(true)
                .deleteCookies("SESSION", "JSESSIONID", "XSRF-TOKEN")
                .clearAuthentication(true)
                .permitAll()
            )

            // Add custom filters
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new CsrfCookieFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Filter that forces the CSRF token to be rendered into the cookie
     * on every request, ensuring SPAs always have access to XSRF-TOKEN.
     */
    private static class CsrfCookieFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                // Calling getToken() causes the deferred token to be resolved and written to cookie
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}
