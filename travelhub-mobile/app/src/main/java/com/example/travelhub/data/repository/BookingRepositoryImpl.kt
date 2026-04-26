package com.example.travelhub.data.repository

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.mapper.toBooking
import com.example.travelhub.data.mapper.toDomain
import com.example.travelhub.data.mapper.toEntity
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.ConfirmReservationRequestDto
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
    private val userPreferences: UserPreferences,
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

    override suspend fun confirmReservationPayment(
        request: ConfirmReservationRequestDto
    ): Result<CreateReservationResponse> {
        return try {
            val response = api.confirmReservationPayment(request)
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
        // The backend listing endpoint is JWT-only — anonymous users have no way to
        // list "their" reservations server-side. Use whatever local user identity we
        // have to scope the local cache.
        //
        // Authenticated user_id wins over guest session id: bookings made WHILE
        // signed in are persisted with userId = JWT user_id, so a leftover guest
        // session id from earlier anonymous searches must not become the scope
        // key — using it would make `getByUserId(guestId)` return empty (losing
        // the local-only `isCheckedIn` flag) AND `deleteByUserIdNot(guestId)`
        // would wipe the just-confirmed booking on the next refresh.
        val localScopeId = userPreferences.currentUserId()?.takeIf { it.isNotBlank() }
            ?: guestSessionStore.currentId()?.takeIf { it.isNotBlank() }

        return try {
            val response = api.listReservationsByUser(limit = limit, offset = offset)
            val hotelsById = runCatching { propertyRepository.getAll() }
                .getOrDefault(emptyList())
                .associateBy { it.id }
            // Preserve the local-only check-in flag across syncs — the backend
            // doesn't track it, so we'd lose it on every refresh otherwise.
            val authoritativeId = localScopeId ?: response.items.firstOrNull()?.userId
            val checkedInIds = if (authoritativeId != null) {
                bookingDao.getByUserId(authoritativeId)
                    .filter { it.isCheckedIn }
                    .map { it.id }
                    .toSet()
            } else emptySet()
            val bookings = response.items.map { dto ->
                dto.toBooking { id -> hotelsById[id] }
                    .copy(isCheckedIn = dto.id in checkedInIds)
            }

            // Persist the authoritative response. We scope cleanup to the authoritative
            // id (either the active local id, or the user_id the backend just confirmed).
            if (authoritativeId != null) {
                bookingDao.deleteByUserIdNot(authoritativeId)
            }
            bookingDao.insertAll(bookings.map { it.toEntity() })

            PagedResult(
                items = bookings,
                total = response.total,
                nextOffset = offset + bookings.size
            )
        } catch (e: Exception) {
            // Network / 401 / parsing failure → fall back to whatever's locally
            // persisted for the active scope id. We DO NOT delete here.
            if (localScopeId == null) return PagedResult.empty()
            val cached = bookingDao.getByUserId(localScopeId).map { it.toDomain() }
            val window = cached.drop(offset).take(limit)
            PagedResult(
                items = window,
                total = cached.size,
                nextOffset = offset + window.size
            )
        }
    }
}
