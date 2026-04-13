package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.repository.BookingRepository
import javax.inject.Inject

class GetRecentBookingsUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    suspend operator fun invoke(userId: String): List<Booking> {
        return bookingRepository.getByUserId(userId)
    }
}
