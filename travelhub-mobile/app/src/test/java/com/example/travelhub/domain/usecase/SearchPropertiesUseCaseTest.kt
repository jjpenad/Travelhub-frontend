package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.repository.PropertyRepository
import io.mockk.coEvery
import io.mockk.coVerify
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
    fun `search delegates filters and pagination to the repository`() = runTest {
        val properties = listOf(
            Property("1", "Hotel A", "Addr", "City A", "Country A", pricePerNight = 100.0),
            Property("2", "Hotel B", "Addr", "City B", "Country B", pricePerNight = 200.0)
        )
        coEvery { propertyRepository.search(any(), any(), any()) } returns
            PagedResult(items = properties, total = 2, nextOffset = 2)

        val result = searchUseCase(SearchFilters(), page = 1, pageSize = 20)

        assertEquals(2, result.items.size)
        assertEquals(2, result.total)
        coVerify { propertyRepository.search(SearchFilters(), 1, 20) }
    }

    @Test
    fun `search forwards destination from the repository`() = runTest {
        val filtered = listOf(
            Property("1", "Hotel A", "Addr", "Santorini", "Greece", pricePerNight = 300.0)
        )
        coEvery { propertyRepository.search(any(), any(), any()) } returns
            PagedResult(items = filtered, total = 1, nextOffset = 1)

        val result = searchUseCase(SearchFilters(destination = "Santorini"))

        assertEquals("Santorini", result.items[0].city)
    }
}
