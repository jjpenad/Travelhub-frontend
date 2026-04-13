package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.Booking

import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse

interface BookingRepository {
    suspend fun create(booking: Booking): Result<Booking>
    suspend fun createReservation(request: CreateReservationRequest): Result<CreateReservationResponse>
    suspend fun getByUserId(userId: String): List<Booking>
    suspend fun getById(bookingId: String): Booking?
    suspend fun cancel(bookingId: String): Result<Unit>
}
