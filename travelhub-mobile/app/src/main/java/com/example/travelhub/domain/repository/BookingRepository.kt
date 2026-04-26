package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.PagedResult

import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse

interface BookingRepository {
    suspend fun create(booking: Booking): Result<Booking>
    suspend fun createReservation(request: CreateReservationRequest): Result<CreateReservationResponse>
    suspend fun getByUserId(userId: String): List<Booking>
    suspend fun getById(bookingId: String): Booking?
    suspend fun cancel(bookingId: String): Result<Unit>

    /**
     * Network-first listing of the current guest's reservations.
     * - On success: persists the page to local Room and wipes any stored reservation
     *   that doesn't belong to the active guest session.
     * - On failure: falls back to whatever Room has for the current session.
     * - Returns [PagedResult.empty] when there's no active guest session yet.
     */
    suspend fun getReservations(limit: Int, offset: Int): PagedResult<Booking>
}
