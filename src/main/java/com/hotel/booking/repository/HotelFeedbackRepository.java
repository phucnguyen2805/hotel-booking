package com.hotel.booking.repository;

import com.hotel.booking.model.HotelFeedback;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HotelFeedbackRepository extends MongoRepository<HotelFeedback, String> {
    List<HotelFeedback> findByHotelId(String hotelId);
    
    List<HotelFeedback> findAllByOrderByCreatedAtDesc();
}
