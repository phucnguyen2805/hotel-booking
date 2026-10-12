package com.hotel.booking.controller;

import com.hotel.booking.service.AuthService;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ==========================================
    // ĐĂNG KÝ
    // ==========================================

    @PostMapping("/register")
    public Map<String, String> register(
            @RequestBody RegisterRequest request) {

        String userId = authService.register(
                request.name(),
                request.email(),
                request.password());

        return Map.of(
                "message", "Đăng ký thành công",
                "userId", userId,
                "role", "CUSTOMER");
    }

    // ==========================================
    // ĐĂNG NHẬP
    // ==========================================

    @PostMapping("/login")
    public Map<String, String> login(
            @RequestBody LoginRequest request) {

        return authService.login(
                request.email(),
                request.password());
    }

    // ==========================================
    // REQUEST ĐĂNG KÝ
    // ==========================================

    public record RegisterRequest(
            String name,
            String email,
            String password) {
    }

    // ==========================================
    // REQUEST ĐĂNG NHẬP
    // ==========================================

    public record LoginRequest(
            String email,
            String password) {
    }
}