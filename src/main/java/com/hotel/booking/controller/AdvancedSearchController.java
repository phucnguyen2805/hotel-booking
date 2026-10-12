package com.hotel.booking.controller;

import com.hotel.booking.service.AdvancedSearchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/hotels")
public class AdvancedSearchController {

    private final AdvancedSearchService advancedSearchService;

    public AdvancedSearchController(
            AdvancedSearchService advancedSearchService) {

        this.advancedSearchService = advancedSearchService;
    }

    @GetMapping("/search")
    public List<Map<String, Object>> searchHotels(

            @RequestParam(required = false) String city,

            @RequestParam(required = false) Integer minStars,

            @RequestParam(required = false) Long maxPrice,

            @RequestParam(required = false) String roomType) {

        return advancedSearchService.searchHotels(
                city,
                minStars,
                maxPrice,
                roomType);
    }
}