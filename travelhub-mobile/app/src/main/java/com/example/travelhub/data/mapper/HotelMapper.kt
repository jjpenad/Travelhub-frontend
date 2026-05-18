package com.example.travelhub.data.mapper

import com.example.travelhub.data.remote.dto.HotelAvailabilityDto
import com.example.travelhub.data.remote.dto.HotelDto
import com.example.travelhub.data.remote.dto.HotelSearchResultDto
import com.example.travelhub.data.remote.dto.RoomTypeDto
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room

// City → Country mapping for the 6 available cities
private val cityCountryMap = mapOf(
    "Bogotá" to "Colombia",
    "Bogota" to "Colombia",
    "Lima" to "Peru",
    "Quito" to "Ecuador",
    "Santiago" to "Chile",
    "Buenos Aires" to "Argentina",
    "Ciudad de México" to "Mexico",
    "Ciudad de Mexico" to "Mexico"
)

private fun countryForCity(city: String): String {
    return cityCountryMap[city] ?: cityCountryMap.entries
        .firstOrNull { city.contains(it.key, ignoreCase = true) }?.value ?: ""
}

// List Hotels response → Property
fun HotelDto.toDomain(): Property = Property(
    id = id,
    name = name,
    description = description,
    address = address,
    city = city,
    country = countryForCity(city),
    starRating = stars,
    rating = rating?.toDoubleOrNull() ?: 0.0,
    reviewCount = totalReviews
)

// Search response → Property (with rooms)
fun HotelSearchResultDto.toDomain(): Property = Property(
    id = hotelId,
    name = hotelName,
    description = description,
    address = address,
    city = city,
    country = countryForCity(city),
    starRating = stars,
    rating = rating?.toDoubleOrNull() ?: 0.0,
    checkInTime = checkInTime ?: "",
    checkOutTime = checkOutTime ?: "",
    pricePerNight = availableRoomTypes.minOfOrNull { it.pricePerNight.toDoubleOrNull() ?: 0.0 } ?: 0.0,
    rooms = availableRoomTypes.map { it.toDomain() },
    amenities = availableRoomTypes.flatMap { room -> room.amenities.map { it.name } }.distinct()
)

// Availability response → Property (with rooms + nights)
fun HotelAvailabilityDto.toDomain(): Property = Property(
    id = hotelId,
    name = hotelName,
    description = description,
    address = "",
    city = city,
    country = countryForCity(city),
    starRating = stars,
    rating = rating?.toDoubleOrNull() ?: 0.0,
    checkInTime = checkInTime ?: "",
    checkOutTime = checkOutTime ?: "",
    nights = nights,
    pricePerNight = availableRoomTypes.minOfOrNull { it.pricePerNight.toDoubleOrNull() ?: 0.0 } ?: 0.0,
    rooms = availableRoomTypes.map { it.toDomain() },
    amenities = availableRoomTypes.flatMap { room -> room.amenities.map { it.name } }.distinct()
)

// Room type DTO → Room domain
fun RoomTypeDto.toDomain(): Room = Room(
    id = id,
    type = name,
    description = description,
    price = pricePerNight.toDoubleOrNull() ?: 0.0,
    totalPrice = totalPrice.toDoubleOrNull() ?: 0.0,
    capacity = maxCapacity,
    bedType = bedType,
    sizeSqm = sizeSqm.toDoubleOrNull() ?: 0.0,
    currencyCode = currencyCode,
    amenities = amenities.map { it.name }
)
