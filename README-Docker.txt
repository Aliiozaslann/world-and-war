KURULUM

1. ZIP'i acin.
2. Terminalde, Dockerfile ile pom.xml dosyasinin ayni klasorde oldugu dizine girin.
3. docker build -t militaryy-inventory .
4. docker run --rm -p 8080:8080 militaryy-inventory
5. Tarayicida http://localhost:8080 adresini acin.

ONEMLI: Docker build komutunu bu klasorun icinde calistirin. Dockerfile bu klasorun kokundedir.
