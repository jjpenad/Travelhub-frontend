package com.example.travelhub.data.mock

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import java.time.LocalDate

object MockBookings {

    private val bookings = mutableListOf(
        Booking(
            id = "bk_001",
            userId = "user_001",
            propertyId = "prop_001",
            propertyName = "Mystique Hotel",
            propertyLocation = "Oia, Santorini, Greece",
            checkIn = LocalDate.of(2025, 3, 15),
            checkOut = LocalDate.of(2025, 3, 22),
            guests = 2,
            rooms = 1,
            roomType = "Suite 214",
            totalPrice = 2240.0,
            status = BookingStatus.CONFIRMED,
            bookingRef = "HTL-2025-83741"
        ),
        Booking(
            id = "bk_002",
            userId = "user_001",
            propertyId = "prop_008",
            propertyName = "Alaya Resort Ubud",
            propertyLocation = "Ubud, Bali, Indonesia",
            checkIn = LocalDate.of(2025, 4, 3),
            checkOut = LocalDate.of(2025, 4, 10),
            guests = 2,
            rooms = 1,
            roomType = "Pool Villa",
            totalPrice = 2450.0,
            status = BookingStatus.PENDING,
            bookingRef = "HTL-2025-92104"
        )
    )

    fun getAll(): List<Booking> = bookings.toList()

    fun getByUserId(userId: String): List<Booking> = bookings.filter { it.userId == userId }

    fun getById(bookingId: String): Booking? = bookings.find { it.id == bookingId }

    fun add(booking: Booking): Booking {
        bookings.add(booking)
        return booking
    }

    fun cancel(bookingId: String): Boolean {
        val index = bookings.indexOfFirst { it.id == bookingId }
        if (index == -1) return false
        bookings[index] = bookings[index].copy(status = BookingStatus.CANCELLED)
        return true
    }

    fun generateBookingRef(): String {
        val num = (10000..99999).random()
        return "HTL-2025-$num"
    }

    fun generateBookingId(): String {
        val num = bookings.size + 1
        return "bk_${num.toString().padStart(3, '0')}"
    }
}
