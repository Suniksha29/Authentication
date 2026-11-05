# ==============================================================================
# Production Dockerfile for Meridian Enterprise Backend (Root Context)
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

RUN mvn -f backend/pom.xml clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S meridian && adduser -S meridian -G meridian \
    && mkdir -p /app/data \
    && chown -R meridian:meridian /app \
    && chmod -R 775 /app

COPY --from=builder --chown=meridian:meridian /build/backend/target/meridian-backend-1.0.0.jar app.jar
RUN apk add --no-cache curl
USER meridian:meridian

ENV PORT=8082
EXPOSE 8082 10000

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:${PORT:-8082}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8082} -jar app.jar"]
