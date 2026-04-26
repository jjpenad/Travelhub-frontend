package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters

interface PropertyRepository {
    suspend fun getAll(): List<Property>
    suspend fun getById(id: String): Property?
    suspend fun getAvailability(hotelId: String, checkIn: String, checkOut: String): Property?

    /** Paginated search. [page] is 1-based as the backend expects. */
    suspend fun search(filters: SearchFilters, page: Int = 1, pageSize: Int = 20): PagedResult<Property>

    suspend fun getFeatured(): List<Property>
    suspend fun getPopular(): List<Property>
    suspend fun getTopStays(): List<Property>
}
