package com.meridian.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
public class SessionConfig {

    @Configuration
    @ConditionalOnProperty(name = "spring.session.store-type", havingValue = "redis", matchIfMissing = true)
    @EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // 30 minutes idle timeout
    public static class RedisSessionConfiguration {
    }

    @Bean
    @ConditionalOnProperty(name = "spring.session.store-type", havingValue = "redis", matchIfMissing = true)
    public CookieSerializer cookieSerializer(MeridianProperties properties) {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("SESSION");
        serializer.setCookiePath("/");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setSameSite("Lax");
        serializer.setUseSecureCookie(false);
        serializer.setCookieMaxAge(properties.getSessionAbsoluteTimeoutHours() * 3600);
        return serializer;
    }
}
