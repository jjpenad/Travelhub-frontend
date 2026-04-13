package com.example.travelhub.data.repository

import com.example.travelhub.data.local.entity.BookingEntity
import com.example.travelhub.data.mapper.toDomain
import com.example.travelhub.data.mapper.toEntity
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import org.junit.Assert.assertEquals
import org.junit.Test
import java.time.LocalDate

class BookingMapperTest {

    @Test
    fun `entity to domain maps correctly`() {
        val entity = BookingEntity(
            id = "bk_001", userId = "user_001", propertyId = "prop_001",
            propertyName = "Test Hotel", propertyLocation = "Test City",
            checkIn = "2025-03-15", checkOut = "2025-03-22",
            guests = 2, rooms = 1, roomType = "Suite",
            totalPrice = 2240.0, status = "CONFIRMED", bookingRef = "HTL-001"
        )

        val domain = entity.toDomain()

        assertEquals("bk_001", domain.id)
        assertEquals(LocalDate.of(2025, 3, 15), domain.checkIn)
        assertEquals(BookingStatus.CONFIRMED, domain.status)
        assertEquals(2240.0, domain.totalPrice, 0.01)
    }

    @Test
    fun `domain to entity maps correctly`() {
        val booking = Booking(
            id = "bk_002", userId = "user_001", propertyId = "prop_002",
            propertyName = "Hotel B", propertyLocation = "City B",
            checkIn = LocalDate.of(2025, 4, 1), checkOut = LocalDate.of(2025, 4, 5),
            guests = 3, rooms = 2, roomType = "Deluxe",
            totalPrice = 1500.0, status = BookingStatus.PENDING, bookingRef = "HTL-002"
        )

        val entity = booking.toEntity()

        assertEquals("bk_002", entity.id)
        assertEquals("2025-04-01", entity.checkIn)
        assertEquals("PENDING", entity.status)
    }

    @Test
    fun `round trip preserves data`() {
        val original = Booking(
            id = "bk_003", userId = "user_001", propertyId = "prop_003",
            propertyName = "Hotel C", propertyLocation = "City C",
            checkIn = LocalDate.of(2025, 6, 10), checkOut = LocalDate.of(2025, 6, 15),
            guests = 2, rooms = 1, roomType = "Standard",
            totalPrice = 800.0, status = BookingStatus.COMPLETED, bookingRef = "HTL-003"
        )

        val roundTripped = original.toEntity().toDomain()

        assertEquals(original, roundTripped)
    }
}
