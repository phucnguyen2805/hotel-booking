package com.hotel.booking.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadImage(MultipartFile file, String type) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File ảnh trống");
        }

        String folder = "room".equalsIgnoreCase(type)
                ? "hotel-booking/rooms"
                : "hotel-booking/hotels";

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "image"
                )
        );

        return (String) result.get("secure_url");
    }

    public String uploadImage(MultipartFile file) throws Exception {
        return uploadImage(file, "hotel");
    }
}
