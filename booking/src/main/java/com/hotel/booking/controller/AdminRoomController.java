package com.hotel.booking.controller;

import com.hotel.booking.service.UserService;

import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/hotels/{hotelId}/rooms")
public class AdminRoomController {

        private final DynamoDbClient dynamoDbClient;
        private final UserService userService;

        public AdminRoomController(
                        DynamoDbClient dynamoDbClient,
                        UserService userService) {

                this.dynamoDbClient = dynamoDbClient;
                this.userService = userService;
        }

        // ================================
        // 1. THÊM PHÒNG
        // ================================

        @PostMapping
        public Map<String, String> createRoom(
                        @PathVariable String hotelId,
                        @RequestParam String userId,
                        @RequestBody RoomRequest request) {

                userService.checkAdmin(userId);

                Map<String, AttributeValue> item = new HashMap<>();

                item.put("PK", AttributeValue.builder()
                                .s("HOTEL#" + hotelId)
                                .build());

                item.put("SK", AttributeValue.builder()
                                .s("ROOM#" + request.roomId())
                                .build());

                item.put("type", AttributeValue.builder()
                                .s(request.type())
                                .build());

                item.put("price", AttributeValue.builder()
                                .n(String.valueOf(request.price()))
                                .build());

                item.put("maxGuest", AttributeValue.builder()
                                .n(String.valueOf(request.maxGuest()))
                                .build());

                item.put("status", AttributeValue.builder()
                                .s("available")
                                .build());

                PutItemRequest putRequest = PutItemRequest.builder()
                                .tableName("HotelBooking")
                                .item(item)
                                .build();

                dynamoDbClient.putItem(putRequest);

                return Map.of(
                                "message", "Thêm phòng thành công",
                                "roomId", request.roomId(),
                                "hotelId", hotelId);
        }

        // ================================
        // 2. SỬA PHÒNG
        // ================================

        @PutMapping("/{roomId}")
        public Map<String, String> updateRoom(
                        @PathVariable String hotelId,
                        @PathVariable String roomId,
                        @RequestParam String userId,
                        @RequestBody RoomRequest request) {

                userService.checkAdmin(userId);

                Map<String, AttributeValue> key = Map.of(
                                "PK", AttributeValue.builder()
                                                .s("HOTEL#" + hotelId)
                                                .build(),

                                "SK", AttributeValue.builder()
                                                .s("ROOM#" + roomId)
                                                .build());

                UpdateItemRequest updateRequest = UpdateItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(key)

                                .updateExpression("""
                                                SET #type = :type,
                                                    price = :price,
                                                    maxGuest = :maxGuest
                                                """)

                                .expressionAttributeNames(Map.of(
                                                "#type", "type"))

                                .expressionAttributeValues(Map.of(
                                                ":type", AttributeValue.builder()
                                                                .s(request.type())
                                                                .build(),

                                                ":price", AttributeValue.builder()
                                                                .n(String.valueOf(request.price()))
                                                                .build(),

                                                ":maxGuest", AttributeValue.builder()
                                                                .n(String.valueOf(request.maxGuest()))
                                                                .build()))

                                .build();

                dynamoDbClient.updateItem(updateRequest);

                return Map.of(
                                "message", "Cập nhật phòng thành công",
                                "roomId", roomId,
                                "hotelId", hotelId);
        }

        // ================================
        // 3. XÓA PHÒNG
        // ================================

        @DeleteMapping("/{roomId}")
        public Map<String, String> deleteRoom(
                        @PathVariable String hotelId,
                        @PathVariable String roomId,
                        @RequestParam String userId) {

                userService.checkAdmin(userId);

                Map<String, AttributeValue> key = Map.of(
                                "PK", AttributeValue.builder()
                                                .s("HOTEL#" + hotelId)
                                                .build(),

                                "SK", AttributeValue.builder()
                                                .s("ROOM#" + roomId)
                                                .build());

                DeleteItemRequest deleteRequest = DeleteItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(key)
                                .build();

                dynamoDbClient.deleteItem(deleteRequest);

                return Map.of(
                                "message", "Xóa phòng thành công",
                                "roomId", roomId,
                                "hotelId", hotelId);
        }

        // ================================
        // REQUEST
        // ================================

        public record RoomRequest(
                        String roomId,
                        String type,
                        long price,
                        int maxGuest) {
        }
}