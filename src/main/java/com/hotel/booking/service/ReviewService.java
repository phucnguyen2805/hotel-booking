package com.hotel.booking.service;

import com.hotel.booking.model.ReviewDocument;
import com.hotel.booking.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public Map<String, String> addReview(
            String hotelId,
            String userId,
            String userName,
            int stars,
            String comment) {

        if (stars < 1 || stars > 5) {
            throw new RuntimeException("Số sao phải từ 1 đến 5");
        }

        ReviewDocument doc = new ReviewDocument();
        doc.setHotelId(hotelId);
        doc.setUserId(userId);
        doc.setUserName(userName == null ? userId : userName);
        doc.setStars(stars);
        doc.setComment(comment == null ? "" : comment);

        reviewRepository.save(doc);

        Map<String, String> res = new HashMap<>();
        res.put("reviewId", doc.getId());
        res.put("message", "Đánh giá thành công");
        return res;
    }

    public List<Map<String, String>> listByHotel(String hotelId) {
        return reviewRepository.findByHotelIdOrderByCreatedAtDesc(hotelId)
                .stream()
                .map(r -> {
                    Map<String, String> row = new HashMap<>();
                    row.put("reviewId", r.getId() == null ? "" : r.getId());
                    row.put("userName", r.getUserName() == null ? "" : r.getUserName());
                    row.put("stars", String.valueOf(r.getStars()));
                    row.put("comment", r.getComment() == null ? "" : r.getComment());
                    row.put("createdAt", r.getCreatedAt() == null ? "" : r.getCreatedAt().toString());
                    return row;
                })
                .collect(Collectors.toList());
    }
}
