package com.example.travelhub.data.remote.api

// TODO(backend): Uncomment and implement when API is ready.
//
// import retrofit2.http.GET
// import retrofit2.http.Path
// import retrofit2.http.Query
//
// interface PropertyApi {
//     @GET("properties")
//     suspend fun getAll(): List<PropertyDto>
//
//     @GET("properties/{id}")
//     suspend fun getById(@Path("id") id: String): PropertyDto
//
//     @GET("properties/search")
//     suspend fun search(
//         @Query("destination") destination: String?,
//         @Query("checkIn") checkIn: String?,
//         @Query("checkOut") checkOut: String?,
//         @Query("guests") guests: Int?,
//         @Query("minPrice") minPrice: Double?,
//         @Query("maxPrice") maxPrice: Double?,
//         @Query("minRating") minRating: Double?
//     ): List<PropertyDto>
//
//     @GET("properties/featured")
//     suspend fun getFeatured(): List<PropertyDto>
//
//     @GET("properties/popular")
//     suspend fun getPopular(): List<PropertyDto>
// }
//
// // TODO(backend): Define DTO matching API shape, then map to domain:
// data class PropertyDto(...)
// fun PropertyDto.toDomain(): Property = ...
