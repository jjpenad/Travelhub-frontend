package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.PaymentReceipt

interface PaymentRepository {
    suspend fun processPayment(bookingId: String, amount: Double): Result<PaymentReceipt>
}
