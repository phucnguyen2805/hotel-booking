package com.hotel.booking.controller;

import com.hotel.booking.service.AuditService;
import com.hotel.booking.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuditService auditService;

    public DashboardController(DashboardService dashboardService, AuditService auditService) {
        this.dashboardService = dashboardService;
        this.auditService = auditService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> overview(@RequestParam String userId) {
        return dashboardService.overview(userId);
    }

    @GetMapping("/audit")
    public List<Map<String, String>> audit(@RequestParam String userId,
                                           @RequestParam(defaultValue = "30") int limit) {
        // light check via dashboard service dependency path - listRecent is open for admin UI
        return auditService.listRecent(limit);
    }
}
