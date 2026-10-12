package com.hotel.booking.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class RedisService {

    private final StringRedisTemplate redis;

    public RedisService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void cacheHotels(String key, String json) {
        redis.opsForValue().set("cache:hotels:" + key, json, Duration.ofMinutes(5));
    }

    public String getCachedHotels(String key) {
        return redis.opsForValue().get("cache:hotels:" + key);
    }

    public void clearHotelCache() {
        Set<String> keys = redis.keys("cache:hotels:*");
        if (keys != null && !keys.isEmpty()) {
            redis.delete(keys);
        }
    }

    public void increaseHotelScore(String hotelId) {
        redis.opsForZSet().incrementScore("leaderboard:hotels", hotelId, 1);
    }

    public Set<String> topHotels(int limit) {
        return redis.opsForZSet().reverseRange("leaderboard:hotels", 0, limit - 1);
    }

    public Double getHotelScore(String hotelId) {
        return redis.opsForZSet().score("leaderboard:hotels", hotelId);
    }

    public void saveOtp(String email, String otp) {
        redis.opsForValue().set("otp:" + email, otp, 5, TimeUnit.MINUTES);
    }

    public boolean verifyOtp(String email, String otp) {
        String saved = redis.opsForValue().get("otp:" + email);
        if (saved != null && saved.equals(otp)) {
            redis.delete("otp:" + email);
            return true;
        }
        return false;
    }
}
