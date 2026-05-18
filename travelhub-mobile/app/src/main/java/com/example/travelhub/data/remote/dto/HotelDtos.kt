package com.example.travelhub.data.remote.dto

import com.google.gson.annotations.SerializedName

/**
 * Nullability policy: cualquier campo que el backend pueda devolver `null` debe
 * declararse como `Type?` aquí. Gson asigna `null` vía reflection sin importar
 * la firma Kotlin — si dejamos no-nullable, todo deserializa "bien" pero al
 * primer acceso desde código Kotlin se lanza NPE y se cae la pantalla entera.
 *
 * Campos confirmados null-by-design por el contrato actual de service-core:
 *  - `rating` (Hotel sin reseñas)
 *  - `AmenityDto.icon` (amenities recién dados de alta sin icono asignado)
 */

// GET /service-core/accommodations/hotels
data class HotelDto(
    val id: String,
    val name: String,
    val description: String,
    val address: String,
    val city: String,
    val stars: Int,
    val rating: String?,
    @SerializedName("total_reviews") val totalReviews: Int,
    val active: Boolean
)

// GET /service-core/accommodations/search?city=&check_in=&check_out=
// Wrapper response — carries the guest user_session that must be persisted client-side.
data class HotelSearchResponseDto(
    @SerializedName("user_session") val userSession: String?,
    val page: Int = 1,
    @SerializedName("page_size") val pageSize: Int = 20,
    val total: Int = 0,
    val result: List<HotelSearchResultDto> = emptyList()
)

data class HotelSearchResultDto(
    @SerializedName("hotel_id") val hotelId: String,
    @SerializedName("hotel_name") val hotelName: String,
    val description: String,
    val address: String,
    val city: String,
    val stars: Int,
    val rating: String?,
    @SerializedName("check_in_time") val checkInTime: String?,
    @SerializedName("check_out_time") val checkOutTime: String?,
    @SerializedName("available_room_types") val availableRoomTypes: List<RoomTypeDto>
)

// GET /service-core/accommodations/hotels/{id}/availability?check_in=&check_out=
data class HotelAvailabilityDto(
    @SerializedName("hotel_id") val hotelId: String,
    @SerializedName("hotel_name") val hotelName: String,
    val description: String,
    val city: String,
    val stars: Int,
    val rating: String?,
    @SerializedName("check_in_time") val checkInTime: String?,
    @SerializedName("check_out_time") val checkOutTime: String?,
    val nights: Int,
    @SerializedName("available_room_types") val availableRoomTypes: List<RoomTypeDto>
)

data class RoomTypeDto(
    val id: String,
    val name: String,
    val description: String,
    @SerializedName("max_capacity") val maxCapacity: Int,
    @SerializedName("bed_type") val bedType: String,
    @SerializedName("size_sqm") val sizeSqm: String,
    @SerializedName("price_per_night") val pricePerNight: String,
    @SerializedName("total_price") val totalPrice: String,
    @SerializedName("currency_code") val currencyCode: String,
    @SerializedName("minimum_stay") val minimumStay: Int,
    val amenities: List<AmenityDto>
)

data class AmenityDto(
    val name: String,
    val icon: String?
)
