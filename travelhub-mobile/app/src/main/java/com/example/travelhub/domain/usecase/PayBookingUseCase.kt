package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.PaymentReceipt
import com.example.travelhub.domain.repository.PaymentRepository
import javax.inject.Inject

class PayBookingUseCase @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    suspend operator fun invoke(bookingId: String, amount: Double): Result<PaymentReceipt> {
        return paymentRepository.processPayment(bookingId, amount)
    }
}
