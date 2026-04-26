package com.example.travelhub.domain.model

import java.time.LocalDate

data class Booking(
    val id: String,
    val userId: String,
    val propertyId: String,
    val propertyName: String,
    val propertyLocation: String,
    val checkIn: LocalDate,
    val checkOut: LocalDate,
    val guests: Int = 2,
    val rooms: Int = 1,
    val roomType: String = "Suite",
    val totalPrice: Double,
    val status: BookingStatus = BookingStatus.CONFIRMED,
    val bookingRef: String = "",
    /** Local-only marker. The backend doesn't track check-in state; we set this
     *  flag when the guest completes self check-in via the app. Preserved across
     *  reservation list refreshes (see BookingRepositoryImpl.getReservations). */
    val isCheckedIn: Boolean = false
)

enum class BookingStatus {
    PENDING,
    CONFIRMED,
    CANCELLED,
    COMPLETED
}
