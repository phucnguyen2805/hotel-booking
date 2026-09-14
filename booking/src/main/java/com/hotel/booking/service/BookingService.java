package com.hotel.booking.service;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItemsRequest;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItem;
import software.amazon.awssdk.services.dynamodb.model.Update;
import software.amazon.awssdk.services.dynamodb.model.Put;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BookingService {

        private final DynamoDbClient dynamoDbClient;

        public BookingService(DynamoDbClient dynamoDbClient) {
                this.dynamoDbClient = dynamoDbClient;
        }

        public String createBooking(
                        String guestId,
                        String hotelId,
                        String roomId,
                        String checkIn,
                        String checkOut,
                        long total) {
                if (!isRoomAvailableInRange(hotelId, roomId, checkIn, checkOut)) {
                        throw new RuntimeException("Phòng đã được đặt trong khoảng ngày này");
                }


                // Tạo mã booking tự động
                String bookingId = "B" + UUID.randomUUID()
                                .toString()
                                .substring(0, 6)
                                .toUpperCase();

                /*
                 * =====================================================
                 * 1. UPDATE PHÒNG
                 * =====================================================
                 *
                 * Tìm:
                 * PK = HOTEL#H01
                 * SK = ROOM#R101
                 *
                 * Chỉ cho phép cập nhật nếu status hiện tại = available
                 */
                Update updateRoom = Update.builder()
                                .tableName("HotelBooking")

                                .key(Map.of(
                                                "PK", AttributeValue.builder()
                                                                .s("HOTEL#" + hotelId)
                                                                .build(),

                                                "SK", AttributeValue.builder()
                                                                .s("ROOM#" + roomId)
                                                                .build()))

                                .updateExpression("SET #status = :booked")

                                .expressionAttributeNames(Map.of(
                                                "#status", "status"))

                                .expressionAttributeValues(Map.of(
                                                ":available", AttributeValue.builder()
                                                                .s("available")
                                                                .build(),

                                                ":booked", AttributeValue.builder()
                                                                .s("booked")
                                                                .build()))

                                .conditionExpression("#status = :available")

                                .build();

                /*
                 * =====================================================
                 * 2. TẠO BOOKING
                 * =====================================================
                 *
                 * PK = GUEST#G01
                 * SK = BOOKING#Bxxxxxx
                 */
                Put putBooking = Put.builder()
                                .tableName("HotelBooking")

                                .item(Map.of(
                                                "PK", AttributeValue.builder()
                                                                .s("GUEST#" + guestId)
                                                                .build(),

                                                "SK", AttributeValue.builder()
                                                                .s("BOOKING#" + bookingId)
                                                                .build(),

                                                "hotelId", AttributeValue.builder()
                                                                .s(hotelId)
                                                                .build(),

                                                "roomId", AttributeValue.builder()
                                                                .s(roomId)
                                                                .build(),

                                                "checkIn", AttributeValue.builder()
                                                                .s(checkIn)
                                                                .build(),

                                                "checkOut", AttributeValue.builder()
                                                                .s(checkOut)
                                                                .build(),

                                                "status", AttributeValue.builder()
                                                                .s("confirmed")
                                                                .build(),

                                                "total", AttributeValue.builder()
                                                                .n(String.valueOf(total))
                                                                .build(),

                                                "createdAt", AttributeValue.builder()
                                                                .s(Instant.now().toString())
                                                                .build()))

                                .build();

                /*
                 * =====================================================
                 * 3. THỰC HIỆN TRANSACTION
                 * =====================================================
                 *
                 * Hai thao tác trên sẽ được thực hiện cùng nhau.
                 */
                TransactWriteItem updateRoomTransaction = TransactWriteItem.builder()
                                .update(updateRoom)
                                .build();

                TransactWriteItem putBookingTransaction = TransactWriteItem.builder()
                                .put(putBooking)
                                .build();

                TransactWriteItemsRequest transaction = TransactWriteItemsRequest.builder()
                                .transactItems(
                                                updateRoomTransaction,
                                                putBookingTransaction)
                                .build();

                dynamoDbClient.transactWriteItems(transaction);

                return bookingId;
        }

        public List<Map<String, String>> getBookingsByGuest(String guestId) {

                QueryRequest request = QueryRequest.builder()
                                .tableName("HotelBooking")
                                .keyConditionExpression("PK = :pk AND begins_with(SK, :sk)")
                                .expressionAttributeValues(Map.of(
                                                ":pk", AttributeValue.builder()
                                                                .s("GUEST#" + guestId)
                                                                .build(),

                                                ":sk", AttributeValue.builder()
                                                                .s("BOOKING#")
                                                                .build()))
                                .build();

                QueryResponse response = dynamoDbClient.query(request);

                List<Map<String, String>> bookings = new ArrayList<>();

                for (Map<String, AttributeValue> item : response.items()) {

                        Map<String, String> booking = new HashMap<>();

                        for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {

                                AttributeValue value = entry.getValue();

                                if (value.s() != null) {

                                        booking.put(
                                                        entry.getKey(),
                                                        value.s());

                                } else if (value.n() != null) {

                                        booking.put(
                                                        entry.getKey(),
                                                        value.n());
                                }
                        }

                        // ================================
                        // Lấy bookingId từ SK
                        // SK có dạng:
                        // BOOKING#B001
                        // ================================

                        AttributeValue skValue = item.get("SK");

                        if (skValue != null && skValue.s() != null) {

                                String sk = skValue.s();

                                if (sk.startsWith("BOOKING#")) {

                                        String bookingId = sk.substring("BOOKING#".length());

                                        booking.put(
                                                        "bookingId",
                                                        bookingId);
                                }
                        }

                        bookings.add(booking);
                }

                return bookings;
        }

        public void cancelBooking(String guestId, String bookingId) {

                Map<String, AttributeValue> bookingKey = Map.of(
                                "PK", AttributeValue.builder()
                                                .s("GUEST#" + guestId)
                                                .build(),
                                "SK", AttributeValue.builder()
                                                .s("BOOKING#" + bookingId)
                                                .build());

                GetItemRequest getBookingRequest = GetItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(bookingKey)
                                .build();

                GetItemResponse bookingResponse = dynamoDbClient.getItem(getBookingRequest);

                if (!bookingResponse.hasItem()) {
                        throw new RuntimeException("Không tìm thấy booking");
                }

                Map<String, AttributeValue> booking = bookingResponse.item();

                String status = booking.get("status") != null ? booking.get("status").s() : null;
                if ("cancelled".equals(status)) {
                        throw new RuntimeException("Booking này đã bị hủy trước đó");
                }

                String hotelId = booking.get("hotelId") != null ? booking.get("hotelId").s() : null;
                String roomId = booking.get("roomId") != null ? booking.get("roomId").s() : null;

                // 1) Hủy booking (không phụ thuộc trạng thái phòng)
                UpdateItemRequest updateBooking = UpdateItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(bookingKey)
                                .updateExpression("SET #status = :cancelled")
                                .expressionAttributeNames(Map.of("#status", "status"))
                                .expressionAttributeValues(Map.of(
                                                ":cancelled", AttributeValue.builder().s("cancelled").build()))
                                .build();

                dynamoDbClient.updateItem(updateBooking);

                // 2) Mở lại phòng nếu còn thông tin hotel/room (best effort)
                if (hotelId != null && roomId != null) {
                        try {
                                UpdateItemRequest updateRoom = UpdateItemRequest.builder()
                                                .tableName("HotelBooking")
                                                .key(Map.of(
                                                                "PK", AttributeValue.builder().s("HOTEL#" + hotelId).build(),
                                                                "SK", AttributeValue.builder().s("ROOM#" + roomId).build()))
                                                .updateExpression("SET #status = :available")
                                                .expressionAttributeNames(Map.of("#status", "status"))
                                                .expressionAttributeValues(Map.of(
                                                                ":available", AttributeValue.builder().s("available").build()))
                                                .build();
                                dynamoDbClient.updateItem(updateRoom);
                        } catch (Exception ignored) {
                                // Không chặn hủy booking nếu phòng không cập nhật được
                        }
                }
        }

        public void payBooking(String guestId, String bookingId) {
                payBooking(guestId, bookingId, "cash");
        }

        public void payBooking(String guestId, String bookingId, String paymentMethod) {

                // Key của booking
                Map<String, AttributeValue> bookingKey = Map.of(
                                "PK", AttributeValue.builder()
                                                .s("GUEST#" + guestId)
                                                .build(),

                                "SK", AttributeValue.builder()
                                                .s("BOOKING#" + bookingId)
                                                .build());

                // Cập nhật trạng thái thanh toán
                Update updateBooking = Update.builder()
                                .tableName("HotelBooking")

                                .key(bookingKey)

                                .updateExpression("SET paymentStatus = :paid, paymentMethod = :method, paidAt = :paidAt")

                                .expressionAttributeValues(Map.of(
                                                ":paid", AttributeValue.builder()
                                                                .s("paid")
                                                                .build(),

                                                ":confirmed", AttributeValue.builder()
                                                                .s("confirmed")
                                                                .build()))

                                // Chỉ thanh toán booking đang confirmed
                                .conditionExpression("#status = :confirmed")

                                .expressionAttributeNames(Map.of(
                                                "#status", "status"))

                                .build();

                TransactWriteItem transactionItem = TransactWriteItem.builder()
                                .update(updateBooking)
                                .build();

                TransactWriteItemsRequest transaction = TransactWriteItemsRequest.builder()
                                .transactItems(transactionItem)
                                .build();

                dynamoDbClient.transactWriteItems(transaction);
        }

        public List<Map<String, String>> getAllBookings() {
                ScanRequest request = ScanRequest.builder()
                                .tableName("HotelBooking")
                                .filterExpression("begins_with(SK, :sk)")
                                .expressionAttributeValues(Map.of(
                                                ":sk", AttributeValue.builder().s("BOOKING#").build()))
                                .build();

                ScanResponse response = dynamoDbClient.scan(request);
                List<Map<String, String>> bookings = new ArrayList<>();

                for (Map<String, AttributeValue> item : response.items()) {
                        Map<String, String> booking = new HashMap<>();

                        for (Map.Entry<String, AttributeValue> entry : item.entrySet()) {
                                AttributeValue value = entry.getValue();
                                if (value.s() != null) {
                                        booking.put(entry.getKey(), value.s());
                                } else if (value.n() != null) {
                                        booking.put(entry.getKey(), value.n());
                                }
                        }

                        AttributeValue skValue = item.get("SK");
                        if (skValue != null && skValue.s() != null && skValue.s().startsWith("BOOKING#")) {
                                booking.put("bookingId", skValue.s().substring("BOOKING#".length()));
                        }

                        AttributeValue pkValue = item.get("PK");
                        if (pkValue != null && pkValue.s() != null && pkValue.s().startsWith("GUEST#")) {
                                booking.put("guestId", pkValue.s().substring("GUEST#".length()));
                        }

                        bookings.add(booking);
                }

                return bookings;
        }

        public void adminUpdateBookingStatus(String guestId, String bookingId, String newStatus) {
                Map<String, AttributeValue> bookingKey = Map.of(
                                "PK", AttributeValue.builder().s("GUEST#" + guestId).build(),
                                "SK", AttributeValue.builder().s("BOOKING#" + bookingId).build());

                UpdateItemRequest request = UpdateItemRequest.builder()
                                .tableName("HotelBooking")
                                .key(bookingKey)
                                .updateExpression("SET #status = :status")
                                .expressionAttributeNames(Map.of("#status", "status"))
                                .expressionAttributeValues(Map.of(
                                                ":status", AttributeValue.builder().s(newStatus).build()))
                                .build();

                dynamoDbClient.updateItem(request);
        }

        private boolean isRoomAvailableInRange(String hotelId, String roomId, String checkIn, String checkOut) {
                java.time.LocalDate in = java.time.LocalDate.parse(checkIn);
                java.time.LocalDate out = java.time.LocalDate.parse(checkOut);
                if (!out.isAfter(in)) {
                        throw new RuntimeException("Ngày trả phòng phải sau ngày nhận phòng");
                }

                var response = dynamoDbClient.scan(software.amazon.awssdk.services.dynamodb.model.ScanRequest.builder()
                                .tableName("HotelBooking")
                                .filterExpression("begins_with(SK, :sk) AND hotelId = :hid AND roomId = :rid")
                                .expressionAttributeValues(java.util.Map.of(
                                                ":sk", AttributeValue.builder().s("BOOKING#").build(),
                                                ":hid", AttributeValue.builder().s(hotelId).build(),
                                                ":rid", AttributeValue.builder().s(roomId).build()))
                                .build());

                for (var item : response.items()) {
                        String status = item.get("status") != null ? item.get("status").s() : "";
                        if ("cancelled".equals(status)) continue;
                        String bIn = item.get("checkIn") != null ? item.get("checkIn").s() : null;
                        String bOut = item.get("checkOut") != null ? item.get("checkOut").s() : null;
                        if (bIn == null || bOut == null) continue;
                        java.time.LocalDate bi = java.time.LocalDate.parse(bIn);
                        java.time.LocalDate bo = java.time.LocalDate.parse(bOut);
                        // overlap if in < bo && out > bi
                        if (in.isBefore(bo) && out.isAfter(bi)) {
                                return false;
                        }
                }
                return true;
        }

}
