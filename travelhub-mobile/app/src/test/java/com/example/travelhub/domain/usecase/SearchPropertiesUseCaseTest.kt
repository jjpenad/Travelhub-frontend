package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.repository.PropertyRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class SearchPropertiesUseCaseTest {

    private lateinit var propertyRepository: PropertyRepository
    private lateinit var searchUseCase: SearchPropertiesUseCase

    @Before
    fun setup() {
        propertyRepository = mockk()
        searchUseCase = SearchPropertiesUseCase(propertyRepository)
    }

    @Test
    fun `search with empty filters returns all properties`() = runTest {
        val properties = listOf(
            Property("1", "Hotel A", "Addr", "City A", "Country A", pricePerNight = 100.0),
            Property("2", "Hotel B", "Addr", "City B", "Country B", pricePerNight = 200.0)
        )
        coEvery { propertyRepository.search(any()) } returns properties

        val result = searchUseCase(SearchFilters())

        assertEquals(2, result.size)
    }

    @Test
    fun `search with destination filter returns filtered properties`() = runTest {
        val filtered = listOf(
            Property("1", "Hotel A", "Addr", "Santorini", "Greece", pricePerNight = 300.0)
        )
        coEvery { propertyRepository.search(any()) } returns filtered

        val result = searchUseCase(SearchFilters(destination = "Santorini"))

        assertEquals(1, result.size)
        assertEquals("Santorini", result[0].city)
    }
}
