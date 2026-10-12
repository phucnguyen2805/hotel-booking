package com.hotel.booking.service;

import com.hotel.booking.model.HotelFeedback;
import com.hotel.booking.repository.HotelFeedbackRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final HotelFeedbackRepository feedbackRepository;
    private final UserService userService;

    public FeedbackService(HotelFeedbackRepository feedbackRepository, UserService userService) {
        this.feedbackRepository = feedbackRepository;
        this.userService = userService;
    }

    public Map<String, String> addFeedback(String hotelId, String userId, String userName, String content) {
        if (hotelId == null || hotelId.isBlank()) {
            throw new RuntimeException("Thiếu mã khách sạn");
        }
        if (userId == null || userId.isBlank()) {
            throw new RuntimeException("Vui lòng đăng nhập để gửi góp ý");
        }
        String text = content == null ? "" : content.trim();
        if (text.length() < 5) {
            throw new RuntimeException("Góp ý quá ngắn (tối thiểu 5 ký tự)");
        }
        if (text.length() > 1000) {
            throw new RuntimeException("Góp ý tối đa 1000 ký tự");
        }

        HotelFeedback doc = new HotelFeedback();
        doc.setHotelId(hotelId);
        doc.setUserId(userId);
        doc.setUserName(userName == null || userName.isBlank() ? userId : userName);
        doc.setContent(text);
        feedbackRepository.save(doc);

        return Map.of("feedbackId", doc.getId(), "message", "Đã gửi góp ý");
    }

    public List<Map<String, String>> listAll(String adminId) {
        userService.checkAdmin(adminId);
        return feedbackRepository.findAllByOrderByCreatedAtDesc().stream().map(f -> {
            Map<String, String> row = new HashMap<>();
            row.put("feedbackId", f.getId());
            row.put("hotelId", f.getHotelId() == null ? "" : f.getHotelId());
            row.put("userId", f.getUserId() == null ? "" : f.getUserId());
            row.put("userName", f.getUserName() == null ? "" : f.getUserName());
            row.put("content", f.getContent() == null ? "" : f.getContent());
            row.put("status", f.getStatus() == null ? "new" : f.getStatus());
            row.put("createdAt", f.getCreatedAt() == null ? "" : f.getCreatedAt().toString());
            return row;
        }).collect(Collectors.toList());
    }

    public void updateStatus(String adminId, String feedbackId, String status) {
        userService.checkAdmin(adminId);
        if (!status.equals("new") && !status.equals("done")) {
            throw new RuntimeException("Trạng thái không hợp lệ");
        }
        HotelFeedback f = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy góp ý"));
        f.setStatus(status);
        feedbackRepository.save(f);
    }

    public void delete(String adminId, String feedbackId) {
        userService.checkAdmin(adminId);
        feedbackRepository.deleteById(feedbackId);
    }
}