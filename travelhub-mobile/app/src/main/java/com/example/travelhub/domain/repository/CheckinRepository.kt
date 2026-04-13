package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.CheckinResult

interface CheckinRepository {
    suspend fun checkin(bookingId: String): Result<CheckinResult>
}
