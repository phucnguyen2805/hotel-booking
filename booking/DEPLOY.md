# Hướng dẫn deploy demo online

## Cách 1: Railway / Render (Spring Boot)

1. Đẩy code lên GitHub (repo public/private).
2. Tạo service mới từ GitHub repo.
3. Root directory: `booking`
4. Build command: `./mvnw -DskipTests package`
5. Start command: `java -jar target/*.jar`
6. Thêm biến môi trường AWS (DynamoDB):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
7. Mở URL public mà platform cấp.

## Cách 2: Chạy local + tunnel (demo nhanh)

```bash
cd booking
./mvnw spring-boot:run
```

Dùng ngrok:

```bash
ngrok http 8080
```

Gửi URL `https://....ngrok.io` cho bạn bè.

## Lưu ý

- Không commit AWS secret lên GitHub.
- Sau deploy, gọi seed từ Admin → **Seed dữ liệu mẫu** nếu bảng trống.
- PWA: mở site bằng HTTPS để cài ra màn hình chính.
