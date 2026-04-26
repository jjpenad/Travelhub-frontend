package com.example.travelhub.ui.screens.booking

import androidx.lifecycle.SavedStateHandle
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse
import com.example.travelhub.data.remote.dto.ReservationDto
import com.example.travelhub.data.remote.dto.ReservationResultDto
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.domain.repository.BookingRepository
import com.example.travelhub.domain.repository.PropertyRepository
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

@OptIn(ExperimentalCoroutinesApi::class)
class BookingViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var propertyRepository: PropertyRepository
    private lateinit var bookingRepository: BookingRepository
    private lateinit var guestSessionStore: GuestSessionStore

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        propertyRepository = mockk()
        bookingRepository = mockk()
        guestSessionStore = mockk(relaxed = true)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun savedState() = SavedStateHandle(
        mapOf(
            "propertyId" to "p1",
            "roomId" to "r1",
            "checkIn" to "2026-05-01",
            "checkOut" to "2026-05-05"
        )
    )

    private fun propertyWithRoom(): Property = Property(
        id = "p1", name = "Casa Sol", address = "", city = "Lima", country = "Peru",
        nights = 4,
        rooms = listOf(
            Room(id = "r1", type = "Ocean", price = 100.0, totalPrice = 400.0, capacity = 2)
        )
    )

    @Test
    fun `init transitions to Summary when property and room are available`() = runTest {
        coEvery {
            propertyRepository.getAvailability("p1", "2026-05-01", "2026-05-05")
        } returns propertyWithRoom()

        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state is BookingUiState.Summary)
        state as BookingUiState.Summary
        assertEquals("Casa Sol", state.property.name)
        assertEquals("r1", state.selectedRoom.id)
        assertEquals(4, state.nights)
        assertEquals(400.0, state.totalPrice, 0.0)
    }

    @Test
    fun `init goes to Error when property is not found`() = runTest {
        coEvery {
            propertyRepository.getAvailability(any(), any(), any())
        } returns null

        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state is BookingUiState.Error)
        assertEquals("Property not found", (state as BookingUiState.Error).message)
    }

    @Test
    fun `init goes to Error when property has no rooms`() = runTest {
        val emptyProp = propertyWithRoom().copy(rooms = emptyList())
        coEvery {
            propertyRepository.getAvailability(any(), any(), any())
        } returns emptyProp

        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()

        assertTrue(vm.uiState.value is BookingUiState.Error)
    }

    @Test
    fun `confirmAndPay transitions to Confirmed on success and saves the booking locally`() = runTest {
        coEvery {
            propertyRepository.getAvailability(any(), any(), any())
        } returns propertyWithRoom()
        val response = CreateReservationResponse(
            completed = true, step = "done",
            result = ReservationResultDto(
                success = true, proceed = true, exists = false, overlap = false, fromKafka = true,
                confirmationCode = "CONF-1", reservationId = "res-1", status = "confirmed",
                message = "OK", reservation = null
            )
        )
        coEvery { bookingRepository.createReservation(any<CreateReservationRequest>()) } returns
            Result.success(response)
        coEvery { bookingRepository.create(any()) } answers { Result.success(firstArg()) }

        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()

        vm.confirmAndPay()
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state is BookingUiState.Confirmed)
        state as BookingUiState.Confirmed
        assertEquals("res-1", state.bookingId)
        assertEquals("CONF-1", state.bookingRef)
        coVerify { bookingRepository.create(any()) }
    }

    @Test
    fun `confirmAndPay falls back to nested reservation id when reservationId is missing`() = runTest {
        coEvery {
            propertyRepository.getAvailability(any(), any(), any())
        } returns propertyWithRoom()
        val response = CreateReservationResponse(
            completed = false, step = "validate",
            result = ReservationResultDto(
                success = true, proceed = false, exists = true, overlap = true, fromKafka = true,
                confirmationCode = "CONF-2", reservationId = null, status = null,
                message = "overlap",
                reservation = ReservationDto("nested-id", "pending", "2026-05-01", "2026-05-05", "400.00")
            )
        )
        coEvery { bookingRepository.createReservation(any<CreateReservationRequest>()) } returns
            Result.success(response)
        coEvery { bookingRepository.create(any()) } answers { Result.success(firstArg()) }

        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()
        vm.confirmAndPay()
        advanceUntilIdle()

        val state = vm.uiState.value as BookingUiState.Confirmed
        assertEquals("nested-id", state.bookingId)
    }

    @Test
    fun `confirmAndPay transitions to Error on repository failure`() = runTest {
        coEvery {
            propertyRepository.getAvailability(any(), any(), any())
        } returns propertyWithRoom()
        coEvery { bookingRepository.createReservation(any<CreateReservationRequest>()) } returns
            Result.failure(RuntimeException("boom"))

        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()
        vm.confirmAndPay()
        advanceUntilIdle()

        val state = vm.uiState.value
        assertTrue(state is BookingUiState.Error)
        assertEquals("boom", (state as BookingUiState.Error).message)
    }

    @Test
    fun `confirmAndPay is a no-op when state is not Summary`() = runTest {
        coEvery {
            propertyRepository.getAvailability(any(), any(), any())
        } returns null
        val vm = BookingViewModel(savedState(), propertyRepository, bookingRepository, guestSessionStore)
        advanceUntilIdle()
        // VM is in Error state by now.

        vm.confirmAndPay()
        advanceUntilIdle()

        // Still Error — confirmAndPay early-returned without touching the repo.
        assertTrue(vm.uiState.value is BookingUiState.Error)
        coVerify(exactly = 0) { bookingRepository.createReservation(any<CreateReservationRequest>()) }
    }
}
