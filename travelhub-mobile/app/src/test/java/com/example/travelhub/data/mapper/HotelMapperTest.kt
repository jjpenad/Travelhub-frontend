package com.example.travelhub.data.mapper

import com.example.travelhub.data.remote.dto.AmenityDto
import com.example.travelhub.data.remote.dto.HotelAvailabilityDto
import com.example.travelhub.data.remote.dto.HotelDto
import com.example.travelhub.data.remote.dto.HotelSearchResultDto
import com.example.travelhub.data.remote.dto.RoomTypeDto
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HotelMapperTest {

    // ── HotelDto.toDomain ──────────────────────────────────────────────────

    @Test
    fun `HotelDto resolves country for known city`() {
        val dto = hotelDto(city = "Lima", rating = "4.8")

        val property = dto.toDomain()

        assertEquals("Peru", property.country)
        assertEquals(4.8, property.rating, 0.0)
    }

    @Test
    fun `HotelDto resolves country fuzzy match for compound city names`() {
        val dto = hotelDto(city = "Buenos Aires Norte", rating = "4.0")

        // "Buenos Aires" is a substring of "Buenos Aires Norte" → fuzzy lookup hits.
        assertEquals("Argentina", dto.toDomain().country)
    }

    @Test
    fun `HotelDto unknown city falls back to empty country`() {
        val dto = hotelDto(city = "Atlantis", rating = "3.5")

        assertEquals("", dto.toDomain().country)
    }

    @Test
    fun `HotelDto invalid rating string defaults to zero`() {
        val dto = hotelDto(city = "Lima", rating = "not-a-number")

        assertEquals(0.0, dto.toDomain().rating, 0.0)
    }

    // ── HotelSearchResultDto.toDomain ──────────────────────────────────────

    @Test
    fun `HotelSearchResultDto computes minimum price across rooms`() {
        val dto = HotelSearchResultDto(
            hotelId = "h1", hotelName = "Casa Sol", description = "", address = "",
            city = "Lima", stars = 5, rating = "4.8",
            checkInTime = "14:00:00", checkOutTime = "12:00:00",
            availableRoomTypes = listOf(
                roomTypeDto("r1", price = "300.00"),
                roomTypeDto("r2", price = "100.00"),
                roomTypeDto("r3", price = "200.00")
            )
        )

        val property = dto.toDomain()

        assertEquals(100.0, property.pricePerNight, 0.0)
        assertEquals(3, property.rooms.size)
        assertEquals("Peru", property.country)
        assertEquals("14:00:00", property.checkInTime)
    }

    @Test
    fun `HotelSearchResultDto with no rooms has zero price and empty amenities`() {
        val dto = HotelSearchResultDto(
            hotelId = "h1", hotelName = "Hotel", description = "", address = "",
            city = "Lima", stars = 5, rating = "4.8",
            checkInTime = null, checkOutTime = null,
            availableRoomTypes = emptyList()
        )

        val property = dto.toDomain()

        assertEquals(0.0, property.pricePerNight, 0.0)
        assertTrue(property.amenities.isEmpty())
        assertEquals("", property.checkInTime)
    }

    @Test
    fun `HotelSearchResultDto deduplicates amenities across rooms`() {
        val dto = HotelSearchResultDto(
            hotelId = "h1", hotelName = "Hotel", description = "", address = "",
            city = "Lima", stars = 5, rating = "4.8",
            checkInTime = null, checkOutTime = null,
            availableRoomTypes = listOf(
                roomTypeDto("r1", amenities = listOf("wifi", "tv")),
                roomTypeDto("r2", amenities = listOf("wifi", "minibar"))
            )
        )

        val amenities = dto.toDomain().amenities

        assertEquals(setOf("wifi", "tv", "minibar"), amenities.toSet())
        // Distinct: wifi appears only once.
        assertEquals(3, amenities.size)
    }

    // ── HotelAvailabilityDto.toDomain ──────────────────────────────────────

    @Test
    fun `HotelAvailabilityDto carries nights and resolves country`() {
        val dto = HotelAvailabilityDto(
            hotelId = "h1", hotelName = "Casa Sol", description = "",
            city = "Quito", stars = 5, rating = "4.7",
            checkInTime = "15:00:00", checkOutTime = "12:00:00",
            nights = 4,
            availableRoomTypes = listOf(roomTypeDto("r1", price = "200.00"))
        )

        val property = dto.toDomain()

        assertEquals(4, property.nights)
        assertEquals(200.0, property.pricePerNight, 0.0)
        assertEquals("Ecuador", property.country)
    }

    // ── RoomTypeDto.toDomain ───────────────────────────────────────────────

    @Test
    fun `RoomTypeDto maps fields and parses numeric strings`() {
        val dto = RoomTypeDto(
            id = "r1", name = "Ocean Room", description = "Nice",
            maxCapacity = 2, bedType = "king", sizeSqm = "35.0",
            pricePerNight = "247.50", totalPrice = "990.00",
            currencyCode = "USD", minimumStay = 1,
            amenities = listOf(AmenityDto(name = "wifi", icon = "wifi"))
        )

        val room = dto.toDomain()

        assertEquals("r1", room.id)
        assertEquals("Ocean Room", room.type)
        assertEquals(247.50, room.price, 0.0)
        assertEquals(990.0, room.totalPrice, 0.0)
        assertEquals(35.0, room.sizeSqm, 0.0)
        assertEquals(2, room.capacity)
        assertEquals("king", room.bedType)
        assertEquals("USD", room.currencyCode)
        assertEquals(listOf("wifi"), room.amenities)
    }

    @Test
    fun `RoomTypeDto with malformed numbers defaults to zero`() {
        val dto = RoomTypeDto(
            id = "r1", name = "Room", description = "",
            maxCapacity = 2, bedType = "king", sizeSqm = "?",
            pricePerNight = "abc", totalPrice = "xyz",
            currencyCode = "USD", minimumStay = 1, amenities = emptyList()
        )

        val room = dto.toDomain()

        assertEquals(0.0, room.price, 0.0)
        assertEquals(0.0, room.totalPrice, 0.0)
        assertEquals(0.0, room.sizeSqm, 0.0)
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private fun hotelDto(city: String, rating: String): HotelDto = HotelDto(
        id = "h1", name = "Hotel", description = "Desc", address = "Addr",
        city = city, stars = 5, rating = rating, totalReviews = 100, active = true
    )

    private fun roomTypeDto(
        id: String,
        price: String = "100.00",
        amenities: List<String> = emptyList()
    ): RoomTypeDto = RoomTypeDto(
        id = id, name = "Room $id", description = "", maxCapacity = 2,
        bedType = "king", sizeSqm = "30.0", pricePerNight = price,
        totalPrice = (price.toDoubleOrNull()?.times(4) ?: 0.0).toString(),
        currencyCode = "USD", minimumStay = 1,
        amenities = amenities.map { AmenityDto(name = it, icon = it) }
    )
}
