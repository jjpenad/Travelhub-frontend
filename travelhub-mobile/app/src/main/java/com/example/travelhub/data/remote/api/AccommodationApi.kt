package com.example.travelhub.data.remote.api

import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.CreateReservationResponse
import com.example.travelhub.data.remote.dto.HotelAvailabilityDto
import com.example.travelhub.data.remote.dto.HotelDto
import com.example.travelhub.data.remote.dto.HotelSearchResultDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface AccommodationApi {

    @GET("service-core/accommodations/hotels")
    suspend fun listHotels(): List<HotelDto>

    @GET("service-core/accommodations/search")
    suspend fun searchAccommodations(
        @Query("city") city: String,
        @Query("check_in") checkIn: String,
        @Query("check_out") checkOut: String
    ): List<HotelSearchResultDto>

    @GET("service-core/accommodations/hotels/{hotelId}/availability")
    suspend fun getHotelAvailability(
        @Path("hotelId") hotelId: String,
        @Query("check_in") checkIn: String,
        @Query("check_out") checkOut: String
    ): HotelAvailabilityDto

    @POST("service-core/reservation-flow/create")
    suspend fun createReservation(
        @Body request: CreateReservationRequest
    ): CreateReservationResponse
}
