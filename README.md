# Hotel Booking - Đồ án môn NoSQL

## 1. Giới thiệu

**Hotel Booking** là đồ án môn **Cơ sở dữ liệu NoSQL**, xây dựng hệ thống đặt phòng khách sạn trực tuyến với cơ sở dữ liệu **Amazon DynamoDB**.

Đồ án mô phỏng một website đặt phòng hoàn chỉnh, bao gồm phía người dùng và khu vực quản trị. Hệ thống tập trung vào việc thiết kế và khai thác dữ liệu theo mô hình NoSQL, đặc biệt là cách tổ chức khóa, truy vấn dữ liệu và thực hiện các thao tác đặt phòng có tính nhất quán.

## 2. Mục tiêu đồ án

- Xây dựng ứng dụng quản lý và đặt phòng khách sạn sử dụng cơ sở dữ liệu NoSQL.
- Làm quen với DynamoDB và cách thiết kế dữ liệu theo hướng truy vấn.
- Xây dựng API bằng Java Spring Boot.
- Xây dựng giao diện web bằng HTML, CSS và JavaScript.
- Thực hiện các chức năng đăng ký, đăng nhập, tìm kiếm, đặt phòng, thanh toán mô phỏng và quản lý đơn đặt phòng.
- Xây dựng khu vực quản trị để quản lý khách sạn, phòng, người dùng, doanh thu và sao lưu dữ liệu.
- Thực hiện review/đánh giá khách sạn và quản lý danh sách yêu thích.

## 3. Công nghệ sử dụng

### Backend

- **Java 21**
- **Spring Boot 4.1.1**
- **Maven / Maven Wrapper**
- **AWS SDK for Java v2**
- **Amazon DynamoDB**
- REST API

### Frontend

- HTML5
- CSS3
- JavaScript
- Giao diện responsive cho máy tính và thiết bị di động

### Công cụ phát triển

- Visual Studio Code
- Git / GitHub
- Amazon DynamoDB
- Maven

## 4. Kiến trúc tổng quan

```text
Người dùng
    |
    v
HTML / CSS / JavaScript
    |
    | HTTP / REST API
    v
Spring Boot
    |
    +-- Controller
    |
    +-- Service
    |
    +-- DynamoDB Config
    |
    v
Amazon DynamoDB
```

Backend được tổ chức theo hướng:

- **Controller**: tiếp nhận request từ giao diện và trả về kết quả.
- **Service**: xử lý nghiệp vụ của hệ thống.
- **Config**: cấu hình kết nối DynamoDB.
- **Static**: chứa toàn bộ giao diện HTML, CSS và JavaScript.

## 5. Chức năng chính

### 5.1. Chức năng dành cho khách hàng

- Đăng ký tài khoản.
- Đăng nhập / đăng xuất.
- Tìm kiếm khách sạn.
- Tìm kiếm nâng cao theo các tiêu chí của hệ thống.
- Xem thông tin chi tiết khách sạn.
- Xem danh sách phòng của khách sạn.
- Kiểm tra phòng theo ngày.
- Đặt phòng.
- Thực hiện giao dịch đặt phòng.
- Thanh toán mô phỏng.
- Xem lịch sử đặt phòng.
- Hủy booking.
- Xem thông tin tài khoản.
- Quản lý khách sạn yêu thích.
- Đánh giá / review khách sạn.

### 5.2. Chức năng dành cho quản trị viên

- Xem tổng quan hệ thống.
- Quản lý khách sạn.
- Thêm, sửa, xóa thông tin khách sạn.
- Quản lý phòng.
- Thêm, sửa, xóa thông tin phòng.
- Quản lý người dùng.
- Theo dõi doanh thu.
- Sao lưu dữ liệu.
- Khôi phục dữ liệu từ bản backup.
- Theo dõi một số hoạt động quản trị và dữ liệu hệ thống.

## 6. Thiết kế dữ liệu DynamoDB

Bảng chính của hệ thống:

```text
HotelBooking
```

Đồ án sử dụng mô hình khóa ghép **PK / SK** để lưu nhiều loại thực thể trong cùng một bảng và thực hiện truy vấn theo quan hệ giữa chúng.

Ví dụ dữ liệu khách sạn:

```text
PK      = HOTEL#H01
SK      = META
```

Một số thuộc tính minh họa:

```text
name    = Grand Hotel Saigon
city    = Ho Chi Minh
address = 123 Nguyen Hue, Quan 1
stars   = 5
```

Dữ liệu phòng của khách sạn có thể được tổ chức theo dạng:

```text
PK      = HOTEL#H01
SK      = ROOM#R101
```

Ví dụ:

```text
roomId   = R101
roomType = Deluxe
maxGuest = 2
price    = 1800000
status   = available
```

Hệ thống cũng sử dụng **GSI (Global Secondary Index)** để hỗ trợ tìm kiếm theo thành phố/khách sạn. Ví dụ:

```text
GSI1PK = CITY#Ho Chi Minh
GSI1SK = HOTEL#H01
```

### Lý do sử dụng mô hình này

Thiết kế trên giúp hệ thống:

- Nhóm khách sạn và phòng theo cùng một khóa phân vùng.
- Truy vấn nhanh danh sách phòng của một khách sạn.
- Hỗ trợ tìm kiếm khách sạn theo thành phố thông qua GSI.
- Hạn chế việc phải JOIN như trong cơ sở dữ liệu quan hệ.
- Phù hợp với cách thiết kế dữ liệu theo nhu cầu truy vấn của DynamoDB.

## 7. Cấu trúc thư mục

```text
booking/
├── pom.xml
├── mvnw
├── mvnw.cmd
├── backup-hotel-booking.json
├── DEPLOY.md
├── HELP.md
│
└── src/
    ├── main/
    │   ├── java/com/hotel/booking/
    │   │   ├── BookingApplication.java
    │   │   ├── config/
    │   │   │   └── DynamoDbConfig.java
    │   │   ├── controller/
    │   │   │   ├── AdminHotelController.java
    │   │   │   ├── AdminRoomController.java
    │   │   │   ├── AdminUserController.java
    │   │   │   ├── AdvancedSearchController.java
    │   │   │   ├── AuthController.java
    │   │   │   ├── BackupController.java
    │   │   │   ├── BookingController.java
    │   │   │   ├── DashboardController.java
    │   │   │   ├── DynamoController.java
    │   │   │   ├── HotelController.java
    │   │   │   ├── RevenueController.java
    │   │   │   ├── ReviewController.java
    │   │   │   └── SeedController.java
    │   │   └── service/
    │   │       ├── AdvancedSearchService.java
    │   │       ├── AuditService.java
    │   │       ├── AuthService.java
    │   │       ├── BackupService.java
    │   │       ├── BookingService.java
    │   │       ├── DashboardService.java
    │   │       ├── RevenueService.java
    │   │       ├── ReviewService.java
    │   │       └── UserService.java
    │   │
    │   └── resources/
    │       ├── application.properties
    │       └── static/
    │           ├── about.html
    │           ├── admin.html
    │           ├── booking.html
    │           ├── history.html
    │           ├── hotel.html
    │           ├── login.html
    │           ├── payment.html
    │           ├── register.html
    │           ├── search.html
    │           ├── success.html
    │           ├── user.html
    │           ├── css/
    │           └── js/
    │
    └── test/
        └── java/com/hotel/booking/
            ├── BookingApplicationTests.java
            └── BookingFlowNotesTest.java
```

## 8. Yêu cầu môi trường

Trước khi chạy project, cần chuẩn bị:

- **JDK 21**.
- Kết nối mạng để ứng dụng có thể làm việc với AWS DynamoDB nếu sử dụng DynamoDB trên AWS.
- Tài khoản AWS có quyền truy cập DynamoDB.
- AWS Credentials được cấu hình theo môi trường máy chạy project.
- Maven không bắt buộc phải cài riêng vì project đã có **Maven Wrapper** (`mvnw`, `mvnw.cmd`).

## 9. Cấu hình DynamoDB

Mở file:

```text
src/main/resources/application.properties
```

Kiểm tra các thông tin cấu hình liên quan đến DynamoDB trước khi chạy project.

Ví dụ cấu hình thường cần có:

```properties
# AWS Region
# DynamoDB endpoint (nếu project sử dụng endpoint riêng)
# Các thông tin cấu hình cần thiết khác
```

> Không đưa AWS Access Key hoặc Secret Key trực tiếp vào GitHub. Nên cấu hình credentials bằng AWS CLI, biến môi trường hoặc cơ chế credentials phù hợp của AWS SDK.

## 10. Cách chạy project

### Bước 1: Clone project

```bash
git clone <repository-url>
cd booking
```

### Bước 2: Kiểm tra JDK

```bash
java -version
```

Project sử dụng Java 21.

### Bước 3: Chạy Spring Boot

#### Windows

```cmd
mvnw.cmd spring-boot:run
```

#### Linux / macOS

```bash
./mvnw spring-boot:run
```

Khi ứng dụng khởi động thành công, backend Spring Boot sẽ chạy và giao diện web có thể được truy cập qua địa chỉ localhost của ứng dụng.

## 11. Chạy bằng Maven

Biên dịch project:

```bash
./mvnw clean package
```

Trên Windows:

```cmd
mvnw.cmd clean package
```

Chạy test:

```bash
./mvnw test
```

Trên Windows:

```cmd
mvnw.cmd test
```

## 12. Quy trình demo đề xuất

Để trình bày đồ án, có thể demo theo thứ tự:

```text
1. Đăng ký / Đăng nhập
        ↓
2. Tìm kiếm khách sạn
        ↓
3. Xem chi tiết khách sạn
        ↓
4. Xem phòng và tình trạng phòng
        ↓
5. Đặt phòng
        ↓
6. Thanh toán mô phỏng
        ↓
7. Xem lịch sử đặt phòng
        ↓
8. Hủy booking
        ↓
9. Đánh giá khách sạn
        ↓
10. Quản lý yêu thích
        ↓
11. Đăng nhập tài khoản Admin
        ↓
12. Quản lý khách sạn / phòng / người dùng
        ↓
13. Xem doanh thu
        ↓
14. Backup / Restore dữ liệu
```

## 13. Các API chính

Project được chia thành nhiều nhóm API theo chức năng.

### Authentication

```text
/api/auth/...
```

Phục vụ:

- Đăng ký.
- Đăng nhập.
- Kiểm tra thông tin tài khoản.
- Quản lý trạng thái và quyền người dùng.

### Hotel

```text
/api/hotels/...
```

Phục vụ:

- Lấy thông tin khách sạn.
- Lấy danh sách phòng.
- Tra cứu dữ liệu khách sạn.

### Search

```text
/api/search/...
```

Phục vụ tìm kiếm nâng cao.

### Booking

```text
/api/bookings/...
```

Phục vụ:

- Tạo booking.
- Kiểm tra / xử lý booking.
- Hủy booking.
- Thanh toán mô phỏng.

### Review

```text
/api/reviews/...
```

Phục vụ thêm và quản lý đánh giá khách sạn.

### Admin

```text
/api/admin/...
```

Phục vụ quản lý khách sạn, phòng và người dùng.

### Revenue / Dashboard

```text
/api/revenue/...
/api/dashboard/...
```

Phục vụ thống kê và doanh thu cho khu vực quản trị.

### Backup / Restore

```text
/api/backup/...
```

Phục vụ sao lưu và khôi phục dữ liệu DynamoDB.

> Tên route cụ thể có thể xem trực tiếp trong các class Controller tương ứng trong `src/main/java/com/hotel/booking/controller/`.

## 14. Backup dữ liệu

Project có sẵn file:

```text
backup-hotel-booking.json
```

File này được sử dụng cho chức năng sao lưu / khôi phục dữ liệu trong quá trình demo và kiểm thử.

Quy trình tổng quát:

```text
DynamoDB
   |
   | Backup
   v
JSON
   |
   | Restore
   v
DynamoDB
```

## 15. Điểm nổi bật của đồ án NoSQL

### Không thiết kế theo kiểu quan hệ truyền thống

Dữ liệu được tổ chức dựa trên các truy vấn thực tế thay vì phụ thuộc vào JOIN giữa nhiều bảng.

### Sử dụng Partition Key và Sort Key

Ví dụ:

```text
PK = HOTEL#H01
SK = META
```

và:

```text
PK = HOTEL#H01
SK = ROOM#R101
```

Cách tổ chức này giúp truy vấn dữ liệu liên quan đến một khách sạn hiệu quả.

### Sử dụng GSI

GSI được dùng để tạo thêm cách truy vấn dữ liệu, ví dụ tìm khách sạn theo thành phố.

### Xử lý nghiệp vụ đặt phòng

Quá trình đặt phòng được xử lý ở backend để hạn chế tình trạng dữ liệu booking và tình trạng phòng bị lệch nhau.

## 16. Kiểm thử

Project có các test trong:

```text
src/test/java/com/hotel/booking/
```

Các file hiện có:

```text
BookingApplicationTests.java
BookingFlowNotesTest.java
```

Có thể chạy toàn bộ test bằng:

```bash
mvnw.cmd test
```

hoặc:

```bash
./mvnw test
```

## 17. Một số trường hợp demo

### Đặt phòng thành công

```text
Chọn khách sạn
→ Chọn phòng
→ Chọn ngày
→ Nhập thông tin
→ Tạo booking
→ Thanh toán
→ Booking thành công
```

### Hủy booking

```text
Lịch sử đặt phòng
→ Chọn booking
→ Hủy booking
→ Hệ thống cập nhật trạng thái
```

### Thanh toán mô phỏng

Hệ thống có chức năng thanh toán mô phỏng nhằm minh họa luồng nghiệp vụ mà không kết nối tới cổng thanh toán thật.

## 18. Giao diện

Website gồm các khu vực chính:

- Trang tìm kiếm khách sạn.
- Trang chi tiết khách sạn.
- Trang đặt phòng.
- Trang thanh toán.
- Trang lịch sử.
- Trang người dùng.
- Trang giới thiệu.
- Trang đăng nhập / đăng ký.
- Trang quản trị.

Giao diện được xây dựng bằng HTML/CSS/JavaScript và có hỗ trợ hiển thị trên màn hình nhỏ.

## 19. Lưu ý khi chạy project

- Kiểm tra AWS Region trước khi chạy.
- Đảm bảo bảng `HotelBooking` tồn tại và ứng dụng có quyền truy cập.
- Nếu dùng dữ liệu mẫu, kiểm tra dữ liệu trong DynamoDB trước khi demo.
- Không commit AWS Access Key và Secret Key lên GitHub.
- Khi thay đổi cấu trúc dữ liệu DynamoDB, cần kiểm tra lại các Controller và Service liên quan.

## 20. Hướng phát triển

Một số hướng có thể mở rộng trong tương lai:

- Kết nối cổng thanh toán thật.
- Mã hóa mật khẩu bằng cơ chế bảo mật phù hợp.
- Bổ sung JWT hoặc cơ chế xác thực nâng cao.
- Phân quyền chi tiết hơn cho Admin và người dùng.
- Bổ sung thông báo email.
- Tối ưu truy vấn và thiết kế Index khi dữ liệu tăng lớn.
- Triển khai hệ thống lên cloud.
- Bổ sung biểu đồ thống kê trực quan.

## 21. Tác giả

**Đồ án môn Cơ sở dữ liệu NoSQL**

**Đề tài:** Xây dựng hệ thống đặt phòng khách sạn sử dụng DynamoDB

Công nghệ chính:

```text
Java 21
Spring Boot
Maven
Amazon DynamoDB
HTML / CSS / JavaScript
AWS SDK for Java v2
```

---

## License

Đây là project phục vụ mục đích **học tập và thực hành môn NoSQL**.
