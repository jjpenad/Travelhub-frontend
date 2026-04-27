package com.example.travelhub.data.repository

import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.local.entity.BookingEntity
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.UpdateStatusRequestDto
import com.example.travelhub.data.remote.dto.UpdateStatusResponseDto
import com.example.travelhub.domain.model.BookingStatus
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class CheckinRepositoryImplTest {

    private lateinit var api: AccommodationApi
    private lateinit var bookingDao: BookingDao
    private lateinit var repo: CheckinRepositoryImpl

    @Before
    fun setup() {
        api = mockk()
        bookingDao = mockk(relaxed = true)
        repo = CheckinRepositoryImpl(api, bookingDao)
    }

    private fun entity(id: String = "bk-1") = BookingEntity(
        id = id, userId = "guest-1", propertyId = "h1",
        propertyName = "Casa Sol", propertyLocation = "Lima, Peru",
        checkIn = "2026-05-01", checkOut = "2026-05-05",
        guests = 2, rooms = 1, roomType = "Suite",
        totalPrice = 500.0, status = "CONFIRMED", bookingRef = "RES1"
    )

    @Test
    fun `checkin returns failure when booking is not found locally`() = runTest {
        coEvery { bookingDao.getById("missing") } returns null

        val result = repo.checkin("missing")

        assertTrue(result.isFailure)
        assertEquals("Booking not found", result.exceptionOrNull()?.message)
        coVerify(exactly = 0) { api.updateReservationStatus(any(), any()) }
    }

    @Test
    fun `checkin sends confirmed to backend and flips the local flag`() = runTest {
        coEvery { bookingDao.getById("bk-1") } returns entity()
        coEvery { api.updateReservationStatus("bk-1", UpdateStatusRequestDto("confirmed")) } returns
            UpdateStatusResponseDto(id = "bk-1", newStatus = "confirmed")

        val result = repo.checkin("bk-1")

        assertTrue(result.isSuccess)
        coVerify(exactly = 1) {
            api.updateReservationStatus("bk-1", UpdateStatusRequestDto("confirmed"))
        }
        coVerify(exactly = 1) { bookingDao.updateStatus("bk-1", BookingStatus.CONFIRMED.name) }
        coVerify(exactly = 1) { bookingDao.updateCheckedIn("bk-1", true) }
    }

    @Test
    fun `checkin returns failure when API throws and does not touch local DB`() = runTest {
        coEvery { bookingDao.getById("bk-1") } returns entity()
        coEvery { api.updateReservationStatus(any(), any()) } throws RuntimeException("offline")

        val result = repo.checkin("bk-1")

        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Check-in failed") == true)
        coVerify(exactly = 0) { bookingDao.updateStatus(any(), any()) }
    }
}
