package com.hotel.booking.controller;

import com.hotel.booking.service.BackupService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @GetMapping("/backup")
    public Map<String, Object> backup(
            @RequestParam String userId) {

        return backupService.backup(userId);
    }

    @PostMapping("/restore")
    public Map<String, Object> restore(
            @RequestParam String userId) {

        return backupService.restore(userId);
    }
}