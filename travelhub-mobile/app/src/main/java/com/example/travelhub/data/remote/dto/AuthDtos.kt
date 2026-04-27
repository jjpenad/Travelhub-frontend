package com.example.travelhub.data.remote.dto

import com.google.gson.annotations.SerializedName

// POST /service-core/auth/register
data class RegisterRequestDto(
    val email: String,
    val password: String,
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("user_type") val userType: String = "traveler",
    val phone: String? = null,
    @SerializedName("country_id") val countryId: String? = null
)

data class RegisterResponseDto(
    val id: String,
    val email: String,
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("user_type") val userType: String
)

// POST /service-core/auth/login
data class LoginRequestDto(
    val email: String,
    val password: String
)

data class LoginResponseDto(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("user_type") val userType: String
)

// POST /service-core/reservation-flow/payment
data class ConfirmReservationRequestDto(
    @SerializedName("reservation_id") val reservationId: String,
    @SerializedName("primary_guest") val primaryGuest: PrimaryGuestPaymentDto,
    val payment: PaymentDetailDto
)

/**
 * Subset used by the /payment endpoint. The /create endpoint takes a slimmer
 * shape (no primary_guest, no payment), so it has its own DTO.
 */
data class PrimaryGuestPaymentDto(
    @SerializedName("first_name") val firstName: String,
    @SerializedName("last_name") val lastName: String,
    @SerializedName("document_type") val documentType: String? = null,
    @SerializedName("document_number") val documentNumber: String? = null,
    val nationality: String? = null,
    val email: String? = null
)

data class PaymentDetailDto(
    val amount: String,
    @SerializedName("currency_code") val currencyCode: String = "USD",
    @SerializedName("payment_token") val paymentToken: String
)
