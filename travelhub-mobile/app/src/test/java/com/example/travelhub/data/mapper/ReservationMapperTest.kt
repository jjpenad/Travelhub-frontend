package com.example.travelhub.data.mapper

import com.example.travelhub.data.remote.dto.ReservationItemDto
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

class ReservationMapperTest {

    private fun dto(
        id: String = "r1",
        userId: String = "session-A",
        hotelId: String = "h1",
        roomTypeId: String = "rt1",
        checkIn: String = "2026-05-01",
        checkOut: String = "2026-05-05",
        guests: Int = 2,
        totalPrice: String = "500.00",
        status: String = "confirmed",
        confirmationCode: String? = "RES1"
    ) = ReservationItemDto(
        id = id, userId = userId, hotelId = hotelId, roomTypeId = roomTypeId,
        checkIn = checkIn, checkOut = checkOut, guests = guests,
        totalPrice = totalPrice, status = status, confirmationCode = confirmationCode
    )

    @Test
    fun `toBooking enriches name and location from hotel cache`() {
        val hotel = Property(
            id = "h1", name = "Casa Sol", address = "", city = "Lima", country = "Peru",
            rooms = listOf(Room(id = "rt1", type = "Ocean", price = 200.0))
        )

        val booking = dto().toBooking { id -> if (id == "h1") hotel else null }

        assertEquals("Casa Sol", booking.propertyName)
        assertEquals("Lima, Peru", booking.propertyLocation)
        assertEquals("Ocean", booking.roomType)
    }

    @Test
    fun `toBooking falls back to hotel id prefix when not in cache`() {
        val booking = dto(hotelId = "abcdef0123456789").toBooking { null }

        assertTrue(booking.propertyName.startsWith("Hotel "))
        assertTrue(booking.propertyName.contains("abcdef01"))
        assertEquals("", booking.propertyLocation)
        assertEquals("", booking.roomType)
    }

    @Test
    fun `toBooking parses dates and prices`() {
        val booking = dto(checkIn = "2026-05-01", checkOut = "2026-05-05", totalPrice = "750.50")
            .toBooking { null }

        assertEquals(LocalDate.of(2026, 5, 1), booking.checkIn)
        assertEquals(LocalDate.of(2026, 5, 5), booking.checkOut)
        assertEquals(750.5, booking.totalPrice, 0.0)
    }

    @Test
    fun `toBooking handles malformed dates gracefully`() {
        val booking = dto(checkIn = "not-a-date", checkOut = "also-bad").toBooking { null }

        // Falls back to today instead of throwing — keeps the row visible.
        assertEquals(LocalDate.now(), booking.checkIn)
        assertEquals(LocalDate.now(), booking.checkOut)
    }

    @Test
    fun `toBooking handles malformed total price as zero`() {
        val booking = dto(totalPrice = "abc").toBooking { null }
        assertEquals(0.0, booking.totalPrice, 0.0)
    }

    @Test
    fun `toBooking propagates user id and confirmation code`() {
        val booking = dto(userId = "session-XYZ", confirmationCode = "CODE123").toBooking { null }

        assertEquals("session-XYZ", booking.userId)
        assertEquals("CODE123", booking.bookingRef)
    }

    @Test
    fun `toBooking treats null confirmation code as empty ref`() {
        val booking = dto(confirmationCode = null).toBooking { null }
        assertEquals("", booking.bookingRef)
    }

    @Test
    fun `mapReservationStatus covers known backend values`() {
        assertEquals(BookingStatus.PENDING, mapReservationStatus("pending"))
        assertEquals(BookingStatus.CONFIRMED, mapReservationStatus("confirmed"))
        assertEquals(BookingStatus.CANCELLED, mapReservationStatus("cancelled"))
        assertEquals(BookingStatus.CANCELLED, mapReservationStatus("canceled"))
        assertEquals(BookingStatus.COMPLETED, mapReservationStatus("completed"))
    }

    @Test
    fun `mapReservationStatus is case insensitive`() {
        assertEquals(BookingStatus.CONFIRMED, mapReservationStatus("CONFIRMED"))
        assertEquals(BookingStatus.CONFIRMED, mapReservationStatus("Confirmed"))
    }

    @Test
    fun `mapReservationStatus falls back to PENDING for unknown values`() {
        assertEquals(BookingStatus.PENDING, mapReservationStatus("anything-else"))
        assertEquals(BookingStatus.PENDING, mapReservationStatus(""))
    }
}
