package com.example.travelhub.domain.model

import org.junit.Assert.assertEquals
import org.junit.Test

class SortOptionTest {

    private fun property(
        id: String,
        price: Double = 0.0,
        rating: Double = 0.0,
        reviews: Int = 0
    ) = Property(
        id = id,
        name = "Hotel $id",
        address = "addr",
        city = "city",
        country = "country",
        rating = rating,
        reviewCount = reviews,
        pricePerNight = price
    )

    private val sample = listOf(
        property(id = "A", price = 200.0, rating = 4.5, reviews = 50),
        property(id = "B", price = 100.0, rating = 4.9, reviews = 10),
        property(id = "C", price = 300.0, rating = 4.0, reviews = 200)
    )

    @Test
    fun `PRICE_ASC sorts by ascending pricePerNight`() {
        val sorted = sample.applySort(SortOption.PRICE_ASC)

        assertEquals(listOf("B", "A", "C"), sorted.map { it.id })
    }

    @Test
    fun `PRICE_DESC sorts by descending pricePerNight`() {
        val sorted = sample.applySort(SortOption.PRICE_DESC)

        assertEquals(listOf("C", "A", "B"), sorted.map { it.id })
    }

    @Test
    fun `RATING sorts by descending rating`() {
        val sorted = sample.applySort(SortOption.RATING)

        assertEquals(listOf("B", "A", "C"), sorted.map { it.id })
    }

    @Test
    fun `POPULARITY sorts by descending reviewCount`() {
        val sorted = sample.applySort(SortOption.POPULARITY)

        assertEquals(listOf("C", "A", "B"), sorted.map { it.id })
    }

    @Test
    fun `applySort on empty list returns empty list`() {
        val sorted = emptyList<Property>().applySort(SortOption.PRICE_ASC)

        assertEquals(emptyList<Property>(), sorted)
    }

    @Test
    fun `every SortOption has a non-blank label`() {
        SortOption.values().forEach { option ->
            assert(option.label.isNotBlank()) { "Expected ${option.name} to have a label" }
        }
    }
}
