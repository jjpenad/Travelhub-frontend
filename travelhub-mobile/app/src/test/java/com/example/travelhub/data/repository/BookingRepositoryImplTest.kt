package com.example.travelhub.data.repository

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.local.entity.BookingEntity
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse
import com.example.travelhub.data.remote.dto.PaymentRequestDto
import com.example.travelhub.data.remote.dto.PrimaryGuestDto
import com.example.travelhub.data.remote.dto.ReservationDto
import com.example.travelhub.data.remote.dto.ReservationResultDto
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

class BookingRepositoryImplTest {

    private lateinit var bookingDao: BookingDao
    private lateinit var api: AccommodationApi
    private lateinit var guestSessionStore: GuestSessionStore
    private lateinit var bookingRepository: BookingRepositoryImpl

    @Before
    fun setup() {
        bookingDao = mockk(relaxed = true)
        api = mockk(relaxed = true)
        guestSessionStore = mockk(relaxed = true)
        bookingRepository = BookingRepositoryImpl(bookingDao, api, guestSessionStore)
    }

    @Test
    fun `create booking inserts into DAO and returns success`() = runTest {
        val booking = Booking(
            id = "bk_test", userId = "user_001", propertyId = "prop_001",
            propertyName = "Test Hotel", propertyLocation = "Test City",
            checkIn = LocalDate.of(2025, 6, 1), checkOut = LocalDate.of(2025, 6, 5),
            totalPrice = 500.0, bookingRef = "HTL-TEST-001"
        )

        val result = bookingRepository.create(booking)

        assertTrue(result.isSuccess)
        coVerify { bookingDao.insert(any()) }
    }

    @Test
    fun `get bookings by user id returns from DAO`() = runTest {
        val entities = listOf(
            BookingEntity("bk_001", "user_001", "prop_001", "Hotel A", "City A",
                "2025-03-15", "2025-03-22", 2, 1, "Suite", 2240.0, "CONFIRMED", "HTL-001")
        )
        coEvery { bookingDao.getByUserId("user_001") } returns entities

        val bookings = bookingRepository.getByUserId("user_001")

        assertEquals(1, bookings.size)
        assertEquals("Hotel A", bookings[0].propertyName)
    }

    @Test
    fun `cancel booking updates status in DAO`() = runTest {
        val result = bookingRepository.cancel("bk_001")

        assertTrue(result.isSuccess)
        coVerify { bookingDao.updateStatus("bk_001", "CANCELLED") }
    }

    @Test
    fun `createReservation calls API and returns response`() = runTest {
        val request = CreateReservationRequest(
            hotelId = "h1", roomTypeId = "r1", checkIn = "2026-05-01", checkOut = "2026-05-05",
            guests = 2, basePrice = "500.00", totalPrice = "500.00",
            primaryGuest = PrimaryGuestDto("John", "Doe"),
            payment = PaymentRequestDto("500.00")
        )
        val response = CreateReservationResponse(
            completed = false, step = "validate",
            result = ReservationResultDto(
                success = true, proceed = false, exists = false, overlap = false, fromKafka = true,
                confirmationCode = "RES123", reservationId = null, status = null, message = "OK",
                reservation = ReservationDto("id1", "pending", "2026-05-01", "2026-05-05", "500.00")
            )
        )
        coEvery { api.createReservation(any()) } returns response

        val result = bookingRepository.createReservation(request)

        assertTrue(result.isSuccess)
        assertEquals("RES123", result.getOrNull()?.result?.confirmationCode)
    }

    @Test
    fun `createReservation persists user_session when present`() = runTest {
        val request = CreateReservationRequest(
            hotelId = "h1", roomTypeId = "r1", checkIn = "2026-05-01", checkOut = "2026-05-05",
            guests = 2, basePrice = "500.00", totalPrice = "500.00",
            primaryGuest = PrimaryGuestDto("John", "Doe"),
            payment = PaymentRequestDto("500.00")
        )
        val response = CreateReservationResponse(
            completed = true, step = "done",
            result = ReservationResultDto(
                success = true, proceed = true, exists = false, overlap = false, fromKafka = true,
                confirmationCode = "RES999", reservationId = "id-999", status = "confirmed",
                message = "OK", reservation = null
            ),
            userSession = "guest-from-reservation"
        )
        coEvery { api.createReservation(any()) } returns response

        bookingRepository.createReservation(request)

        verify { guestSessionStore.update("guest-from-reservation") }
    }

    @Test
    fun `createReservation does not call store when user_session is null`() = runTest {
        val request = CreateReservationRequest(
            hotelId = "h1", roomTypeId = "r1", checkIn = "2026-05-01", checkOut = "2026-05-05",
            guests = 2, basePrice = "500.00", totalPrice = "500.00",
            primaryGuest = PrimaryGuestDto("John", "Doe"),
            payment = PaymentRequestDto("500.00")
        )
        val response = CreateReservationResponse(
            completed = false, step = "validate",
            result = ReservationResultDto(
                success = true, proceed = false, exists = false, overlap = false, fromKafka = true,
                confirmationCode = null, reservationId = null, status = null, message = null,
                reservation = null
            ),
            userSession = null
        )
        coEvery { api.createReservation(any()) } returns response

        bookingRepository.createReservation(request)

        verify(exactly = 0) { guestSessionStore.update(any()) }
    }

    @Test
    fun `createReservation returns failure on API error`() = runTest {
        val request = CreateReservationRequest(
            hotelId = "h1", roomTypeId = "r1", checkIn = "2026-05-01", checkOut = "2026-05-05",
            guests = 2, basePrice = "500.00", totalPrice = "500.00",
            primaryGuest = PrimaryGuestDto("John", "Doe"),
            payment = PaymentRequestDto("500.00")
        )
        coEvery { api.createReservation(any()) } throws RuntimeException("boom")

        val result = bookingRepository.createReservation(request)

        assertTrue(result.isFailure)
        verify(exactly = 0) { guestSessionStore.update(any()) }
    }
}
