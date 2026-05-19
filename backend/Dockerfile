# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache de dependencias antes de copiar el código fuente
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Compilar la aplicación
COPY src ./src
RUN mvn package -DskipTests -B -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Crear directorio de uploads para imagenes
RUN mkdir -p /app/uploads

# Copiar el JAR generado
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", "-jar", "app.jar"]
