# Stage 1: Build the JAR using Maven + JDK 25
FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Slim JRE 25 runtime (non-root)
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN addgroup -S finguard && adduser -S finguard -G finguard
USER finguard

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
