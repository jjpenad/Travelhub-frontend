package com.example.travelhub.data.repository

import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.HotelDto
import com.example.travelhub.domain.model.SearchFilters
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

class PropertyRepositoryImplTest {

    private lateinit var api: AccommodationApi
    private lateinit var repository: PropertyRepositoryImpl

    @Before
    fun setup() {
        api = mockk()
        repository = PropertyRepositoryImpl(api)
    }

    @Test
    fun `getAll returns hotels from API`() = runTest {
        val hotels = listOf(
            HotelDto("h1", "Hotel Bogota", "Desc", "Addr", "Bogota", 4, "4.5", 100, true),
            HotelDto("h2", "Hotel Lima", "Desc", "Addr", "Lima", 5, "4.8", 200, true)
        )
        coEvery { api.listHotels() } returns hotels

        val result = repository.getAll()

        assertEquals(2, result.size)
        assertEquals("Hotel Bogota", result[0].name)
        assertEquals("Colombia", result[0].country)
        assertEquals("Peru", result[1].country)
    }

    @Test
    fun `getAll returns empty list on API error`() = runTest {
        coEvery { api.listHotels() } throws Exception("Network error")

        val result = repository.getAll()

        assertTrue(result.isEmpty())
    }

    @Test
    fun `getFeatured returns top rated hotels`() = runTest {
        val hotels = listOf(
            HotelDto("h1", "Hotel A", "Desc", "Addr", "Lima", 4, "4.0", 100, true),
            HotelDto("h2", "Hotel B", "Desc", "Addr", "Quito", 5, "4.9", 200, true)
        )
        coEvery { api.listHotels() } returns hotels

        val result = repository.getFeatured()

        assertEquals("Hotel B", result[0].name) // Higher rating first
    }
}
