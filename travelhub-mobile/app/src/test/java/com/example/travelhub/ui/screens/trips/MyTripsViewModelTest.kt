package com.example.travelhub.ui.screens.trips

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.usecase.CancelBookingUseCase
import com.example.travelhub.domain.usecase.GetUserReservationsUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
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
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

@OptIn(ExperimentalCoroutinesApi::class)
class MyTripsViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var getUserReservations: GetUserReservationsUseCase
    private lateinit var cancelBooking: CancelBookingUseCase
    private lateinit var authRepository: com.example.travelhub.domain.repository.AuthRepository

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        getUserReservations = mockk()
        cancelBooking = mockk()
        authRepository = mockk(relaxed = true).also {
            io.mockk.every { it.getSession() } returns kotlinx.coroutines.flow.flowOf(null)
        }
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
        id = id, userId = "guest-1", propertyId = "p1",
        propertyName = "Hotel", propertyLocation = "City",
        checkIn = checkIn, checkOut = checkIn.plusDays(2),
        totalPrice = 100.0, status = status
    )

    @Test
    fun `init loads first page from use case`() = runTest {
        val items = listOf(booking("b1", LocalDate.now().plusDays(5)))
        coEvery { getUserReservations(20, 0) } returns PagedResult(items, total = 1, nextOffset = 1)

        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        assertEquals(items, vm.state.value.items)
        assertEquals(1, vm.state.value.total)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `upcoming sorts by checkIn ascending and excludes cancelled`() = runTest {
        val today = LocalDate.now()
        val items = listOf(
            booking("far", today.plusDays(10)),
            booking("near", today.plusDays(2)),
            booking("cancelled", today.plusDays(5), BookingStatus.CANCELLED)
        )
        coEvery { getUserReservations(any(), any()) } returns PagedResult(items, items.size, items.size)

        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        assertEquals(listOf("near", "far"), vm.upcoming.map { it.id })
    }

    @Test
    fun `past sorts by checkOut descending and includes cancelled`() = runTest {
        val today = LocalDate.now()
        val items = listOf(
            booking("oldest", today.minusDays(20)),
            booking("recent", today.minusDays(2)),
            booking("cancelled-future", today.plusDays(5), BookingStatus.CANCELLED)
        )
        coEvery { getUserReservations(any(), any()) } returns PagedResult(items, items.size, items.size)

        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        // recent (today-2) > oldest (today-20); cancelled-future has checkOut today+7 → first.
        assertEquals(listOf("cancelled-future", "recent", "oldest"), vm.past.map { it.id })
    }

    @Test
    fun `loadMore appends next page deduplicating by id`() = runTest {
        val first = listOf(booking("b1", LocalDate.now().plusDays(1)))
        val second = listOf(
            booking("b1", LocalDate.now().plusDays(1)), // duplicate, must be deduped
            booking("b2", LocalDate.now().plusDays(2))
        )
        coEvery { getUserReservations(20, 0) } returns PagedResult(first, total = 2, nextOffset = 1)
        coEvery { getUserReservations(20, 1) } returns PagedResult(second, total = 2, nextOffset = 3)

        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        vm.loadMore()
        advanceUntilIdle()

        assertEquals(listOf("b1", "b2"), vm.state.value.items.map { it.id })
    }

    @Test
    fun `loadMore is a noop when there are no more pages`() = runTest {
        coEvery { getUserReservations(20, 0) } returns PagedResult(
            items = listOf(booking("b1", LocalDate.now().plusDays(1))),
            total = 1, nextOffset = 1
        )
        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        vm.loadMore()
        advanceUntilIdle()

        // Only the first call happened.
        coVerify(exactly = 1) { getUserReservations(20, 0) }
        coVerify(exactly = 0) { getUserReservations(20, 1) }
    }

    @Test
    fun `refresh re-fetches first page and clears error`() = runTest {
        coEvery { getUserReservations(20, 0) } returns PagedResult(
            items = listOf(booking("b1", LocalDate.now().plusDays(1))),
            total = 1, nextOffset = 1
        )
        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        vm.refresh()
        advanceUntilIdle()

        assertFalse(vm.state.value.isRefreshing)
        assertNull(vm.state.value.error)
        coVerify(atLeast = 2) { getUserReservations(20, 0) }
    }

    @Test
    fun `cancelBooking invokes use case and refreshes`() = runTest {
        coEvery { getUserReservations(any(), any()) } returns PagedResult(emptyList(), 0, 0)
        coEvery { cancelBooking("bk-1") } returns Result.success(Unit)
        val vm = MyTripsViewModel(getUserReservations, cancelBooking, authRepository)
        advanceUntilIdle()

        vm.cancelBooking("bk-1")
        advanceUntilIdle()

        coVerify { cancelBooking("bk-1") }
        coVerify(atLeast = 2) { getUserReservations(20, 0) }
    }
}
