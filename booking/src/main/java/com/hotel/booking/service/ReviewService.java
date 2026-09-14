package com.hotel.booking.service;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReviewService {

    private final DynamoDbClient dynamoDbClient;

    public ReviewService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public Map<String, String> addReview(String hotelId, String userId, String userName, int stars, String comment) {
        if (stars < 1 || stars > 5) throw new RuntimeException("Số sao phải từ 1 đến 5");
        String id = "R" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String ts = Instant.now().toString();
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.builder().s("HOTEL#" + hotelId).build());
        item.put("SK", AttributeValue.builder().s("REVIEW#" + id).build());
        item.put("reviewId", AttributeValue.builder().s(id).build());
        item.put("hotelId", AttributeValue.builder().s(hotelId).build());
        item.put("userId", AttributeValue.builder().s(userId).build());
        item.put("userName", AttributeValue.builder().s(userName == null ? userId : userName).build());
        item.put("stars", AttributeValue.builder().n(String.valueOf(stars)).build());
        item.put("comment", AttributeValue.builder().s(comment == null ? "" : comment).build());
        item.put("status", AttributeValue.builder().s("approved").build());
        item.put("createdAt", AttributeValue.builder().s(ts).build());
        dynamoDbClient.putItem(PutItemRequest.builder().tableName("HotelBooking").item(item).build());

        Map<String, String> res = new HashMap<>();
        res.put("reviewId", id);
        res.put("message", "Đánh giá thành công");
        return res;
    }

    public List<Map<String, String>> listByHotel(String hotelId) {
        ScanResponse response = dynamoDbClient.scan(ScanRequest.builder()
                .tableName("HotelBooking")
                .filterExpression("PK = :pk AND begins_with(SK, :sk)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s("HOTEL#" + hotelId).build(),
                        ":sk", AttributeValue.builder().s("REVIEW#").build()))
                .build());
        List<Map<String, String>> rows = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            Map<String, String> row = new HashMap<>();
            row.put("reviewId", str(item, "reviewId"));
            row.put("userName", str(item, "userName"));
            row.put("stars", item.get("stars") != null && item.get("stars").n() != null ? item.get("stars").n() : "0");
            row.put("comment", str(item, "comment"));
            row.put("createdAt", str(item, "createdAt"));
            rows.add(row);
        }
        return rows;
    }

    private String str(Map<String, AttributeValue> item, String key) {
        AttributeValue v = item.get(key);
        return v == null || v.s() == null ? "" : v.s();
    }
}
