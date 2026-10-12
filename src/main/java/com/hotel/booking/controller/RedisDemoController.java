package com.hotel.booking.controller;

import com.hotel.booking.service.RedisService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@RestController
@RequestMapping("/redis")
public class RedisDemoController {

    private final RedisService redisService;

    public RedisDemoController(RedisService redisService) {
        this.redisService = redisService;
    }

    @PostMapping("/leaderboard/{hotelId}")
    public Map<String, Object> increaseScore(@PathVariable String hotelId) {
        redisService.increaseHotelScore(hotelId);
        Double score = redisService.getHotelScore(hotelId);
        Map<String, Object> res = new HashMap<>();
        res.put("hotelId", hotelId);
        res.put("score", score);
        res.put("message", "Đã tăng điểm leaderboard");
        return res;
    }

    @GetMapping("/leaderboard/top")
    public Map<String, Object> topHotels(@RequestParam(defaultValue = "5") int limit) {
        Set<String> top = redisService.topHotels(limit);
        Map<String, Object> res = new HashMap<>();
        res.put("topHotels", top);
        return res;
    }

    @PostMapping("/otp/send")
    public Map<String, String> sendOtp(@RequestParam String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        redisService.saveOtp(email, otp);
        return Map.of(
                "email", email,
                "otp", otp,
                "message", "OTP đã tạo, hết hạn sau 5 phút"
        );
    }

    @PostMapping("/otp/verify")
    public Map<String, Object> verifyOtp(
            @RequestParam String email,
            @RequestParam String otp) {
        boolean ok = redisService.verifyOtp(email, otp);
        Map<String, Object> res = new HashMap<>();
        res.put("valid", ok);
        res.put("message", ok ? "OTP hợp lệ" : "OTP sai hoặc đã hết hạn");
        return res;
    }

    @PostMapping("/cache")
    public Map<String, String> setCache(
            @RequestParam String key,
            @RequestParam String value) {
        redisService.cacheHotels(key, value);
        return Map.of("message", "Đã cache với TTL 5 phút", "key", "cache:hotels:" + key);
    }

    @GetMapping("/cache")
    public Map<String, String> getCache(@RequestParam String key) {
        String value = redisService.getCachedHotels(key);
        Map<String, String> res = new HashMap<>();
        res.put("key", "cache:hotels:" + key);
        res.put("value", value == null ? "(empty or expired)" : value);
        return res;
    }
}
