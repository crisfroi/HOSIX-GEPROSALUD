FROM gradle:9.5-jdk17 as builder
WORKDIR /opt/app
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY src ./src
RUN gradle shadowJar --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /opt/app/build/libs/optaplanner-kotlin-all.jar ./optaplanner-kotlin-all.jar
EXPOSE 8080
CMD ["java", "-jar", "optaplanner-kotlin-all.jar"]
