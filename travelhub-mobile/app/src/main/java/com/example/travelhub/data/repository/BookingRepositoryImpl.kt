package com.example.travelhub.data.repository

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.mapper.toBooking
import com.example.travelhub.data.mapper.toDomain
import com.example.travelhub.data.mapper.toEntity
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.repository.BookingRepository
import com.example.travelhub.domain.repository.PropertyRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingRepositoryImpl @Inject constructor(
    private val bookingDao: BookingDao,
    private val api: AccommodationApi,
    private val guestSessionStore: GuestSessionStore,
    private val propertyRepository: PropertyRepository
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

    override suspend fun getReservations(limit: Int, offset: Int): PagedResult<Booking> {
        val sessionId = guestSessionStore.currentId()?.takeIf { it.isNotBlank() }
            ?: return PagedResult.empty()

        return try {
            val response = api.listReservationsByUser(sessionId, limit = limit, offset = offset)
            val hotelsById = runCatching { propertyRepository.getAll() }
                .getOrDefault(emptyList())
                .associateBy { it.id }
            val bookings = response.items.map { it.toBooking { id -> hotelsById[id] } }

            // Network call succeeded → safe to evict rows from previous guest sessions
            // (they're now obsolete) and persist this page. We DO NOT do this on the
            // offline path: the backend is the source of truth, and we shouldn't drop
            // local rows when we couldn't ask the backend.
            bookingDao.deleteByUserIdNot(sessionId)
            bookingDao.insertAll(bookings.map { it.toEntity() })

            PagedResult(
                items = bookings,
                total = response.total,
                nextOffset = offset + bookings.size
            )
        } catch (e: Exception) {
            // Network or parsing failure → fall back to whatever's locally persisted
            // for the active session. We DO NOT call deleteByUserIdNot here so we don't
            // wipe a perfectly good local row whose userId might have been written by an
            // earlier code path with a different guest session id.
            val cached = bookingDao.getByUserId(sessionId).map { it.toDomain() }
            val window = cached.drop(offset).take(limit)
            PagedResult(
                items = window,
                total = cached.size,
                nextOffset = offset + window.size
            )
        }
    }
}
