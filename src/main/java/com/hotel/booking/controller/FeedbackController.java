package com.hotel.booking.controller;

import com.hotel.booking.service.FeedbackService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    // Khách gửi góp ý
    @PostMapping("/feedbacks")
    public Map<String, String> add(@RequestBody FeedbackRequest req) {
        return feedbackService.addFeedback(req.hotelId(), req.userId(), req.userName(), req.content());
    }

    // Admin xem danh sách
    @GetMapping("/admin/feedbacks")
    public List<Map<String, String>> list(@RequestParam String userId) {
        return feedbackService.listAll(userId);
    }

    // Admin đổi trạng thái new/done
    @PutMapping("/admin/feedbacks/{feedbackId}/status")
    public Map<String, String> updateStatus(
            @PathVariable String feedbackId,
            @RequestParam String userId,
            @RequestParam String status) {
        feedbackService.updateStatus(userId, feedbackId, status);
        return Map.of("message", "Đã cập nhật góp ý", "status", status);
    }

    // Admin xóa
    @DeleteMapping("/admin/feedbacks/{feedbackId}")
    public Map<String, String> delete(@PathVariable String feedbackId, @RequestParam String userId) {
        feedbackService.delete(userId, feedbackId);
        return Map.of("message", "Đã xóa góp ý");
    }

    public record FeedbackRequest(String hotelId, String userId, String userName, String content) {
    }
}