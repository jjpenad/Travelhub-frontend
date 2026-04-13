package com.example.travelhub.data.mapper

import com.example.travelhub.data.local.entity.BookingEntity
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import java.time.LocalDate

fun BookingEntity.toDomain(): Booking = Booking(
    id = id,
    userId = userId,
    propertyId = propertyId,
    propertyName = propertyName,
    propertyLocation = propertyLocation,
    checkIn = LocalDate.parse(checkIn),
    checkOut = LocalDate.parse(checkOut),
    guests = guests,
    rooms = rooms,
    roomType = roomType,
    totalPrice = totalPrice,
    status = BookingStatus.valueOf(status),
    bookingRef = bookingRef
)

fun Booking.toEntity(): BookingEntity = BookingEntity(
    id = id,
    userId = userId,
    propertyId = propertyId,
    propertyName = propertyName,
    propertyLocation = propertyLocation,
    checkIn = checkIn.toString(),
    checkOut = checkOut.toString(),
    guests = guests,
    rooms = rooms,
    roomType = roomType,
    totalPrice = totalPrice,
    status = status.name,
    bookingRef = bookingRef
)
