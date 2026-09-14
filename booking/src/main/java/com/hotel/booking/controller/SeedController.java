package com.hotel.booking.controller;

import com.hotel.booking.service.AuditService;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/seed")
public class SeedController {

    private final DynamoDbClient dynamoDbClient;
    private final AuditService auditService;

    public SeedController(DynamoDbClient dynamoDbClient, AuditService auditService) {
        this.dynamoDbClient = dynamoDbClient;
        this.auditService = auditService;
    }

    @PostMapping
    public Map<String, String> seed(@RequestParam String userId) {
        // sample hotels with imageUrl
        putHotel("H01", "Khách sạn Biển Xanh", "Đà Nẵng", "12 Trần Phú", "4",
                "https://picsum.photos/seed/H01/800/500");
        putHotel("H02", "Grand Saigon", "Hồ Chí Minh", "01 Nguyễn Huệ", "5",
                "https://picsum.photos/seed/H02/800/500");
        putRoom("H01", "R101", "Standard", "2", "800000", "available");
        putRoom("H01", "R102", "Superior", "4", "1200000", "available");
        putRoom("H02", "R201", "Deluxe", "3", "1500000", "available");
        auditService.log(userId, "SEED", "Seed demo hotels/rooms");
        return Map.of("message", "Seed dữ liệu mẫu thành công");
    }

    private void putHotel(String id, String name, String city, String address, String stars, String imageUrl) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.builder().s("HOTEL#" + id).build());
        item.put("SK", AttributeValue.builder().s("META").build());
        item.put("hotelId", AttributeValue.builder().s(id).build());
        item.put("name", AttributeValue.builder().s(name).build());
        item.put("city", AttributeValue.builder().s(city).build());
        item.put("address", AttributeValue.builder().s(address).build());
        item.put("stars", AttributeValue.builder().n(stars).build());
        item.put("imageUrl", AttributeValue.builder().s(imageUrl).build());
        dynamoDbClient.putItem(PutItemRequest.builder().tableName("HotelBooking").item(item).build());
    }

    private void putRoom(String hotelId, String roomId, String type, String maxGuest, String price, String status) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.builder().s("HOTEL#" + hotelId).build());
        item.put("SK", AttributeValue.builder().s("ROOM#" + roomId).build());
        item.put("roomId", AttributeValue.builder().s(roomId).build());
        item.put("hotelId", AttributeValue.builder().s(hotelId).build());
        item.put("type", AttributeValue.builder().s(type).build());
        item.put("maxGuest", AttributeValue.builder().n(maxGuest).build());
        item.put("price", AttributeValue.builder().n(price).build());
        item.put("status", AttributeValue.builder().s(status).build());
        item.put("imageUrl", AttributeValue.builder().s("https://picsum.photos/seed/" + roomId + "/600/400").build());
        dynamoDbClient.putItem(PutItemRequest.builder().tableName("HotelBooking").item(item).build());
    }
}
