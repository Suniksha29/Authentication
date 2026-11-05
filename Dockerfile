# ==============================================================================
# Multi-Stage Production Dockerfile for Meridian Enterprise Portal
# ==============================================================================

# Stage 1: Build React 18 + TypeScript SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot 3 Executable JAR with Eclipse Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /build

COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
# Download dependencies for layer caching
RUN mvn -f backend/pom.xml dependency:go-offline -B

COPY backend/src backend/src
# Copy compiled frontend static assets from Stage 1 into Spring static resources
COPY --from=frontend-builder /build/backend/src/main/resources/static backend/src/main/resources/static

RUN mvn -f backend/pom.xml clean package -DskipTests -B

# Stage 3: Minimal, Hardened Production Runtime (JRE 17 Alpine)
FROM eclipse-temurin:17-jre-alpine AS runtime

LABEL maintainer="Meridian Security Engineering Team"
LABEL description="Production-grade HRMS Portal demonstrating Google OAuth2/OIDC & Authorization"

# Create non-root system group and user
RUN addgroup -S meridian && adduser -S meridian -G meridian

WORKDIR /app

# Copy executable jar from builder stage
COPY --from=backend-builder --chown=meridian:meridian /build/backend/target/meridian-backend-1.0.0.jar app.jar

# Install curl for Docker health check
RUN apk add --no-cache curl

# Drop privileges to non-root user
USER meridian:meridian

EXPOSE 8080

# Production JVM ergonomics: memory container limits, GC optimization
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

# Container healthcheck querying Actuator health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]

