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
public class RevenueService {

    private final DynamoDbClient dynamoDbClient;
    private final UserService userService;

    public RevenueService(
            DynamoDbClient dynamoDbClient,
            UserService userService) {

        this.dynamoDbClient = dynamoDbClient;
        this.userService = userService;
    }

    public Map<String, Object> getRevenue(
            String userId,
            String hotelId,
            String month) {

        userService.checkAdmin(userId);

        YearMonth yearMonth = YearMonth.parse(month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.plusMonths(1).atDay(1);

        int totalBookings = 0;
        long totalRevenue = 0;
        int paidBookings = 0;
        int cancelledBookings = 0;

        Map<String, Long> dailyRevenue = new LinkedHashMap<>();
        Map<String, Integer> dailyBookings = new LinkedHashMap<>();

        for (int d = 1; d <= yearMonth.lengthOfMonth(); d++) {
            String key = yearMonth.atDay(d).toString();
            dailyRevenue.put(key, 0L);
            dailyBookings.put(key, 0);
        }

        ScanRequest request = ScanRequest.builder()
                .tableName("HotelBooking")
                .build();

        ScanResponse response = dynamoDbClient.scan(request);

        for (Map<String, AttributeValue> item : response.items()) {
            String sk = getString(item, "SK");
            if (sk == null || !sk.startsWith("BOOKING#")) {
                continue;
            }

            String bookingHotelId = getString(item, "hotelId");
            if (hotelId != null && !hotelId.isBlank() && !hotelId.equals(bookingHotelId)) {
                continue;
            }

            String checkInString = getString(item, "checkIn");
            if (checkInString == null) {
                continue;
            }

            LocalDate checkIn;
            try {
                checkIn = LocalDate.parse(checkInString);
            } catch (Exception e) {
                continue;
            }

            if (checkIn.isBefore(startDate) || !checkIn.isBefore(endDate)) {
                continue;
            }

            String status = getString(item, "status");
            if ("cancelled".equals(status)) {
                cancelledBookings++;
                continue;
            }

            totalBookings++;

            long amount = 0L;
            AttributeValue totalValue = item.get("total");
            if (totalValue != null && totalValue.n() != null) {
                amount = Long.parseLong(totalValue.n());
                totalRevenue += amount;
            }

            String dayKey = checkIn.toString();
            dailyRevenue.put(dayKey, dailyRevenue.getOrDefault(dayKey, 0L) + amount);
            dailyBookings.put(dayKey, dailyBookings.getOrDefault(dayKey, 0) + 1);

            String paymentStatus = getString(item, "paymentStatus");
            if ("paid".equals(paymentStatus)) {
                paidBookings++;
            }
        }

        List<Map<String, Object>> daily = new ArrayList<>();
        for (String day : dailyRevenue.keySet()) {
            Map<String, Object> row = new HashMap<>();
            row.put("date", day);
            row.put("revenue", dailyRevenue.get(day));
            row.put("bookings", dailyBookings.get(day));
            daily.add(row);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("hotelId", hotelId);
        result.put("month", month);
        result.put("totalBookings", totalBookings);
        result.put("totalRevenue", totalRevenue);
        result.put("paidBookings", paidBookings);
        result.put("cancelledBookings", cancelledBookings);
        result.put("daily", daily);

        return result;
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
}
