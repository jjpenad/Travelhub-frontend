package com.example.travelhub.data.mapper

import com.example.travelhub.data.local.entity.BookingEntity
import com.example.travelhub.data.remote.dto.ReservationItemDto
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.Property
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
    status = runCatching { BookingStatus.valueOf(status) }.getOrDefault(BookingStatus.PENDING),
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

/**
 * Convert a backend reservation row to our domain Booking. The list endpoint only
 * returns ids for hotel/room, so the caller passes a [hotelLookup] (typically a map
 * `{id -> Property}` built from the hotels cache) to enrich name + location.
 */
fun ReservationItemDto.toBooking(
    hotelLookup: (String) -> Property?
): Booking {
    val hotel = hotelLookup(hotelId)
    return Booking(
        id = id,
        userId = userId,
        propertyId = hotelId,
        propertyName = hotel?.name ?: "Hotel ${hotelId.take(8)}",
        propertyLocation = hotel?.let {
            buildString {
                append(it.city)
                if (it.country.isNotBlank()) append(", ").append(it.country)
            }
        }.orEmpty(),
        checkIn = runCatching { LocalDate.parse(checkIn) }.getOrDefault(LocalDate.now()),
        checkOut = runCatching { LocalDate.parse(checkOut) }.getOrDefault(LocalDate.now()),
        guests = guests,
        rooms = 1,
        roomType = hotel?.rooms?.firstOrNull { it.id == roomTypeId }?.type.orEmpty(),
        totalPrice = totalPrice.toDoubleOrNull() ?: 0.0,
        status = mapReservationStatus(status),
        bookingRef = confirmationCode.orEmpty()
    )
}

internal fun mapReservationStatus(raw: String): BookingStatus = when (raw.lowercase()) {
    "pending" -> BookingStatus.PENDING
    "confirmed" -> BookingStatus.CONFIRMED
    "cancelled", "canceled" -> BookingStatus.CANCELLED
    "completed" -> BookingStatus.COMPLETED
    else -> BookingStatus.PENDING
}
