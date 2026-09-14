package com.hotel.booking.controller;

import com.hotel.booking.service.BookingService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public Map<String, String> createBooking(
            @RequestBody BookingRequest request) {

        String bookingId = bookingService.createBooking(
                request.guestId(),
                request.hotelId(),
                request.roomId(),
                request.checkIn(),
                request.checkOut(),
                request.total());

        return Map.of(
                "message", "Đặt phòng thành công",
                "bookingId", bookingId);
    }

    public record BookingRequest(
            String guestId,
            String hotelId,
            String roomId,
            String checkIn,
            String checkOut,
            long total) {
    }

    @GetMapping("/guest/{guestId}")
    public List<Map<String, String>> getBookings(
            @PathVariable String guestId) {

        return bookingService.getBookingsByGuest(guestId);
    }

    @PutMapping("/{bookingId}/cancel")
    public Map<String, String> cancelBooking(
            @PathVariable String bookingId,
            @RequestParam String guestId) {

        bookingService.cancelBooking(guestId, bookingId);

        return Map.of(
                "message", "Hủy booking thành công",
                "bookingId", bookingId);
    }

    @PutMapping("/{bookingId}/pay")
    public Map<String, String> payBooking(
            @PathVariable String bookingId,
            @RequestParam String guestId) {

        bookingService.payBooking(guestId, bookingId);

        return Map.of(
                "message", "Thanh toán thành công",
                "bookingId", bookingId,
                "paymentStatus", "paid");
    }

    @GetMapping
    public List<Map<String, String>> getAllBookings() {
        return bookingService.getAllBookings();
    }

    @PutMapping("/{bookingId}/status")
    public Map<String, String> updateStatus(
            @PathVariable String bookingId,
            @RequestParam String guestId,
            @RequestParam String status) {

        bookingService.adminUpdateBookingStatus(guestId, bookingId, status);

        return Map.of(
                "message", "Cập nhật trạng thái thành công",
                "bookingId", bookingId,
                "status", status);
    }
}
