package com.example.travelhub.ui.screens.trips

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.usecase.CancelBookingUseCase
import com.example.travelhub.domain.usecase.GetRecentBookingsUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

@OptIn(ExperimentalCoroutinesApi::class)
class MyTripsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var getRecentBookings: GetRecentBookingsUseCase
    private lateinit var cancelBooking: CancelBookingUseCase

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        getRecentBookings = mockk()
        cancelBooking = mockk()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun booking(
        id: String,
        checkIn: LocalDate,
        status: BookingStatus = BookingStatus.CONFIRMED
    ) = Booking(
        id = id, userId = "user_001", propertyId = "p1",
        propertyName = "Hotel", propertyLocation = "City",
        checkIn = checkIn, checkOut = checkIn.plusDays(2),
        totalPrice = 100.0, status = status
    )

    @Test
    fun `init loads bookings for user_001`() = runTest {
        val list = listOf(booking("b1", LocalDate.now().plusDays(5)))
        coEvery { getRecentBookings("user_001") } returns list

        val vm = MyTripsViewModel(getRecentBookings, cancelBooking)
        advanceUntilIdle()

        assertEquals(list, vm.bookings.value)
    }

    @Test
    fun `upcoming filters out past and cancelled bookings`() = runTest {
        val today = LocalDate.now()
        val list = listOf(
            booking("future", today.plusDays(3)),
            booking("past", today.minusDays(3)),
            booking("cancelled-future", today.plusDays(5), BookingStatus.CANCELLED)
        )
        coEvery { getRecentBookings(any()) } returns list

        val vm = MyTripsViewModel(getRecentBookings, cancelBooking)
        advanceUntilIdle()

        assertEquals(listOf("future"), vm.upcoming.map { it.id })
    }

    @Test
    fun `past includes cancelled bookings even when their checkIn is in the future`() = runTest {
        val today = LocalDate.now()
        val list = listOf(
            booking("future", today.plusDays(3)),
            booking("past", today.minusDays(3)),
            booking("cancelled-future", today.plusDays(5), BookingStatus.CANCELLED)
        )
        coEvery { getRecentBookings(any()) } returns list

        val vm = MyTripsViewModel(getRecentBookings, cancelBooking)
        advanceUntilIdle()

        val pastIds = vm.past.map { it.id }
        assertTrue(pastIds.contains("past"))
        assertTrue(pastIds.contains("cancelled-future"))
    }

    @Test
    fun `cancelBooking invokes use case and reloads bookings`() = runTest {
        coEvery { getRecentBookings(any()) } returns emptyList()
        coEvery { cancelBooking("bk-1") } returns Result.success(Unit)
        val vm = MyTripsViewModel(getRecentBookings, cancelBooking)
        advanceUntilIdle()

        vm.cancelBooking("bk-1")
        advanceUntilIdle()

        coVerify { cancelBooking("bk-1") }
        // Two reloads: one in init, one after cancel.
        coVerify(atLeast = 2) { getRecentBookings("user_001") }
    }
}
