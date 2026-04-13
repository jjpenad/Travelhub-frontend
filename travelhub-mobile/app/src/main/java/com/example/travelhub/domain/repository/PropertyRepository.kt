package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters

interface PropertyRepository {
    suspend fun getAll(): List<Property>
    suspend fun getById(id: String): Property?
    suspend fun getAvailability(hotelId: String, checkIn: String, checkOut: String): Property?
    suspend fun search(filters: SearchFilters): List<Property>
    suspend fun getFeatured(): List<Property>
    suspend fun getPopular(): List<Property>
    suspend fun getTopStays(): List<Property>
}
