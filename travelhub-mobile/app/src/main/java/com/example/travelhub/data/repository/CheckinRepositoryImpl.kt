package com.example.travelhub.data.repository

import com.example.travelhub.data.mock.MockBookings
import com.example.travelhub.domain.model.CheckinResult
import com.example.travelhub.domain.repository.CheckinRepository
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CheckinRepositoryImpl @Inject constructor(
    // TODO(backend): Inject CheckinApi:
    //   private val checkinApi: CheckinApi
) : CheckinRepository {

    override suspend fun checkin(bookingId: String): Result<CheckinResult> {
        // TODO(backend): Replace with API call to validate and perform check-in:
        //   return try {
        //       val response = checkinApi.checkin(bookingId)
        //       Result.success(response.toDomain())
        //   } catch (e: HttpException) {
        //       Result.failure(Exception("Check-in failed: ${e.message()}"))
        //   }
        //
        // TODO(backend): The QR code content should come from the server (signed token),
        //   not be generated client-side from the booking ref.
        val booking = MockBookings.getById(bookingId)
            ?: return Result.failure(Exception("Booking not found"))

        val result = CheckinResult(
            id = UUID.randomUUID().toString(),
            bookingId = bookingId,
            roomNumber = booking.roomType,
            checkinDate = booking.checkIn,
            checkinTime = "3:00 PM"
        )
        return Result.success(result)
    }
}
