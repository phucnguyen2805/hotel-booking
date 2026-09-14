package com.hotel.booking.controller;

import com.hotel.booking.service.ReviewService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/hotel/{hotelId}")
    public List<Map<String, String>> byHotel(@PathVariable String hotelId) {
        return reviewService.listByHotel(hotelId);
    }

    @PostMapping
    public Map<String, String> add(@RequestBody ReviewRequest req) {
        return reviewService.addReview(req.hotelId(), req.userId(), req.userName(), req.stars(), req.comment());
    }

    public record ReviewRequest(String hotelId, String userId, String userName, int stars, String comment) {}
}
