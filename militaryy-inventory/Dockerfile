FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Alpine üzerine resmi maven kuralım
RUN apk add --no-cache maven

# Proje dosyalarını kopyalayalım
COPY . .

# Standart maven komutu ile derleyelim
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]