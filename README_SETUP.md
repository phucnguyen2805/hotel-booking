# Hotel Booking - Bản đã tích hợp NoSQL (Hướng A)

## Công nghệ

| CSDL | Vai trò |
|------|---------|
| **DynamoDB** | Dữ liệu chính: Hotel, Room, User, Booking, Favorite, Audit, Revenue |
| **MongoDB** | Review (collection `reviews`, `hotel_feedbacks`) |
| **Redis** | Cache, leaderboard, OTP (TTL) |
| **Cloudinary** | Lưu ảnh khách sạn / phòng |

## Chạy local

1. MongoDB (port 27017), Redis (6379), DynamoDB Local (8000)
2. Sửa `booking/src/main/resources/application.properties`:
   - Cloudinary cloud-name / api-key / api-secret
3. Tạo bảng DynamoDB: xem `booking/scripts/dynamodb/`
4. Seed Mongo: `mongosh < booking/scripts/mongodb/init.js`
5. Chạy app:
```bash
cd booking
mvnw.cmd spring-boot:run
```
6. Mở http://localhost:8080/search.html và http://localhost:8080/admin.html

## API demo Redis

- POST `/redis/leaderboard/{hotelId}`
- GET `/redis/leaderboard/top`
- POST `/redis/otp/send?email=...`
- POST `/redis/otp/verify?email=...&otp=...`
- POST/GET `/redis/cache?key=...`

## Upload ảnh

- POST `/admin/upload-image` (form-data: file, type=hotel|room)
- Trên Admin UI: chọn file → Upload lên Cloudinary → Lưu

## Tài khoản admin mẫu

Xem dữ liệu seed / bảng USER trong DynamoDB (thường admin@example.com).
