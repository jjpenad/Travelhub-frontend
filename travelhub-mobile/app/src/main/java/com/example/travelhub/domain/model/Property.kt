package com.example.travelhub.domain.model

data class Property(
    val id: String,
    val name: String,
    val address: String,
    val city: String,
    val country: String,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val description: String = "",
    val images: List<String> = emptyList(),
    val rating: Double = 0.0,
    val reviewCount: Int = 0,
    val starRating: Int = 0,
    val pricePerNight: Double = 0.0,
    val amenities: List<String> = emptyList(),
    val rooms: List<Room> = emptyList(),
    val reviews: List<Review> = emptyList(),
    val checkInTime: String = "",
    val checkOutTime: String = "",
    val nights: Int = 0
)

data class Review(
    val authorName: String,
    val rating: Double,
    val comment: String
)
