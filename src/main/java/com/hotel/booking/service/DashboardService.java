package com.hotel.booking.service;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final DynamoDbClient dynamoDbClient;
    private final UserService userService;

    public DashboardService(DynamoDbClient dynamoDbClient, UserService userService) {
        this.dynamoDbClient = dynamoDbClient;
        this.userService = userService;
    }

    public Map<String, Object> overview(String adminId) {
        userService.checkAdmin(adminId);

        int hotels = 0, rooms = 0, users = 0;
        int bookings = 0, cancelled = 0, paid = 0, todayBookings = 0;
        long revenue = 0;
        String today = LocalDate.now().toString();
        Map<String, Long> monthlyRevenue = new LinkedHashMap<>();
        YearMonth now = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            monthlyRevenue.put(now.minusMonths(i).toString(), 0L);
        }

        ScanResponse response = dynamoDbClient.scan(ScanRequest.builder().tableName("HotelBooking").build());
        for (Map<String, AttributeValue> item : response.items()) {
            String pk = s(item, "PK");
            String sk = s(item, "SK");
            if (pk == null || sk == null) continue;

            if (pk.startsWith("HOTEL#") && sk.equals("META")) hotels++;
            if (pk.startsWith("HOTEL#") && sk.startsWith("ROOM#")) rooms++;
            if (pk.startsWith("USER#") && sk.equals("META")) users++;

            if (sk.startsWith("BOOKING#")) {
                String status = s(item, "status");
                if ("cancelled".equals(status)) {
                    cancelled++;
                    continue;
                }
                bookings++;
                if ("paid".equals(s(item, "paymentStatus"))) paid++;
                String checkIn = s(item, "checkIn");
                if (today.equals(checkIn)) todayBookings++;
                long total = 0;
                if (item.get("total") != null && item.get("total").n() != null) {
                    total = Long.parseLong(item.get("total").n());
                    revenue += total;
                }
                if (checkIn != null && checkIn.length() >= 7) {
                    String ym = checkIn.substring(0, 7);
                    if (monthlyRevenue.containsKey(ym)) {
                        monthlyRevenue.put(ym, monthlyRevenue.get(ym) + total);
                    }
                }
            }
        }

        List<Map<String, Object>> monthly = new ArrayList<>();
        monthlyRevenue.forEach((k, v) -> {
            Map<String, Object> row = new HashMap<>();
            row.put("month", k);
            row.put("revenue", v);
            monthly.add(row);
        });

        Map<String, Object> result = new HashMap<>();
        result.put("hotels", hotels);
        result.put("rooms", rooms);
        result.put("users", users);
        result.put("bookings", bookings);
        result.put("cancelled", cancelled);
        result.put("paid", paid);
        result.put("todayBookings", todayBookings);
        result.put("revenue", revenue);
        result.put("monthlyRevenue", monthly);
        result.put("notifications", List.of(
                Map.of("type", "info", "text", "Có " + todayBookings + " booking nhận phòng hôm nay"),
                Map.of("type", "warn", "text", "Có " + cancelled + " booking đã hủy")
        ));
        return result;
    }

    private String s(Map<String, AttributeValue> item, String key) {
        AttributeValue v = item.get(key);
        return v == null || v.s() == null ? null : v.s();
    }
}
