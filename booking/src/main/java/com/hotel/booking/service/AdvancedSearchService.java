package com.hotel.booking.service;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdvancedSearchService {

    private final DynamoDbClient dynamoDbClient;

    public AdvancedSearchService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public List<Map<String, Object>> searchHotels(
            String city,
            Integer minStars,
            Long maxPrice,
            String roomType) {

        List<Map<String, Object>> result = new ArrayList<>();

        // Lấy toàn bộ dữ liệu trong bảng
        ScanRequest request = ScanRequest.builder()
                .tableName("HotelBooking")
                .build();

        ScanResponse response = dynamoDbClient.scan(request);

        // Duyệt từng item
        for (Map<String, AttributeValue> item : response.items()) {

            String pk = getString(item, "PK");
            String sk = getString(item, "SK");

            // Chỉ lấy Hotel META
            if (pk == null
                    || !pk.startsWith("HOTEL#")
                    || !"META".equals(sk)) {
                continue;
            }

            // Lấy thông tin Hotel
            String hotelCity = getString(item, "city");
            Integer stars = getInteger(item, "stars");

            // Lọc theo city
            if (city != null
                    && !city.isBlank()
                    && !city.equalsIgnoreCase(hotelCity)) {
                continue;
            }

            // Lọc theo số sao tối thiểu
            if (minStars != null
                    && (stars == null || stars < minStars)) {
                continue;
            }

            String hotelId = pk.substring("HOTEL#".length());

            // Kiểm tra phòng
            List<Map<String, AttributeValue>> rooms = getRooms(hotelId);

            boolean hasMatchingRoom = false;

            for (Map<String, AttributeValue> room : rooms) {

                String type = getString(room, "type");
                Long price = getLong(room, "price");

                // Lọc loại phòng
                if (roomType != null
                        && !roomType.isBlank()
                        && !roomType.equalsIgnoreCase(type)) {
                    continue;
                }

                // Lọc giá tối đa
                if (maxPrice != null
                        && (price == null || price > maxPrice)) {
                    continue;
                }

                hasMatchingRoom = true;
                break;
            }

            // Nếu Hotel có ít nhất 1 phòng phù hợp
            if (hasMatchingRoom || (maxPrice == null && roomType == null)) {

                Map<String, Object> hotel = new HashMap<>();

                hotel.put("hotelId", hotelId);
                hotel.put("name", getString(item, "name"));
                hotel.put("city", hotelCity);
                hotel.put("address", getString(item, "address"));
                hotel.put("stars", stars);

                result.add(hotel);
            }
        }

        return result;
    }

    private List<Map<String, AttributeValue>> getRooms(String hotelId) {

        ScanRequest request = ScanRequest.builder()
                .tableName("HotelBooking")
                .filterExpression(
                        "PK = :pk AND begins_with(SK, :roomPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder()
                                .s("HOTEL#" + hotelId)
                                .build(),
                        ":roomPrefix", AttributeValue.builder()
                                .s("ROOM#")
                                .build()))
                .build();

        return dynamoDbClient.scan(request).items();
    }

    private String getString(
            Map<String, AttributeValue> item,
            String key) {

        AttributeValue value = item.get(key);

        if (value == null || value.s() == null) {
            return null;
        }

        return value.s();
    }

    private Integer getInteger(
            Map<String, AttributeValue> item,
            String key) {

        AttributeValue value = item.get(key);

        if (value == null || value.n() == null) {
            return null;
        }

        return Integer.parseInt(value.n());
    }

    private Long getLong(
            Map<String, AttributeValue> item,
            String key) {

        AttributeValue value = item.get(key);

        if (value == null || value.n() == null) {
            return null;
        }

        return Long.parseLong(value.n());
    }
}