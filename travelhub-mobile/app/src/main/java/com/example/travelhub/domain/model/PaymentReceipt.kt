package com.example.travelhub.domain.model

data class PaymentReceipt(
    val id: String,
    val bookingId: String,
    val amount: Double,
    val cardLast4: String = "4242",
    val cardBrand: String = "Visa",
    val status: PaymentStatus = PaymentStatus.SUCCESS
)

enum class PaymentStatus {
    SUCCESS,
    FAILED,
    PENDING
}
