package com.example.travelhub.ui.screens.trips

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.CheckinResult
import com.example.travelhub.domain.model.QrAvailability
import com.example.travelhub.domain.model.QrPayload
import com.example.travelhub.domain.model.QrToken
import com.example.travelhub.domain.usecase.CheckinUseCase
import com.example.travelhub.domain.usecase.GenerateReservationQrUseCase
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

@OptIn(ExperimentalCoroutinesApi::class)
class QRCheckInViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var generateQr: GenerateReservationQrUseCase
    private lateinit var checkinUseCase: CheckinUseCase
    private lateinit var vm: QRCheckInViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        generateQr = mockk()
        checkinUseCase = mockk()
        vm = QRCheckInViewModel(generateQr, checkinUseCase)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun booking(status: BookingStatus = BookingStatus.CONFIRMED) = Booking(
        id = "res-1", userId = "guest-1", propertyId = "h1",
        propertyName = "Casa Sol", propertyLocation = "Lima, Peru",
        checkIn = LocalDate.now().plusDays(1), checkOut = LocalDate.now().plusDays(5),
        totalPrice = 500.0, status = status, bookingRef = "RES1"
    )

    private fun token(availability: QrAvailability) = QrToken(
        token = "t.s",
        payload = QrPayload("res-1", "guest-1", "h1", "RES1", 0L, 100L),
        signature = "s",
        availability = availability
    )

    @Test
    fun `bind sets booking and generates a QR`() {
        val b = booking()
        every { generateQr(b) } returns token(QrAvailability.ACTIVE)

        vm.bind(b)

        assertEquals(b, vm.state.value.booking)
        assertNotNull(vm.state.value.qr)
        assertEquals(QrAvailability.ACTIVE, vm.state.value.qr!!.availability)
    }

    @Test
    fun `info dialog opens and closes`() {
        every { generateQr(any()) } returns token(QrAvailability.ACTIVE)
        vm.bind(booking())

        vm.openInfoDialog()
        assertTrue(vm.state.value.showInfoDialog)

        vm.dismissInfoDialog()
        assertFalse(vm.state.value.showInfoDialog)
    }

    @Test
    fun `completeCheckin success transitions to CONFIRMED + isCheckedIn and refreshes QR`() = runTest {
        val original = booking()
        val activeToken = token(QrAvailability.ACTIVE)
        val checkedInToken = token(QrAvailability.ALREADY_CHECKED_IN)
        every { generateQr(original) } returns activeToken
        every { generateQr(match { it.isCheckedIn }) } returns checkedInToken
        coEvery { checkinUseCase("res-1") } returns Result.success(
            CheckinResult(
                id = "ck-1", bookingId = "res-1", roomNumber = "Suite",
                checkinDate = original.checkIn
            )
        )

        vm.bind(original)
        vm.completeCheckin()
        advanceUntilIdle()

        val s = vm.state.value
        assertEquals(BookingStatus.CONFIRMED, s.booking?.status)
        assertTrue(s.booking?.isCheckedIn == true)
        assertEquals(QrAvailability.ALREADY_CHECKED_IN, s.qr?.availability)
        assertFalse(s.isCheckingIn)
        assertNull(s.checkinError)
    }

    @Test
    fun `completeCheckin failure surfaces error and keeps original booking`() = runTest {
        val original = booking()
        every { generateQr(any()) } returns token(QrAvailability.ACTIVE)
        coEvery { checkinUseCase("res-1") } returns Result.failure(RuntimeException("boom"))

        vm.bind(original)
        vm.completeCheckin()
        advanceUntilIdle()

        val s = vm.state.value
        assertEquals(BookingStatus.CONFIRMED, s.booking?.status) // unchanged
        // checkinError is now a UiText; the non-blank exception message is
        // preserved verbatim via UiText.fromExceptionOrFallback.
        val text = s.checkinError
        assertTrue(text is com.example.travelhub.ui.util.UiText.DynamicString)
        assertEquals("boom", (text as com.example.travelhub.ui.util.UiText.DynamicString).value)
        assertFalse(s.isCheckingIn)
    }

    @Test
    fun `completeCheckin is a noop when there is no booking bound yet`() = runTest {
        vm.completeCheckin()
        advanceUntilIdle()

        verify(exactly = 0) { generateQr(any()) }
    }

    @Test
    fun `completeCheckin is a noop while one is already in flight`() = runTest {
        every { generateQr(any()) } returns token(QrAvailability.ACTIVE)
        // Simulate slow API: never resolves during the test.
        coEvery { checkinUseCase(any()) } coAnswers {
            kotlinx.coroutines.delay(60_000)
            Result.success(
                CheckinResult(
                    id = "x", bookingId = "res-1", roomNumber = "Suite",
                    checkinDate = LocalDate.now()
                )
            )
        }

        vm.bind(booking())
        vm.completeCheckin()
        // Fire a second call while the first is still in flight.
        vm.completeCheckin()

        // Only one in-flight call.
        io.mockk.coVerify(exactly = 1) { checkinUseCase(any()) }
    }
}
