package com.hotel.booking.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;

@RestController
public class HotelController {

    private final DynamoDbClient dynamoDbClient;

    public HotelController(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @GetMapping("/hotels/{hotelId}")
    public Map<String, String> getHotel(
            @PathVariable String hotelId) {

        // Tạo khóa để tìm khách sạn
        Map<String, AttributeValue> key = Map.of(
                "PK", AttributeValue.builder()
                        .s("HOTEL#" + hotelId)
                        .build(),

                "SK", AttributeValue.builder()
                        .s("META")
                        .build());

        // Gửi yêu cầu lấy dữ liệu
        GetItemRequest request = GetItemRequest.builder()
                .tableName("HotelBooking")
                .key(key)
                .build();

        GetItemResponse response = dynamoDbClient.getItem(request);

        // Chuyển dữ liệu từ AttributeValue sang String
        Map<String, String> result = new HashMap<>();

        for (Map.Entry<String, AttributeValue> entry : response.item().entrySet()) {

            AttributeValue value = entry.getValue();

            if (value.s() != null) {
                result.put(entry.getKey(), value.s());
            } else if (value.n() != null) {
                result.put(entry.getKey(), value.n());
            }
        }

        return result;
    }

    @GetMapping("/hotels/{hotelId}/rooms")
    public List<Map<String, String>> getRooms(
            @PathVariable String hotelId) {

        QueryRequest request = QueryRequest.builder()
                .tableName("HotelBooking")
                .keyConditionExpression(
                        "PK = :pk AND begins_with(SK, :sk)")
                .expressionAttributeValues(Map.of(
                        ":pk",
                        AttributeValue.builder()
                                .s("HOTEL#" + hotelId)
                                .build(),

                        ":sk",
                        AttributeValue.builder()
                                .s("ROOM#")
                                .build()))
                .build();

        QueryResponse response = dynamoDbClient.query(request);

        List<Map<String, String>> rooms = new ArrayList<>();

        for (Map<String, AttributeValue> item : response.items()) {

            Map<String, String> room = new HashMap<>();

            // Chuyển dữ liệu DynamoDB
            for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {

                AttributeValue value = entry.getValue();

                if (value.s() != null) {

                    room.put(
                            entry.getKey(),
                            value.s());

                } else if (value.n() != null) {

                    room.put(
                            entry.getKey(),
                            value.n());
                }
            }

            // ==========================================
            // BỔ SUNG HOTEL ID
            // ==========================================

            room.put(
                    "hotelId",
                    hotelId);

            // ==========================================
            // BỔ SUNG ROOM ID TỪ SK
            //
            // SK = ROOM#R101
            // roomId = R101
            // ==========================================

            String sk = room.get("SK");

            if (sk != null &&
                    sk.startsWith("ROOM#")) {

                room.put(
                        "roomId",
                        sk.substring("ROOM#".length()));
            }

            rooms.add(room);
        }

        return rooms;
    }

    @GetMapping("/hotels")
    public List<Map<String, String>> getHotels(
            @RequestParam(required = false) String city) {

        List<Map<String, String>> hotels = new ArrayList<>();

        /*
         * ==========================================
         * TRƯỜNG HỢP 1:
         * Có city -> tìm theo GSI1
         * Ví dụ:
         * /hotels?city=Ho Chi Minh
         * ==========================================
         */

        if (city != null && !city.trim().isEmpty()) {

            QueryRequest request = QueryRequest.builder()
                    .tableName("HotelBooking")
                    .indexName("GSI1")
                    .keyConditionExpression("GSI1PK = :city")
                    .expressionAttributeValues(Map.of(
                            ":city",
                            AttributeValue.builder()
                                    .s("CITY#" + city.trim())
                                    .build()))
                    .build();

            QueryResponse response = dynamoDbClient.query(request);

            for (Map<String, AttributeValue> item : response.items()) {

                Map<String, String> hotel = convertItemToStringMap(item);

                addHotelId(hotel);

                hotels.add(hotel);
            }

        }

        /*
         * ==========================================
         * TRƯỜNG HỢP 2:
         * Không có city -> lấy tất cả khách sạn
         * Dùng cho Admin Dashboard
         *
         * /hotels
         * ==========================================
         */

        else {

            ScanRequest request = ScanRequest.builder()
                    .tableName("HotelBooking")
                    .filterExpression(
                            "begins_with(PK, :hotelPrefix) AND SK = :meta")
                    .expressionAttributeValues(Map.of(
                            ":hotelPrefix",
                            AttributeValue.builder()
                                    .s("HOTEL#")
                                    .build(),

                            ":meta",
                            AttributeValue.builder()
                                    .s("META")
                                    .build()))
                    .build();

            ScanResponse response = dynamoDbClient.scan(request);

            for (Map<String, AttributeValue> item : response.items()) {

                Map<String, String> hotel = convertItemToStringMap(item);

                addHotelId(hotel);

                hotels.add(hotel);
            }
        }

        return hotels;
    }

    @GetMapping("/hotels/{hotelId}/rooms/available")
    public List<Map<String, String>> getAvailableRooms(
            @PathVariable String hotelId,
            @RequestParam String checkIn,
            @RequestParam String checkOut) {

        LocalDate requestedCheckIn = LocalDate.parse(checkIn);
        LocalDate requestedCheckOut = LocalDate.parse(checkOut);

        // Kiểm tra ngày hợp lệ
        if (!requestedCheckIn.isBefore(requestedCheckOut)) {
            throw new RuntimeException(
                    "Ngày checkIn phải trước ngày checkOut");
        }

        // =====================================================
        // 1. Lấy tất cả phòng của khách sạn
        // =====================================================

        QueryRequest roomRequest = QueryRequest.builder()
                .tableName("HotelBooking")
                .keyConditionExpression("PK = :pk AND begins_with(SK, :sk)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder()
                                .s("HOTEL#" + hotelId)
                                .build(),

                        ":sk", AttributeValue.builder()
                                .s("ROOM#")
                                .build()))
                .build();

        QueryResponse roomResponse = dynamoDbClient.query(roomRequest);

        List<Map<String, String>> rooms = new ArrayList<>();

        for (Map<String, AttributeValue> item : roomResponse.items()) {

            Map<String, String> room = new HashMap<>();

            for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {

                AttributeValue value = entry.getValue();

                if (value.s() != null) {
                    room.put(entry.getKey(), value.s());
                } else if (value.n() != null) {
                    room.put(entry.getKey(), value.n());
                }
            }

            rooms.add(room);
        }

        // =====================================================
        // 2. Lấy các booking đang confirmed của khách sạn
        // =====================================================

        ScanRequest bookingRequest = ScanRequest.builder()
                .tableName("HotelBooking")
                .filterExpression(
                        "hotelId = :hotelId AND #status = :confirmed")
                .expressionAttributeNames(Map.of(
                        "#status", "status"))
                .expressionAttributeValues(Map.of(
                        ":hotelId", AttributeValue.builder()
                                .s(hotelId)
                                .build(),

                        ":confirmed", AttributeValue.builder()
                                .s("confirmed")
                                .build()))
                .build();

        ScanResponse bookingResponse = dynamoDbClient.scan(bookingRequest);

        // Lưu roomId của những phòng bị trùng ngày
        List<String> unavailableRoomIds = new ArrayList<>();

        for (Map<String, AttributeValue> booking : bookingResponse.items()) {

            String roomId = booking.get("roomId").s();

            LocalDate bookingCheckIn = LocalDate.parse(booking.get("checkIn").s());

            LocalDate bookingCheckOut = LocalDate.parse(booking.get("checkOut").s());

            // Kiểm tra hai khoảng thời gian có bị trùng không
            boolean overlap = requestedCheckIn.isBefore(bookingCheckOut)
                    && requestedCheckOut.isAfter(bookingCheckIn);

            if (overlap) {
                unavailableRoomIds.add(roomId);
            }
        }

        // =====================================================
        // 3. Chỉ trả về phòng không bị trùng ngày
        // =====================================================

        List<Map<String, String>> availableRooms = new ArrayList<>();

        for (Map<String, String> room : rooms) {

            String roomId = room.get("SK").replace("ROOM#", "");

            String status = room.get("status");

            // Phòng phải đang available
            // và không có booking confirmed bị trùng ngày
            if ("available".equals(status)
                    && !unavailableRoomIds.contains(roomId)) {

                availableRooms.add(room);
            }
        }

        return availableRooms;
    }

    private Map<String, String> convertItemToStringMap(
            Map<String, AttributeValue> item) {

        Map<String, String> result = new HashMap<>();

        for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {

            AttributeValue value = entry.getValue();

            if (value.s() != null) {

                result.put(
                        entry.getKey(),
                        value.s());

            } else if (value.n() != null) {

                result.put(
                        entry.getKey(),
                        value.n());

            } else if (value.bool() != null) {

                result.put(
                        entry.getKey(),
                        String.valueOf(value.bool()));
            }
        }

        return result;
    }

    private void addHotelId(
            Map<String, String> hotel) {

        String pk = hotel.get("PK");

        if (pk != null &&
                pk.startsWith("HOTEL#")) {

            hotel.put(
                    "hotelId",
                    pk.substring("HOTEL#".length()));
        }
    }
}