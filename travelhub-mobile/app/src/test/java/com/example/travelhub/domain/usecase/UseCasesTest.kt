package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.CheckinResult
import com.example.travelhub.domain.model.Notification
import com.example.travelhub.domain.model.NotificationTimestamp
import com.example.travelhub.domain.model.NotificationType
import com.example.travelhub.domain.model.PaymentReceipt
import com.example.travelhub.domain.model.PaymentStatus
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.repository.BookingRepository
import com.example.travelhub.domain.repository.CheckinRepository
import com.example.travelhub.domain.repository.NotificationRepository
import com.example.travelhub.domain.repository.PaymentRepository
import com.example.travelhub.domain.repository.PropertyRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate

/**
 * Tests for the trivial use-case wrappers. They each delegate to a single repository
 * call, so the assertions are mainly: (a) the right repo method is invoked with the
 * right args, (b) the result flows back unchanged.
 */
class UseCasesTest {

    // ── CancelBookingUseCase ────────────────────────────────────────────

    @Test
    fun `CancelBookingUseCase delegates to repository`() = runTest {
        val repo = mockk<BookingRepository>()
        coEvery { repo.cancel("bk-1") } returns Result.success(Unit)

        val result = CancelBookingUseCase(repo)("bk-1")

        assertTrue(result.isSuccess)
        coVerify(exactly = 1) { repo.cancel("bk-1") }
    }

    // ── CheckinUseCase ──────────────────────────────────────────────────

    @Test
    fun `CheckinUseCase delegates to repository`() = runTest {
        val repo = mockk<CheckinRepository>()
        val expected = CheckinResult(
            id = "ck-1",
            bookingId = "bk-1",
            roomNumber = "Suite",
            checkinDate = LocalDate.of(2026, 5, 1)
        )
        coEvery { repo.checkin("bk-1") } returns Result.success(expected)

        val result = CheckinUseCase(repo)("bk-1")

        assertTrue(result.isSuccess)
        assertSame(expected, result.getOrNull())
    }

    // ── CreateBookingUseCase ────────────────────────────────────────────

    @Test
    fun `CreateBookingUseCase delegates to repository`() = runTest {
        val repo = mockk<BookingRepository>()
        val booking = Booking(
            id = "bk-2", userId = "user_001", propertyId = "p1",
            propertyName = "Hotel A", propertyLocation = "Lima",
            checkIn = LocalDate.of(2026, 5, 1), checkOut = LocalDate.of(2026, 5, 5),
            totalPrice = 500.0
        )
        coEvery { repo.create(booking) } returns Result.success(booking)

        val result = CreateBookingUseCase(repo)(booking)

        assertSame(booking, result.getOrNull())
        coVerify(exactly = 1) { repo.create(booking) }
    }

    // ── GetNotificationsUseCase ─────────────────────────────────────────

    @Test
    fun `GetNotificationsUseCase returns repository data`() = runTest {
        val repo = mockk<NotificationRepository>()
        val list = listOf(
            Notification("n1", "T", "M", NotificationType.BOOKING_CONFIRMED, NotificationTimestamp.JustNow)
        )
        coEvery { repo.getAll() } returns list

        val result = GetNotificationsUseCase(repo)()

        assertEquals(list, result)
    }

    // ── GetPropertiesUseCase ────────────────────────────────────────────

    @Test
    fun `GetPropertiesUseCase exposes featured popular and topStays`() = runTest {
        val repo = mockk<PropertyRepository>()
        val featured = listOf(propertyOf("f1"))
        val popular = listOf(propertyOf("p1"))
        val topStays = listOf(propertyOf("t1"))
        coEvery { repo.getFeatured() } returns featured
        coEvery { repo.getPopular() } returns popular
        coEvery { repo.getTopStays() } returns topStays

        val useCase = GetPropertiesUseCase(repo)

        assertEquals(featured, useCase.getFeatured())
        assertEquals(popular, useCase.getPopular())
        assertEquals(topStays, useCase.getTopStays())
    }

    // ── GetRecentBookingsUseCase ────────────────────────────────────────

    @Test
    fun `GetRecentBookingsUseCase delegates to repository with userId`() = runTest {
        val repo = mockk<BookingRepository>()
        val bookings = listOf(
            Booking("bk", "user_001", "p1", "H", "L",
                LocalDate.now(), LocalDate.now().plusDays(1), totalPrice = 100.0,
                status = BookingStatus.CONFIRMED)
        )
        coEvery { repo.getByUserId("user_001") } returns bookings

        val result = GetRecentBookingsUseCase(repo)("user_001")

        assertEquals(bookings, result)
    }

    // ── GetUserReservationsUseCase ──────────────────────────────────────

    @Test
    fun `GetUserReservationsUseCase delegates with pagination params`() = runTest {
        val repo = mockk<BookingRepository>()
        val expected = com.example.travelhub.domain.model.PagedResult<Booking>(
            items = emptyList(), total = 0, nextOffset = 0
        )
        coEvery { repo.getReservations(20, 40) } returns expected

        val result = GetUserReservationsUseCase(repo)(limit = 20, offset = 40)

        assertSame(expected, result)
        coVerify(exactly = 1) { repo.getReservations(20, 40) }
    }

    @Test
    fun `GetUserReservationsUseCase uses sensible defaults`() = runTest {
        val repo = mockk<BookingRepository>()
        coEvery { repo.getReservations(any(), any()) } returns
            com.example.travelhub.domain.model.PagedResult(emptyList(), 0, 0)

        GetUserReservationsUseCase(repo)()

        coVerify { repo.getReservations(20, 0) }
    }

    // ── GenerateReservationQrUseCase ────────────────────────────────────

    @Test
    fun `GenerateReservationQrUseCase delegates to QrTokenProvider`() {
        val provider = mockk<com.example.travelhub.domain.repository.QrTokenProvider>()
        val booking = Booking(
            id = "res-1", userId = "guest-1", propertyId = "h1",
            propertyName = "Casa Sol", propertyLocation = "Lima",
            checkIn = LocalDate.now(), checkOut = LocalDate.now().plusDays(2),
            totalPrice = 100.0
        )
        val expected = com.example.travelhub.domain.model.QrToken(
            token = "t.s",
            payload = com.example.travelhub.domain.model.QrPayload(
                "res-1", "guest-1", "h1", "RES1", 0L, 100L
            ),
            signature = "s",
            availability = com.example.travelhub.domain.model.QrAvailability.ACTIVE
        )
        every { provider.generate(booking) } returns expected

        val result = GenerateReservationQrUseCase(provider)(booking)

        assertSame(expected, result)
    }

    // ── PayBookingUseCase ───────────────────────────────────────────────

    @Test
    fun `PayBookingUseCase delegates to repository`() = runTest {
        val repo = mockk<PaymentRepository>()
        val receipt = PaymentReceipt(
            id = "r1", bookingId = "bk-1", amount = 100.0,
            cardLast4 = "4242", cardBrand = "Visa", status = PaymentStatus.SUCCESS
        )
        coEvery { repo.processPayment("bk-1", 100.0) } returns Result.success(receipt)

        val result = PayBookingUseCase(repo)("bk-1", 100.0)

        assertSame(receipt, result.getOrNull())
        coVerify(exactly = 1) { repo.processPayment("bk-1", 100.0) }
    }

    // ── helpers ─────────────────────────────────────────────────────────

    private fun propertyOf(id: String): Property = Property(
        id = id, name = "Hotel $id", address = "", city = "", country = ""
    )
}
