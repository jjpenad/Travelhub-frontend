package com.example.travelhub.domain.model

data class Room(
    val id: String,
    val type: String,
    val description: String = "",
    val price: Double,
    val totalPrice: Double = 0.0,
    val capacity: Int = 2,
    val bedType: String = "",
    val sizeSqm: Double = 0.0,
    val currencyCode: String = "USD",
    val amenities: List<String> = emptyList()
)
