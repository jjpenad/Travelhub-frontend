package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.repository.BookingRepository
import javax.inject.Inject

class CancelBookingUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    suspend operator fun invoke(bookingId: String): Result<Unit> {
        return bookingRepository.cancel(bookingId)
    }
}
