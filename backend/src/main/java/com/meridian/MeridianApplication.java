package com.meridian;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MeridianApplication {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(MeridianApplication.class, args);
    }

    private static void loadDotenv() {
        java.nio.file.Path[] candidates = new java.nio.file.Path[] {
                java.nio.file.Paths.get(".env"),
                java.nio.file.Paths.get("..", ".env")
        };
        for (java.nio.file.Path path : candidates) {
            if (java.nio.file.Files.exists(path)) {
                try {
                    for (String line : java.nio.file.Files.readAllLines(path)) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#"))
                            continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String val = line.substring(eq + 1).trim();
                            System.setProperty(key, val);
                            if (key.equals("MAIL_USERNAME")) {
                                System.setProperty("spring.mail.username", val);
                            } else if (key.equals("MAIL_PASSWORD")) {
                                System.setProperty("spring.mail.password", val);
                            } else if (key.equals("MAIL_HOST")) {
                                System.setProperty("spring.mail.host", val);
                            } else if (key.equals("MAIL_PORT")) {
                                System.setProperty("spring.mail.port", val);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
