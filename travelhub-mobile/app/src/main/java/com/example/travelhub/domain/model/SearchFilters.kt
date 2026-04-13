package com.example.travelhub.domain.model

import java.time.LocalDate

data class SearchFilters(
    val destination: String = "",
    val checkIn: LocalDate? = null,
    val checkOut: LocalDate? = null,
    val guests: Int = 2,
    val rooms: Int = 1,
    val minPrice: Double? = null,
    val maxPrice: Double? = null,
    val minRating: Double? = null,
    val amenities: List<String> = emptyList()
)
