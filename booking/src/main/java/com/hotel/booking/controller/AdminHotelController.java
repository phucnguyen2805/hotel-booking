package com.hotel.booking.controller;

import com.hotel.booking.service.UserService;

import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/hotels")
public class AdminHotelController {

        private final DynamoDbClient dynamoDbClient;
        private final UserService userService;

        public AdminHotelController(
                        DynamoDbClient dynamoDbClient,
                        UserService userService) {

                this.dynamoDbClient = dynamoDbClient;
                this.userService = userService;
        }

        // ================================
        // 1. THÊM KHÁCH SẠN
        // ================================

        @PostMapping
        public Map<String, String> createHotel(
                        @RequestParam String userId,
                        @RequestBody HotelRequest request) {

                userService.checkAdmin(userId);

                Map<String, AttributeValue> item = new HashMap<>();

                item.put("PK", AttributeValue.builder()
                                .s("HOTEL#" + request.hotelId())
                                .build());

                item.put("SK", AttributeValue.builder()
                                .s("META")
                                .build());

                item.put("name", AttributeValue.builder()
                                .s(request.name())
                                .build());

                item.put("city", AttributeValue.builder()
                                .s(request.city())
                                .build());

                item.put("address", AttributeValue.builder()
                                .s(request.address())
                                .build());

                item.put("imageUrl", AttributeValue.builder().s(request.imageUrl() == null ? "" : request.imageUrl()).build());
                item.put("stars", AttributeValue.builder()
                                .n(String.valueOf(request.stars()))
                                .build());

                // Dùng để tìm hotel theo city
                item.put("GSI1PK", AttributeValue.builder()
                                .s("CITY#" + request.city())
                                .build());

                item.put("GSI1SK", AttributeValue.builder()
                                .s("HOTEL#" + request.hotelId())
                                .build());

                PutItemRequest putRequest = PutItemRequest.builder()
                                .tableName("HotelBooking")
                                .item(item)
                                .build();

                dynamoDbClient.putItem(putRequest);

                return Map.of(
                                "message", "Thêm khách sạn thành công",
                                "hotelId", request.hotelId());
        }

        // ================================
        // 2. SỬA KHÁCH SẠN
        // ================================

        @PutMapping("/{hotelId}")
        public Map<String, String> updateHotel(
                        @PathVariable String hotelId,
                        @RequestParam String userId,
                        @RequestBody HotelRequest request) {

                userService.checkAdmin(userId);

                Map<String, AttributeValue> key = Map.of(
                                "PK", AttributeValue.builder()
                                                .s("HOTEL#" + hotelId)
                                                .build(),

                                "SK", AttributeValue.builder()
                                                .s("META")
                                                .build());

                UpdateItemRequest updateRequest = UpdateItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(key)

                                .updateExpression("""
                                                SET #name = :name,
                                                    city = :city,
                                                    imageUrl = :imageUrl,
                                                    address = :address,
                                                    stars = :stars,
                                                    GSI1PK = :gsi1pk,
                                                    GSI1SK = :gsi1sk
                                                """)

                                .expressionAttributeNames(Map.of(
                                                "#name", "name"))

                                .expressionAttributeValues(Map.of(
                                                ":name", AttributeValue.builder()
                                                                .s(request.name())
                                                                .build(),

                                                ":city", AttributeValue.builder().s(request.city()).build(),
                                                ":imageUrl", AttributeValue.builder().s(request.imageUrl() == null ? "" : request.imageUrl())
                                                                .build(),

                                                ":address", AttributeValue.builder()
                                                                .s(request.address())
                                                                .build(),

                                                ":stars", AttributeValue.builder()
                                                                .n(String.valueOf(request.stars()))
                                                                .build(),

                                                ":gsi1pk", AttributeValue.builder()
                                                                .s("CITY#" + request.city())
                                                                .build(),

                                                ":gsi1sk", AttributeValue.builder()
                                                                .s("HOTEL#" + hotelId)
                                                                .build()))

                                .build();

                dynamoDbClient.updateItem(updateRequest);

                return Map.of(
                                "message", "Cập nhật khách sạn thành công",
                                "hotelId", hotelId);
        }

        // ================================
        // 3. XÓA KHÁCH SẠN
        // ================================

        @DeleteMapping("/{hotelId}")
        public Map<String, String> deleteHotel(
                        @PathVariable String hotelId,
                        @RequestParam String userId) {

                userService.checkAdmin(userId);

                Map<String, AttributeValue> key = Map.of(
                                "PK", AttributeValue.builder()
                                                .s("HOTEL#" + hotelId)
                                                .build(),

                                "SK", AttributeValue.builder()
                                                .s("META")
                                                .build());

                DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(key)
                                .build();

                dynamoDbClient.deleteItem(deleteRequest);

                return Map.of(
                                "message", "Xóa khách sạn thành công",
                                "hotelId", hotelId);
        }

        // ================================
        // REQUEST
        // ================================

        public record HotelRequest(
                        String hotelId,
                        String name,
                        String city,
                        String imageUrl,
                        String address,
                        int stars) {
        }
}