package com.example.travelhub.data.remote.dto

import com.google.gson.annotations.SerializedName

// POST /service-core/reservation-flow/create — Request
data class CreateReservationRequest(
    @SerializedName("hotel_id") val hotelId: String,
    @SerializedName("room_type_id") val roomTypeId: String,
    @SerializedName("check_in") val checkIn: String,
    @SerializedName("check_out") val checkOut: String,
    val guests: Int,
    @SerializedName("base_price") val basePrice: String,
    val taxes: String = "0.00",
    val discounts: String = "0.00",
    @SerializedName("total_price") val totalPrice: String,
    @SerializedName("currency_code") val currencyCode: String = "USD",
    @SerializedName("primary_guest") val primaryGuest: PrimaryGuestDto,
    val payment: PaymentRequestDto,
    @SerializedName("special_requests") val specialRequests: String = ""
)

data class PrimaryGuestDto(
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("document_type") val documentType: String = "CC",
    @SerializedName("document_number") val documentNumber: String = "0000000000",
    val nationality: String = "COL"
)

data class PaymentRequestDto(
    val amount: String,
    @SerializedName("currency_code") val currencyCode: String = "USD",
    @SerializedName("payment_token") val paymentToken: String = "tok_visa_4242424242424242"
)

// POST /service-core/reservation-flow/create — Response
// Supports both response shapes:
//   - Success: { completed: true, result: { reservation_id, confirmation_code, status, ... } }
//   - Overlap: { completed: false, result: { reservation: { id, status, ... } } }
data class CreateReservationResponse(
    val completed: Boolean,
    val step: String,
    val result: ReservationResultDto,
    @SerializedName("user_session") val userSession: String? = null
)

data class ReservationResultDto(
    val success: Boolean,
    val proceed: Boolean?,
    val exists: Boolean?,
    val overlap: Boolean?,
    @SerializedName("from_kafka") val fromKafka: Boolean?,
    @SerializedName("confirmation_code") val confirmationCode: String?,
    @SerializedName("reservation_id") val reservationId: String?,
    val status: String?,
    val message: String?,
    // Nested reservation object (used in overlap/validate responses)
    val reservation: ReservationDto?
)

data class ReservationDto(
    val id: String,
    val status: String,
    @SerializedName("check_in") val checkIn: String,
    @SerializedName("check_out") val checkOut: String,
    @SerializedName("total_price") val totalPrice: String
)
