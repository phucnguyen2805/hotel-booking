package com.hotel.booking.service;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final DynamoDbClient dynamoDbClient;

    public AuthService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    // ==========================================
    // 1. ĐĂNG KÝ
    // ==========================================

    public String register(
            String name,
            String email,
            String password) {

        // Tạo userId tự động
        String userId = "U" + UUID.randomUUID()
                .toString()
                .substring(0, 6)
                .toUpperCase();

        // Tạo item User
        Map<String, AttributeValue> item = new HashMap<>();

        item.put(
                "PK",
                AttributeValue.builder()
                        .s("USER#" + userId)
                        .build());

        item.put(
                "SK",
                AttributeValue.builder()
                        .s("META")
                        .build());

        item.put(
                "name",
                AttributeValue.builder()
                        .s(name)
                        .build());

        item.put(
                "email",
                AttributeValue.builder()
                        .s(email)
                        .build());

        item.put(
                "password",
                AttributeValue.builder()
                        .s(password)
                        .build());

        // User đăng ký mặc định là CUSTOMER
        item.put(
                "role",
                AttributeValue.builder()
                        .s("CUSTOMER")
                        .build());

        PutItemRequest request = PutItemRequest.builder()
                .tableName("HotelBooking")
                .item(item)
                .build();

        dynamoDbClient.putItem(request);

        return userId;
    }

    // ==========================================
    // 2. ĐĂNG NHẬP
    // ==========================================

    public Map<String, String> login(
            String email,
            String password) {

        // Hiện tại chưa có GSI cho email,
        // nên tạm thời Scan toàn bộ bảng.
        var request = software.amazon.awssdk.services.dynamodb.model.ScanRequest
                .builder()
                .tableName("HotelBooking")
                .filterExpression("email = :email")
                .expressionAttributeValues(
                        Map.of(
                                ":email",
                                AttributeValue.builder()
                                        .s(email)
                                        .build()))
                .build();

        var response = dynamoDbClient.scan(request);

        if (response.items().isEmpty()) {
            throw new RuntimeException(
                    "Email hoặc mật khẩu không đúng");
        }

        Map<String, AttributeValue> user = response.items().get(0);

        // Kiểm tra tài khoản có bị khóa không
        String status = user.containsKey("status")
                ? user.get("status").s()
                : "active";

        if ("locked".equalsIgnoreCase(status)) {
            throw new RuntimeException(
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        // Kiểm tra mật khẩu
        String storedPassword = user.get("password").s();

        if (!storedPassword.equals(password)) {
            throw new RuntimeException(
                    "Email hoặc mật khẩu không đúng");
        }

        String userId = user.get("PK").s()
                .replace("USER#", "");

        String role = user.get("role").s();
        String token = createToken(userId, role);
        return Map.of(
                "userId", userId,
                "name", user.containsKey("name") ? user.get("name").s() : "",
                "email", email,
                "role", role,
                "token", token);
    }

    public String createToken(String userId, String role) {
        String raw = userId + ":" + role + ":" + System.currentTimeMillis();
        return java.util.Base64.getEncoder().encodeToString(raw.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public Map<String, String> parseToken(String token) {
        try {
            String raw = new String(java.util.Base64.getDecoder().decode(token),
                    java.nio.charset.StandardCharsets.UTF_8);
            String[] parts = raw.split(":");
            if (parts.length < 2)
                throw new RuntimeException("Token không hợp lệ");
            return Map.of("userId", parts[0], "role", parts[1]);
        } catch (Exception e) {
            throw new RuntimeException("Token không hợp lệ");
        }
    }
}
