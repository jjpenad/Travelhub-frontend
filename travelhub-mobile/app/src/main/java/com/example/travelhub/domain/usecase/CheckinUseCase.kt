package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.CheckinResult
import com.example.travelhub.domain.repository.CheckinRepository
import javax.inject.Inject

class CheckinUseCase @Inject constructor(
    private val checkinRepository: CheckinRepository
) {
    suspend operator fun invoke(bookingId: String): Result<CheckinResult> {
        return checkinRepository.checkin(bookingId)
    }
}
