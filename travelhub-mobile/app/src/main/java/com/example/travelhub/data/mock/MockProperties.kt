package com.example.travelhub.data.mock

import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Review
import com.example.travelhub.domain.model.Room

object MockProperties {

    private val properties = listOf(
        Property(
            id = "prop_001",
            name = "Mystique Hotel",
            address = "Oia Cliffside",
            city = "Oia, Santorini",
            country = "Greece",
            description = "Perched on the cliffs of Oia, Mystique Hotel offers breathtaking caldera views, world-class dining and a private infinity pool. A truly iconic Santorini experience.",
            rating = 4.9,
            reviewCount = 320,
            starRating = 5,
            pricePerNight = 320.0,
            amenities = listOf("Pool", "Breakfast", "Parking", "WiFi", "Spa"),
            rooms = listOf(
                Room(id = "r1", type = "Deluxe Suite", price = 320.0, capacity = 2),
                Room(id = "r2", type = "Premium Suite", price = 450.0, capacity = 3)
            ),
            reviews = listOf(
                Review("Sarah M.", 5.0, "Absolutely breathtaking views! The infinity pool is magical at sunset!"),
                Review("James K.", 4.8, "Perfect honeymoon spot. Staff was incredibly attentive.")
            )
        ),
        Property(
            id = "prop_002",
            name = "Vedema Resort",
            address = "Megalochori Village",
            city = "Megalochori, Santorini",
            country = "Greece",
            description = "A luxurious retreat in the heart of Megalochori village with stunning wine bar, spa facilities, and panoramic sea views.",
            rating = 4.8,
            reviewCount = 215,
            starRating = 5,
            pricePerNight = 245.0,
            amenities = listOf("Wine Bar", "Spa", "Sea View", "WiFi", "Restaurant"),
            rooms = listOf(
                Room(id = "r3", type = "Garden View", price = 245.0, capacity = 2),
                Room(id = "r4", type = "Sea View Suite", price = 380.0, capacity = 2)
            ),
            reviews = listOf(
                Review("Maria L.", 4.9, "The wine bar experience is unforgettable. Great spa too!"),
                Review("Tom R.", 4.7, "Beautiful architecture and peaceful atmosphere.")
            )
        ),
        Property(
            id = "prop_003",
            name = "Canaves Oia Suites",
            address = "Oia Cliffside",
            city = "Oia, Santorini",
            country = "Greece",
            description = "Luxury suites carved into the cliffside with infinity pools and sunset views.",
            rating = 5.0,
            reviewCount = 98,
            starRating = 5,
            pricePerNight = 540.0,
            amenities = listOf("Infinity Pool", "Sunset View", "Butler Service", "WiFi"),
            rooms = listOf(
                Room(id = "r5", type = "Oia Suite", price = 540.0, capacity = 2)
            ),
            reviews = listOf(
                Review("Elena P.", 5.0, "The most beautiful hotel I've ever stayed at.")
            )
        ),
        Property(
            id = "prop_004",
            name = "Amalfi Coast Villa",
            address = "Via Cristoforo Colombo",
            city = "Amalfi",
            country = "Italy",
            description = "A stunning villa perched on the Amalfi Coast with panoramic views of the Mediterranean Sea.",
            rating = 4.95,
            reviewCount = 156,
            starRating = 5,
            pricePerNight = 320.0,
            amenities = listOf("Pool", "Sea View", "Restaurant", "WiFi", "Parking"),
            rooms = listOf(
                Room(id = "r6", type = "Sea View Room", price = 320.0, capacity = 2),
                Room(id = "r7", type = "Premium Villa", price = 580.0, capacity = 4)
            ),
            reviews = listOf(
                Review("Carlos M.", 5.0, "Best views on the Amalfi Coast. Incredible breakfast."),
                Review("Sophie T.", 4.9, "Romantic and peaceful. Will return!")
            )
        ),
        Property(
            id = "prop_005",
            name = "Shinjuku Granbell Hotel",
            address = "2 Chome Kabukicho",
            city = "Tokyo",
            country = "Japan",
            description = "Modern hotel in the heart of Shinjuku with easy access to shopping, dining, and nightlife.",
            rating = 4.5,
            reviewCount = 412,
            starRating = 4,
            pricePerNight = 150.0,
            amenities = listOf("WiFi", "Restaurant", "Bar", "Laundry"),
            rooms = listOf(
                Room(id = "r8", type = "Standard Double", price = 150.0, capacity = 2),
                Room(id = "r9", type = "Superior Twin", price = 200.0, capacity = 2)
            ),
            reviews = listOf(
                Review("Akira N.", 4.5, "Great location for exploring Tokyo. Clean rooms."),
                Review("Lisa W.", 4.4, "Perfect base for Shinjuku area. Friendly staff.")
            )
        ),
        Property(
            id = "prop_006",
            name = "Le Marais Boutique",
            address = "Rue de Rivoli",
            city = "Paris",
            country = "France",
            description = "Charming boutique hotel in the historic Le Marais district, steps from the Seine.",
            rating = 4.6,
            reviewCount = 287,
            starRating = 4,
            pricePerNight = 210.0,
            amenities = listOf("WiFi", "Breakfast", "Bar", "Concierge"),
            rooms = listOf(
                Room(id = "r10", type = "Classic Room", price = 210.0, capacity = 2),
                Room(id = "r11", type = "Suite Parisienne", price = 350.0, capacity = 2)
            ),
            reviews = listOf(
                Review("Pierre D.", 4.7, "Authentic Parisian charm. Loved the breakfast croissants!"),
                Review("Anna K.", 4.5, "Great location for sightseeing.")
            )
        ),
        Property(
            id = "prop_007",
            name = "Manhattan Skyline Hotel",
            address = "Times Square",
            city = "New York",
            country = "USA",
            description = "Iconic hotel with stunning skyline views, located in the heart of Manhattan.",
            rating = 4.3,
            reviewCount = 534,
            starRating = 4,
            pricePerNight = 280.0,
            amenities = listOf("WiFi", "Gym", "Restaurant", "Room Service", "Parking"),
            rooms = listOf(
                Room(id = "r12", type = "City View", price = 280.0, capacity = 2),
                Room(id = "r13", type = "Skyline Suite", price = 520.0, capacity = 3)
            ),
            reviews = listOf(
                Review("Mike J.", 4.3, "Great views of the city. A bit noisy but expected for Times Square."),
                Review("Rachel S.", 4.4, "Excellent service and location.")
            )
        ),
        Property(
            id = "prop_008",
            name = "Alaya Resort Ubud",
            address = "Jalan Hanoman",
            city = "Ubud, Bali",
            country = "Indonesia",
            description = "Peaceful resort surrounded by rice terraces and tropical gardens in the cultural heart of Bali.",
            rating = 4.7,
            reviewCount = 198,
            starRating = 5,
            pricePerNight = 180.0,
            amenities = listOf("Pool", "Spa", "Yoga", "WiFi", "Restaurant"),
            rooms = listOf(
                Room(id = "r14", type = "Garden Room", price = 180.0, capacity = 2),
                Room(id = "r15", type = "Pool Villa", price = 350.0, capacity = 2)
            ),
            reviews = listOf(
                Review("Dewi S.", 4.8, "A slice of paradise. The spa is heavenly."),
                Review("Ben H.", 4.6, "Amazing rice terrace views. Very relaxing stay.")
            )
        )
    )

    fun getAll(): List<Property> = properties

    fun getById(id: String): Property? = properties.find { it.id == id }

    fun search(destination: String): List<Property> {
        if (destination.isBlank()) return properties
        val query = destination.lowercase()
        return properties.filter {
            it.city.lowercase().contains(query) ||
                it.country.lowercase().contains(query) ||
                it.name.lowercase().contains(query)
        }
    }

    fun searchWithFilters(
        destination: String = "",
        minPrice: Double? = null,
        maxPrice: Double? = null,
        minRating: Double? = null
    ): List<Property> {
        return search(destination).filter { property ->
            (minPrice == null || property.pricePerNight >= minPrice) &&
                (maxPrice == null || property.pricePerNight <= maxPrice) &&
                (minRating == null || property.rating >= minRating)
        }
    }

    fun getFeatured(): List<Property> = properties.sortedByDescending { it.rating }.take(4)

    fun getPopular(): List<Property> = properties.sortedByDescending { it.reviewCount }.take(4)

    fun getTopStays(): List<Property> = properties.sortedBy { it.pricePerNight }.take(4)
}
