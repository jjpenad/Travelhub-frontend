package com.example.travelhub.data.repository

import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.UpdateStatusRequestDto
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.CheckinResult
import com.example.travelhub.domain.repository.CheckinRepository
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckinRepositoryImpl @Inject constructor(
    private val api: AccommodationApi,
    private val bookingDao: BookingDao
) : CheckinRepository {

    /**
     * Self check-in flow:
     *  1. Look up the booking locally so we know the dates/room.
     *  2. Send PATCH /reservations/{id}/status with `"confirmed"`. The backend's
     *     allowed set is `pending, confirmed, cancelled, completed` and there's
     *     no native check-in concept yet — `confirmed` is the closest semantic
     *     transition (a pending reservation becomes confirmed when the guest
     *     arrives). Idempotent if already confirmed.
     *  3. Mirror the new status AND the local `isCheckedIn` flag to Room so
     *     MyTrips and the QR screen update immediately.
     */
    override suspend fun checkin(bookingId: String): Result<CheckinResult> {
        val booking = bookingDao.getById(bookingId)
            ?: return Result.failure(Exception("Booking not found"))

        return try {
            api.updateReservationStatus(
                reservationId = bookingId,
                request = UpdateStatusRequestDto(status = BACKEND_STATUS_CONFIRMED)
            )
            bookingDao.updateStatus(bookingId, BookingStatus.CONFIRMED.name)
            bookingDao.updateCheckedIn(bookingId, true)

            Result.success(
                CheckinResult(
                    id = UUID.randomUUID().toString(),
                    bookingId = bookingId,
                    roomNumber = booking.roomType,
                    checkinDate = java.time.LocalDate.parse(booking.checkIn),
                    checkinTime = "3:00 PM"
                )
            )
        } catch (e: Exception) {
            Result.failure(Exception("Check-in failed: ${e.message}", e))
        }
    }

    companion object {
        /** What we send to PATCH /reservations/{id}/status. Backend rejects anything
         *  outside its allowed set. The local `isCheckedIn` flag carries the
         *  finer-grained "guest used self check-in" signal that the backend ignores. */
        const val BACKEND_STATUS_CONFIRMED = "confirmed"
    }
}
