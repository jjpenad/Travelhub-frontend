package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.repository.BookingRepository
import javax.inject.Inject

class CreateBookingUseCase @Inject constructor(
    private val bookingRepository: BookingRepository
) {
    suspend operator fun invoke(booking: Booking): Result<Booking> {
        return bookingRepository.create(booking)
    }
}
