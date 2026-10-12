package com.hotel.booking.controller;

import com.hotel.booking.service.RevenueService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/revenue")
public class RevenueController {

    private final RevenueService revenueService;

    public RevenueController(RevenueService revenueService) {
        this.revenueService = revenueService;
    }

    @GetMapping
    public Map<String, Object> getRevenue(
            @RequestParam String userId,
            @RequestParam String hotelId,
            @RequestParam String month) {

        return revenueService.getRevenue(
                userId,
                hotelId,
                month);
    }
}