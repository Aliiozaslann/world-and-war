FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Maven paketini alpine tabanlı imaja ekleyelim ve proje dosyalarını kopyalayalım
COPY . .
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]