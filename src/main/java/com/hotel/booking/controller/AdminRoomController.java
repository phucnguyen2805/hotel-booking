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

                item.put("imageUrl", AttributeValue.builder()
                                .s(request.imageUrl() == null ? "" : request.imageUrl())
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
                                                    maxGuest = :maxGuest,
                                                    imageUrl = :imageUrl
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
                                                                .build(),
                                                ":imageUrl", AttributeValue.builder()
                                                                .s(request.imageUrl() == null ? "" : request.imageUrl())
                                                                .build()))
                                .build();

                dynamoDbClient.updateItem(updateRequest);

                return Map.of(
                                "message", "Cập nhật phòng thành công",
                                "roomId", roomId,
                                "hotelId", hotelId);
        }

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

        public record RoomRequest(
                        String roomId,
                        String type,
                        long price,
                        int maxGuest,
                        String imageUrl) {
        }
}
