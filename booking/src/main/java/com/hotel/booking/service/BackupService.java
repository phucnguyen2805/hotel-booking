package com.hotel.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BackupService {

    private final DynamoDbClient dynamoDbClient;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    private static final String TABLE_NAME = "HotelBooking";
    private static final String BACKUP_FILE = "backup-hotel-booking.json";

    public BackupService(
            DynamoDbClient dynamoDbClient,
            UserService userService) {

        this.dynamoDbClient = dynamoDbClient;
        this.userService = userService;
        this.objectMapper = new ObjectMapper();
    }

    // =========================
    // BACKUP
    // =========================

    public Map<String, Object> backup(String userId) {

        // Kiểm tra quyền Admin
        userService.checkAdmin(userId);

        // Lấy toàn bộ dữ liệu
        ScanRequest request = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .build();

        ScanResponse response = dynamoDbClient.scan(request);

        List<Map<String, Object>> items = new ArrayList<>();

        for (Map<String, AttributeValue> item : response.items()) {

            Map<String, Object> simpleItem = new HashMap<>();

            for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {

                AttributeValue value = entry.getValue();

                if (value.s() != null) {
                    simpleItem.put(entry.getKey(), value.s());

                } else if (value.n() != null) {
                    simpleItem.put(
                            entry.getKey(),
                            Long.parseLong(value.n()));

                } else if (value.bool() != null) {
                    simpleItem.put(
                            entry.getKey(),
                            value.bool());
                }
            }

            items.add(simpleItem);
        }

        // Ghi ra file JSON
        try {

            objectMapper
                    .writerWithDefaultPrettyPrinter()
                    .writeValue(new File(BACKUP_FILE), items);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Backup thất bại: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();

        result.put("message", "Backup thành công");
        result.put("file", BACKUP_FILE);
        result.put("totalItems", items.size());

        return result;
    }

    // =========================
    // RESTORE
    // =========================

    public Map<String, Object> restore(String userId) {

        // Kiểm tra quyền Admin
        userService.checkAdmin(userId);

        File file = new File(BACKUP_FILE);

        if (!file.exists()) {
            throw new RuntimeException(
                    "Không tìm thấy file backup");
        }

        try {

            List<Map<String, Object>> items = objectMapper.readValue(
                    file,
                    List.class);

            int restoredItems = 0;

            for (Map<String, Object> item : items) {

                Map<String, AttributeValue> dynamoItem = new HashMap<>();

                for (Map.Entry<String, Object> entry : item.entrySet()) {

                    Object value = entry.getValue();

                    if (value instanceof Number) {

                        dynamoItem.put(
                                entry.getKey(),
                                AttributeValue.builder()
                                        .n(value.toString())
                                        .build());

                    } else if (value instanceof Boolean) {

                        dynamoItem.put(
                                entry.getKey(),
                                AttributeValue.builder()
                                        .bool((Boolean) value)
                                        .build());

                    } else {

                        dynamoItem.put(
                                entry.getKey(),
                                AttributeValue.builder()
                                        .s(value.toString())
                                        .build());
                    }
                }

                dynamoDbClient.putItem(
                        PutItemRequest.builder()
                                .tableName(TABLE_NAME)
                                .item(dynamoItem)
                                .build());

                restoredItems++;
            }

            Map<String, Object> result = new HashMap<>();

            result.put("message", "Restore thành công");
            result.put("file", BACKUP_FILE);
            result.put("restoredItems", restoredItems);

            return result;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Restore thất bại: " + e.getMessage());
        }
    }
}