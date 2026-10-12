package com.hotel.booking.controller;

import com.hotel.booking.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<Map<String, String>> listUsers(@RequestParam String userId) {
        return userService.listUsers(userId);
    }

    @PutMapping("/{targetUserId}/status")
    public Map<String, String> updateStatus(
            @PathVariable String targetUserId,
            @RequestParam String userId,
            @RequestParam String status) {

        userService.updateUserStatus(userId, targetUserId, status);
        return Map.of(
                "message", "Cập nhật trạng thái user thành công",
                "userId", targetUserId,
                "status", status);
    }

    @PutMapping("/{targetUserId}/role")
    public Map<String, String> updateRole(
            @PathVariable String targetUserId,
            @RequestParam String userId,
            @RequestParam String role) {
        userService.updateUserRole(userId, targetUserId, role);
        return Map.of("message", "Đã đổi vai trò", "userId", targetUserId, "role", role);
    }

    @PutMapping("/{targetUserId}/reset-password")
    public Map<String, String> resetPassword(
            @PathVariable String targetUserId,
            @RequestParam String userId,
            @RequestParam(defaultValue = "123456") String newPassword) {
        userService.resetPassword(userId, targetUserId, newPassword);
        return Map.of("message", "Đã reset mật khẩu", "userId", targetUserId);
    }
}

