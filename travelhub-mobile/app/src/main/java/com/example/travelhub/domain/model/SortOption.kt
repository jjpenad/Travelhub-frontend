package com.example.travelhub.domain.model

enum class SortOption(val label: String) {
    PRICE_ASC("Price: low to high"),
    PRICE_DESC("Price: high to low"),
    RATING("Top rated"),
    POPULARITY("Most popular")
}

fun List<Property>.applySort(sort: SortOption): List<Property> = when (sort) {
    SortOption.PRICE_ASC -> sortedBy { it.pricePerNight }
    SortOption.PRICE_DESC -> sortedByDescending { it.pricePerNight }
    SortOption.RATING -> sortedByDescending { it.rating }
    SortOption.POPULARITY -> sortedByDescending { it.reviewCount }
}
