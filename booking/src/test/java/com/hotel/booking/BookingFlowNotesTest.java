package com.hotel.booking;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Smoke tests / notes for booking flow.
 * Full integration tests require DynamoDB connection.
 */
class BookingFlowNotesTest {

    @Test
    void nightsCalculation_shouldBePositive() {
        long start = java.time.LocalDate.parse("2026-09-15").toEpochDay();
        long end = java.time.LocalDate.parse("2026-09-17").toEpochDay();
        assertEquals(2, end - start);
    }

    @Test
    void guestLimit_shouldNotExceedMaxGuest() {
        int maxGuest = 4;
        int selected = 3;
        assertTrue(selected <= maxGuest);
    }

    @Test
    void bookingIdFormat_sample() {
        String id = "B" + "ABC123";
        assertTrue(id.startsWith("B"));
        assertEquals(7, id.length());
    }
}
