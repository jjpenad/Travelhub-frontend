package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.QrToken
import com.example.travelhub.domain.repository.QrTokenProvider
import javax.inject.Inject

class GenerateReservationQrUseCase @Inject constructor(
    private val provider: QrTokenProvider
) {
    operator fun invoke(booking: Booking): QrToken = provider.generate(booking)
}
