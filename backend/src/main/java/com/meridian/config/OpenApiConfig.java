package com.meridian.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI meridianOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Meridian Enterprise Portal API")
                        .description("Production-grade HRMS API demonstrating Google OAuth2/OIDC and Role-Based Authorization")
                        .version("1.0.0")
                        .contact(new Contact().name("Identity Platform Team").email("security@meridian.internal")))
                .addSecurityItem(new SecurityRequirement().addList("CookieAuth"))
                .components(new Components()
                        .addSecuritySchemes("CookieAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("SESSION")));
    }
}

