package com.meridian.security;

import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

public class OidcAuthExceptions {

    public static class UnverifiedEmailException extends OAuth2AuthenticationException {
        public UnverifiedEmailException(String message) {
            super(new OAuth2Error("unverified_email", message, null));
        }
    }

    public static class UnauthorizedDomainException extends OAuth2AuthenticationException {
        public UnauthorizedDomainException(String message) {
            super(new OAuth2Error("invalid_domain", message, null));
        }
    }

    public static class UnauthorizedEmployeeException extends OAuth2AuthenticationException {
        private final String email;

        public UnauthorizedEmployeeException(String email, String message) {
            super(new OAuth2Error("unauthorized_employee", message, null));
            this.email = email;
        }

        public String getEmail() { return email; }
    }

    public static class InactiveEmployeeException extends OAuth2AuthenticationException {
        private final String email;

        public InactiveEmployeeException(String email, String message) {
            super(new OAuth2Error("inactive_employee", message, null));
            this.email = email;
        }

        public String getEmail() { return email; }
    }
}

