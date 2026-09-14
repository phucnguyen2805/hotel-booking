package com.hotel.booking.service;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private final DynamoDbClient dynamoDbClient;

    public AuditService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public void log(String actorId, String action, String detail) {
        String id = UUID.randomUUID().toString().substring(0, 8);
        String ts = Instant.now().toString();
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.builder().s("AUDIT").build());
        item.put("SK", AttributeValue.builder().s("LOG#" + ts + "#" + id).build());
        item.put("actorId", AttributeValue.builder().s(actorId == null ? "system" : actorId).build());
        item.put("action", AttributeValue.builder().s(action).build());
        item.put("detail", AttributeValue.builder().s(detail == null ? "" : detail).build());
        item.put("createdAt", AttributeValue.builder().s(ts).build());
        dynamoDbClient.putItem(PutItemRequest.builder().tableName("HotelBooking").item(item).build());
    }

    public List<Map<String, String>> listRecent(int limit) {
        ScanResponse response = dynamoDbClient.scan(ScanRequest.builder()
                .tableName("HotelBooking")
                .filterExpression("PK = :pk")
                .expressionAttributeValues(Map.of(":pk", AttributeValue.builder().s("AUDIT").build()))
                .build());

        List<Map<String, String>> rows = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            Map<String, String> row = new HashMap<>();
            row.put("actorId", str(item, "actorId"));
            row.put("action", str(item, "action"));
            row.put("detail", str(item, "detail"));
            row.put("createdAt", str(item, "createdAt"));
            rows.add(row);
        }
        rows.sort((a, b) -> String.valueOf(b.get("createdAt")).compareTo(String.valueOf(a.get("createdAt"))));
        if (rows.size() > limit) return rows.subList(0, limit);
        return rows;
    }

    private String str(Map<String, AttributeValue> item, String key) {
        AttributeValue v = item.get(key);
        return v == null || v.s() == null ? "" : v.s();
    }
}
