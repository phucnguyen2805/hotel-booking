package com.hotel.booking.repository;

import com.hotel.booking.model.ReviewDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ReviewRepository extends MongoRepository<ReviewDocument, String> {
    List<ReviewDocument> findByHotelIdOrderByCreatedAtDesc(String hotelId);
    List<ReviewDocument> findByHotelIdAndStarsGreaterThanEqual(String hotelId, int minStars);
}
