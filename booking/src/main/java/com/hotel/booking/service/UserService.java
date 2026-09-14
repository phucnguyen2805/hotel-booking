package com.hotel.booking.service;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final DynamoDbClient dynamoDbClient;

    public UserService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public Map<String, AttributeValue> getUser(String userId) {
        Map<String, AttributeValue> key = Map.of(
                "PK", AttributeValue.builder().s("USER#" + userId).build(),
                "SK", AttributeValue.builder().s("META").build());

        GetItemResponse response = dynamoDbClient.getItem(GetItemRequest.builder()
                .tableName("HotelBooking")
                .key(key)
                .build());

        if (!response.hasItem()) {
            throw new RuntimeException("Không tìm thấy user");
        }
        return response.item();
    }

    public boolean isAdmin(String userId) {
        Map<String, AttributeValue> user = getUser(userId);
        String role = user.get("role").s();
        return "ADMIN".equals(role);
    }

    public void checkAdmin(String userId) {
        if (!isAdmin(userId)) {
            throw new RuntimeException("Bạn không có quyền Admin");
        }
    }

    public List<Map<String, String>> listUsers(String adminId) {
        checkAdmin(adminId);

        ScanResponse response = dynamoDbClient.scan(ScanRequest.builder()
                .tableName("HotelBooking")
                .filterExpression("begins_with(PK, :pk) AND SK = :sk")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s("USER#").build(),
                        ":sk", AttributeValue.builder().s("META").build()))
                .build());

        List<Map<String, String>> users = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            Map<String, String> row = new HashMap<>();
            String pk = item.get("PK") != null ? item.get("PK").s() : "";
            row.put("userId", pk.replace("USER#", ""));
            row.put("name", item.get("name") != null ? item.get("name").s() : "");
            row.put("email", item.get("email") != null ? item.get("email").s() : "");
            row.put("role", item.get("role") != null ? item.get("role").s() : "");
            row.put("status", item.get("status") != null ? item.get("status").s() : "active");
            users.add(row);
        }
        return users;
    }

    public void updateUserRole(String adminId, String targetUserId, String role) {
        checkAdmin(adminId);
        if (!role.equals("ADMIN") && !role.equals("CUSTOMER")) {
            throw new RuntimeException("Vai trò không hợp lệ");
        }
        dynamoDbClient.updateItem(UpdateItemRequest.builder()
                .tableName("HotelBooking")
                .key(Map.of(
                        "PK", AttributeValue.builder().s("USER#" + targetUserId).build(),
                        "SK", AttributeValue.builder().s("META").build()))
                .updateExpression("SET #r = :r")
                .expressionAttributeNames(Map.of("#r", "role"))
                .expressionAttributeValues(Map.of(":r", AttributeValue.builder().s(role).build()))
                .build());
    }

    public void resetPassword(String adminId, String targetUserId, String newPassword) {
        checkAdmin(adminId);
        if (newPassword == null || newPassword.length() < 4) {
            throw new RuntimeException("Mật khẩu mới quá ngắn");
        }
        dynamoDbClient.updateItem(UpdateItemRequest.builder()
                .tableName("HotelBooking")
                .key(Map.of(
                        "PK", AttributeValue.builder().s("USER#" + targetUserId).build(),
                        "SK", AttributeValue.builder().s("META").build()))
                .updateExpression("SET password = :p")
                .expressionAttributeValues(Map.of(":p", AttributeValue.builder().s(newPassword).build()))
                .build());
    }

    public void updateUserStatus(String adminId, String targetUserId, String status) {
        checkAdmin(adminId);
        if (!status.equals("active") && !status.equals("locked")) {
            throw new RuntimeException("Trạng thái không hợp lệ");
        }

        dynamoDbClient.updateItem(UpdateItemRequest.builder()
                .tableName("HotelBooking")
                .key(Map.of(
                        "PK", AttributeValue.builder().s("USER#" + targetUserId).build(),
                        "SK", AttributeValue.builder().s("META").build()))
                .updateExpression("SET #st = :st")
                .expressionAttributeNames(Map.of("#st", "status"))
                .expressionAttributeValues(Map.of(
                        ":st", AttributeValue.builder().s(status).build()))
                .build());
    }
}
