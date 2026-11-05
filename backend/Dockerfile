# ==============================================================================
# Production Dockerfile for Meridian Enterprise Backend (Backend Context)
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

COPY pom.xml ./
COPY src ./src

RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app

RUN addgroup -S meridian && adduser -S meridian -G meridian \
    && mkdir -p /app/data \
    && chown -R meridian:meridian /app \
    && chmod -R 775 /app

COPY --from=builder --chown=meridian:meridian /app/target/meridian-backend-1.0.0.jar app.jar
RUN apk add --no-cache curl
USER meridian:meridian

ENV PORT=8082
EXPOSE 8082 10000

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8082}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT:-8082} -jar app.jar"]

