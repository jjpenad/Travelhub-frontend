package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.repository.PropertyRepository
import javax.inject.Inject

class SearchPropertiesUseCase @Inject constructor(
    private val propertyRepository: PropertyRepository
) {
    suspend operator fun invoke(
        filters: SearchFilters,
        page: Int = 1,
        pageSize: Int = 20
    ): PagedResult<Property> = propertyRepository.search(filters, page, pageSize)
}
