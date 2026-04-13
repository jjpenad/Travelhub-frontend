package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.repository.PropertyRepository
import javax.inject.Inject

class GetPropertiesUseCase @Inject constructor(
    private val propertyRepository: PropertyRepository
) {
    suspend fun getFeatured(): List<Property> = propertyRepository.getFeatured()
    suspend fun getPopular(): List<Property> = propertyRepository.getPopular()
    suspend fun getTopStays(): List<Property> = propertyRepository.getTopStays()
}
