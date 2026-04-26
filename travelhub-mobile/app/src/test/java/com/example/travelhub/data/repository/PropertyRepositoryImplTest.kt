package com.example.travelhub.data.repository

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.dto.HotelDto
import com.example.travelhub.data.remote.dto.HotelSearchResponseDto
import com.example.travelhub.data.remote.dto.HotelSearchResultDto
import com.example.travelhub.domain.model.SearchFilters
import io.mockk.coEvery
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

class PropertyRepositoryImplTest {

    private lateinit var api: AccommodationApi
    private lateinit var guestSessionStore: GuestSessionStore
    private lateinit var repository: PropertyRepositoryImpl

    @Before
    fun setup() {
        api = mockk()
        guestSessionStore = mockk(relaxed = true)
        repository = PropertyRepositoryImpl(api, guestSessionStore)
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

        assertEquals("Hotel B", result[0].name)
    }

    @Test
    fun `search unwraps response and persists user_session`() = runTest {
        val response = HotelSearchResponseDto(
            userSession = "guest-abc",
            page = 1, pageSize = 20, total = 1,
            result = listOf(
                HotelSearchResultDto(
                    hotelId = "h1", hotelName = "Casa Sol", description = "",
                    address = "", city = "Lima", stars = 5, rating = "4.8",
                    checkInTime = null, checkOutTime = null, availableRoomTypes = emptyList()
                )
            )
        )
        coEvery {
            api.searchAccommodations("Lima", "2026-05-01", "2026-05-05", 1, 20)
        } returns response

        val paged = repository.search(
            SearchFilters(
                destination = "Lima",
                checkIn = LocalDate.of(2026, 5, 1),
                checkOut = LocalDate.of(2026, 5, 5)
            ),
            page = 1, pageSize = 20
        )

        assertEquals(1, paged.items.size)
        assertEquals(1, paged.total)
        assertEquals(1, paged.nextOffset)
        assertEquals("Casa Sol", paged.items[0].name)
        verify { guestSessionStore.update("guest-abc") }
    }

    @Test
    fun `search does not persist guest session when value is blank`() = runTest {
        val response = HotelSearchResponseDto(
            userSession = "",
            page = 1, pageSize = 20, total = 0,
            result = emptyList()
        )
        coEvery { api.searchAccommodations(any(), any(), any(), any(), any()) } returns response

        repository.search(
            SearchFilters(
                destination = "Lima",
                checkIn = LocalDate.of(2026, 5, 1),
                checkOut = LocalDate.of(2026, 5, 5)
            )
        )

        verify(exactly = 0) { guestSessionStore.update(any()) }
    }

    @Test
    fun `search falls back to getAll when filters are incomplete`() = runTest {
        coEvery { api.listHotels() } returns emptyList()

        val paged = repository.search(SearchFilters(destination = ""))

        assertTrue(paged.items.isEmpty())
        verify(exactly = 0) { guestSessionStore.update(any()) }
    }
}
