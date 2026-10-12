package com.hotel.booking.controller;

import com.hotel.booking.service.CloudinaryService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class UploadController {

    private final CloudinaryService cloudinaryService;

    public UploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/upload-image")
    public Map<String, String> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "hotel") String type
    ) throws Exception {
        String url = cloudinaryService.uploadImage(file, type);
        return Map.of(
                "imageUrl", url,
                "type", type,
                "message", "Upload ảnh thành công"
        );
    }
}
