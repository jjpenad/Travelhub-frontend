package com.example.travelhub.data.repository

import android.util.Log
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.mapper.toDomain
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.repository.PropertyRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PropertyRepositoryImpl @Inject constructor(
    private val api: AccommodationApi,
    private val guestSessionStore: GuestSessionStore
) : PropertyRepository {

    // Cache hotel list to avoid repeated calls for featured/popular/topStays
    private var cachedHotels: List<Property>? = null

    override suspend fun getAll(): List<Property> {
        return try {
            val hotels = api.listHotels().map { it.toDomain() }
            cachedHotels = hotels
            hotels
        } catch (e: Exception) {
            cachedHotels ?: emptyList()
        }
    }

    override suspend fun getById(id: String): Property? {
        return try {
            val hotels = cachedHotels ?: getAll()
            hotels.find { it.id == id }
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun getAvailability(hotelId: String, checkIn: String, checkOut: String): Property? {
        return try {
            api.getHotelAvailability(hotelId, checkIn, checkOut).toDomain()
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun search(filters: SearchFilters): List<Property> {
        return try {
            val checkIn = filters.checkIn?.toString() ?: ""
            val checkOut = filters.checkOut?.toString() ?: ""
            val city = filters.destination

            if (city.isBlank() || checkIn.isBlank() || checkOut.isBlank()) {
                return getAll()
            }

            Log.d("PropertyRepo", "Searching: city=$city, checkIn=$checkIn, checkOut=$checkOut")
            val response = api.searchAccommodations(city, checkIn, checkOut)
            // Persist the latest guest session id (always overwrite — backend can rotate it).
            response.userSession?.takeIf { it.isNotBlank() }?.let { guestSessionStore.update(it) }
            val results = response.result.map { it.toDomain() }
            Log.d("PropertyRepo", "Search returned ${results.size} results")
            results
        } catch (e: Exception) {
            Log.e("PropertyRepo", "Search failed: ${e.message}", e)
            emptyList()
        }
    }

    override suspend fun getFeatured(): List<Property> {
        val hotels = cachedHotels ?: getAll()
        return hotels.sortedByDescending { it.rating }.take(4)
    }

    override suspend fun getPopular(): List<Property> {
        val hotels = cachedHotels ?: getAll()
        return hotels.sortedByDescending { it.reviewCount }.take(4)
    }

    override suspend fun getTopStays(): List<Property> {
        val hotels = cachedHotels ?: getAll()
        return hotels.sortedByDescending { it.starRating }.take(4)
    }
}
