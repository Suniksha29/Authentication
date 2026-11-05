package com.meridian.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "meridian")
public class MeridianProperties {

    /**
     * Optional Google hosted domain restriction (e.g. "example.com").
     * When set, Google ID tokens must have an "hd" claim matching this value.
     */
    private String allowedDomain = "";

    /**
     * Initial admin email to seed/promote if found in the database.
     */
    private String bootstrapAdminEmail = "admin@meridian.internal";

    /**
     * Session idle timeout in minutes.
     */
    private int sessionIdleTimeoutMinutes = 30;

    /**
     * Session absolute maximum timeout in hours.
     */
    private int sessionAbsoluteTimeoutHours = 8;

    /**
     * Rate limiting settings.
     */
    private RateLimit rateLimit = new RateLimit();

    /**
     * Enable demo trace generation in Auth Flow Inspector.
     */
    private boolean demoMode = true;

    public static class RateLimit {
        private int apiRequestsPerMinute = 120;
        private int authRequestsPerMinute = 20;

        public int getApiRequestsPerMinute() { return apiRequestsPerMinute; }
        public void setApiRequestsPerMinute(int apiRequestsPerMinute) { this.apiRequestsPerMinute = apiRequestsPerMinute; }

        public int getAuthRequestsPerMinute() { return authRequestsPerMinute; }
        public void setAuthRequestsPerMinute(int authRequestsPerMinute) { this.authRequestsPerMinute = authRequestsPerMinute; }
    }

    public String getAllowedDomain() { return allowedDomain; }
    public void setAllowedDomain(String allowedDomain) { this.allowedDomain = allowedDomain; }

    public String getBootstrapAdminEmail() { return bootstrapAdminEmail; }
    public void setBootstrapAdminEmail(String bootstrapAdminEmail) { this.bootstrapAdminEmail = bootstrapAdminEmail; }

    public int getSessionIdleTimeoutMinutes() { return sessionIdleTimeoutMinutes; }
    public void setSessionIdleTimeoutMinutes(int sessionIdleTimeoutMinutes) { this.sessionIdleTimeoutMinutes = sessionIdleTimeoutMinutes; }

    public int getSessionAbsoluteTimeoutHours() { return sessionAbsoluteTimeoutHours; }
    public void setSessionAbsoluteTimeoutHours(int sessionAbsoluteTimeoutHours) { this.sessionAbsoluteTimeoutHours = sessionAbsoluteTimeoutHours; }

    public RateLimit getRateLimit() { return rateLimit; }
    public void setRateLimit(RateLimit rateLimit) { this.rateLimit = rateLimit; }

    public boolean isDemoMode() { return demoMode; }
    public void setDemoMode(boolean demoMode) { this.demoMode = demoMode; }
}

