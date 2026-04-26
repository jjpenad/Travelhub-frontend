package com.example.travelhub.data.local

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.QrAvailability
import io.mockk.every
import io.mockk.mockkStatic
import io.mockk.unmockkStatic
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class HmacQrTokenProviderTest {

    private lateinit var provider: HmacQrTokenProvider

    @Before
    fun setup() {
        provider = HmacQrTokenProvider()
        // android.util.Base64 is the JVM stub returning 0 by default. Real call is OK
        // because of testOptions.unitTests.isReturnDefaultValues, but to assert actual
        // base64 strings we mock it to delegate to java.util.Base64.
        mockkStatic(android.util.Base64::class)
        every { android.util.Base64.encodeToString(any(), any()) } answers {
            val bytes = arg<ByteArray>(0)
            java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        }
    }

    @After
    fun tearDown() {
        unmockkStatic(android.util.Base64::class)
    }

    private fun bookingActive(today: LocalDate = LocalDate.now()): Booking = Booking(
        id = "res-1", userId = "guest-1", propertyId = "h1",
        propertyName = "Casa Sol", propertyLocation = "Lima, Peru",
        checkIn = today.plusDays(1), checkOut = today.plusDays(5),
        totalPrice = 500.0, status = BookingStatus.CONFIRMED, bookingRef = "RES1"
    )

    @Test
    fun `payload carries every relevant id from the booking`() {
        val booking = bookingActive()
        val token = provider.generate(booking)

        assertEquals(booking.id, token.payload.reservationId)
        assertEquals(booking.userId, token.payload.userId)
        assertEquals(booking.propertyId, token.payload.hotelId)
        assertEquals(booking.bookingRef, token.payload.confirmationCode)
        assertTrue(token.payload.expEpochSeconds > token.payload.issuedAtEpochSeconds)
    }

    @Test
    fun `confirmationCode falls back to N slash A when bookingRef is blank`() {
        val booking = bookingActive().copy(bookingRef = "")

        val token = provider.generate(booking)

        assertEquals("N/A", token.payload.confirmationCode)
    }

    @Test
    fun `token is payloadBase64 dot signatureBase64`() {
        val token = provider.generate(bookingActive())
        val parts = token.token.split(".")

        assertEquals(2, parts.size)
        assertTrue(parts[0].isNotBlank())
        assertTrue(parts[1].isNotBlank())
        assertEquals(parts[1], token.signature)
    }

    @Test
    fun `signature is deterministic for the same payload`() {
        val today = LocalDate.of(2026, 5, 1)
        val fixedClock = Clock.fixed(Instant.parse("2026-04-25T10:00:00Z"), ZoneId.of("UTC"))
        provider.clock = fixedClock

        val a = provider.generate(bookingActive(today))
        val b = provider.generate(bookingActive(today))

        // Same input → same canonical → same HMAC → same token.
        assertEquals(a.token, b.token)
    }

    @Test
    fun `signature changes when the booking changes`() {
        val today = LocalDate.of(2026, 5, 1)
        val fixedClock = Clock.fixed(Instant.parse("2026-04-25T10:00:00Z"), ZoneId.of("UTC"))
        provider.clock = fixedClock

        val a = provider.generate(bookingActive(today))
        val b = provider.generate(bookingActive(today).copy(id = "different-id"))

        assertNotEquals(a.signature, b.signature)
    }

    @Test
    fun `availability reflects booking state and today`() {
        val today = LocalDate.of(2026, 5, 10)
        provider.clock = Clock.fixed(today.atStartOfDay(ZoneId.of("UTC")).toInstant(), ZoneId.of("UTC"))

        val active = provider.generate(
            bookingActive(today).copy(checkIn = today, checkOut = today.plusDays(2))
        )
        assertEquals(QrAvailability.ACTIVE, active.availability)

        val cancelled = provider.generate(bookingActive(today).copy(status = BookingStatus.CANCELLED))
        assertEquals(QrAvailability.CANCELLED, cancelled.availability)

        val checkedIn = provider.generate(bookingActive(today).copy(isCheckedIn = true))
        assertEquals(QrAvailability.ALREADY_CHECKED_IN, checkedIn.availability)

        val expired = provider.generate(
            bookingActive(today).copy(checkIn = today.minusDays(10), checkOut = today.minusDays(2))
        )
        assertEquals(QrAvailability.EXPIRED, expired.availability)
    }
}
