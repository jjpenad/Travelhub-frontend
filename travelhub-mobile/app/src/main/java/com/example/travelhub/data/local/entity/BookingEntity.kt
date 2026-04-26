package com.example.travelhub.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "bookings")
data class BookingEntity(
    @PrimaryKey
    val id: String,
    val userId: String,
    val propertyId: String,
    val propertyName: String,
    val propertyLocation: String,
    val checkIn: String,
    val checkOut: String,
    val guests: Int,
    val rooms: Int,
    val roomType: String,
    val totalPrice: Double,
    val status: String,
    val bookingRef: String,
    val isCheckedIn: Boolean = false
)
