package com.example.travelhub.data.repository

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.mapper.toDomain
import com.example.travelhub.data.mapper.toEntity
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.repository.BookingRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingRepositoryImpl @Inject constructor(
    private val bookingDao: BookingDao,
    private val api: AccommodationApi,
    private val guestSessionStore: GuestSessionStore
) : BookingRepository {

    override suspend fun create(booking: Booking): Result<Booking> {
        return try {
            // Avoid duplicates by checking if booking ref already exists
            if (booking.bookingRef.isNotBlank() && bookingDao.countByRef(booking.bookingRef) > 0) {
                return Result.success(booking)
            }
            bookingDao.insert(booking.toEntity())
            Result.success(booking)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createReservation(request: CreateReservationRequest): Result<CreateReservationResponse> {
        return try {
            val response = api.createReservation(request)
            // Persist the latest guest session id if the backend echoed one back.
            response.userSession?.takeIf { it.isNotBlank() }?.let { guestSessionStore.update(it) }
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getByUserId(userId: String): List<Booking> {
        return bookingDao.getByUserId(userId)
            .map { it.toDomain() }
            .distinctBy { it.bookingRef }
    }

    override suspend fun getById(bookingId: String): Booking? {
        return bookingDao.getById(bookingId)?.toDomain()
    }

    override suspend fun cancel(bookingId: String): Result<Unit> {
        return try {
            bookingDao.updateStatus(bookingId, BookingStatus.CANCELLED.name)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
