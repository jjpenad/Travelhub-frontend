package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.repository.BookingRepository
import javax.inject.Inject

class GetUserReservationsUseCase @Inject constructor(
    private val repository: BookingRepository
) {
    suspend operator fun invoke(limit: Int = 20, offset: Int = 0): PagedResult<Booking> =
        repository.getReservations(limit = limit, offset = offset)
}
