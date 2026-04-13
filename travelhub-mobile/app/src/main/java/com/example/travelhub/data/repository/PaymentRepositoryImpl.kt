package com.example.travelhub.data.repository

import com.example.travelhub.domain.model.PaymentReceipt
import com.example.travelhub.domain.model.PaymentStatus
import com.example.travelhub.domain.repository.PaymentRepository
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepositoryImpl @Inject constructor(
    // TODO(backend): Inject PaymentApi:
    //   private val paymentApi: PaymentApi
) : PaymentRepository {

    override suspend fun processPayment(bookingId: String, amount: Double): Result<PaymentReceipt> {
        // TODO(backend): Replace mock with real payment gateway API call:
        //   return try {
        //       val response = paymentApi.processPayment(
        //           PaymentRequest(bookingId = bookingId, amount = amount, currency = "USD")
        //       )
        //       Result.success(response.toDomain())
        //   } catch (e: HttpException) {
        //       Result.failure(Exception("Payment failed: ${e.message()}"))
        //   } catch (e: IOException) {
        //       Result.failure(Exception("Network error. Check your connection."))
        //   }
        //
        // TODO(backend): Integrate with Stripe SDK or similar for real card tokenization.
        //   Currently the card info (Visa ••4242) is hardcoded in the UI.
        val receipt = PaymentReceipt(
            id = UUID.randomUUID().toString(),
            bookingId = bookingId,
            amount = amount,
            cardLast4 = "4242",
            cardBrand = "Visa",
            status = PaymentStatus.SUCCESS
        )
        return Result.success(receipt)
    }
}
