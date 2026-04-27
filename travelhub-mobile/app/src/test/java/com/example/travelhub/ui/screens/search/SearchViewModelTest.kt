package com.example.travelhub.ui.screens.search

import com.example.travelhub.domain.model.PagedResult
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.model.SortOption
import com.example.travelhub.domain.usecase.SearchPropertiesUseCase
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

@OptIn(ExperimentalCoroutinesApi::class)
class SearchViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var useCase: SearchPropertiesUseCase
    private lateinit var vm: SearchViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        useCase = mockk()
        vm = SearchViewModel(useCase)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun property(id: String, price: Double, rating: Double = 0.0, reviews: Int = 0): Property =
        Property(
            id = id, name = "Hotel $id", address = "", city = "Lima", country = "Peru",
            pricePerNight = price, rating = rating, reviewCount = reviews
        )

    @Test
    fun `default state values`() {
        assertEquals("", vm.selectedCity.value)
        assertEquals(2, vm.guests.value)
        assertEquals(SearchViewModel.DEFAULT_SORT, vm.sortOption.value)
        assertFalse(vm.isLoading.value)
        assertFalse(vm.hasSearched.value)
    }

    @Test
    fun `setters update the corresponding flows`() {
        vm.onCityChange("Bogotá")
        vm.onCheckInChange(LocalDate.of(2026, 5, 1))
        vm.onCheckOutChange(LocalDate.of(2026, 5, 5))
        vm.onGuestsChange(4)
        vm.onRoomsChange(2)

        assertEquals("Bogotá", vm.selectedCity.value)
        assertEquals(4, vm.guests.value)
        assertEquals(2, vm.rooms.value)
    }

    @Test
    fun `guests and rooms cannot drop below 1`() {
        vm.onGuestsChange(0)
        vm.onRoomsChange(-5)

        assertEquals(1, vm.guests.value)
        assertEquals(1, vm.rooms.value)
    }

    @Test
    fun `search populates first page sorted by default PRICE_ASC`() = runTest {
        val raw = listOf(property("a", 200.0), property("b", 100.0))
        coEvery { useCase(any<SearchFilters>(), 1, 20) } returns PagedResult(raw, total = 2, nextOffset = 2)

        vm.onCityChange("Lima")
        vm.search()
        advanceUntilIdle()

        assertEquals(listOf("b", "a"), vm.results.value.map { it.id })
        assertTrue(vm.hasSearched.value)
        assertFalse(vm.isLoading.value)
    }

    @Test
    fun `loadMore appends next page and increments page counter`() = runTest {
        val first = listOf(property("a", 200.0))
        val second = listOf(property("b", 100.0))
        coEvery { useCase(any<SearchFilters>(), 1, 20) } returns PagedResult(first, total = 2, nextOffset = 1)
        coEvery { useCase(any<SearchFilters>(), 2, 20) } returns PagedResult(second, total = 2, nextOffset = 2)

        vm.onCityChange("Lima")
        vm.search()
        advanceUntilIdle()
        vm.loadMore()
        advanceUntilIdle()

        // Default sort is PRICE_ASC: b (100) before a (200).
        assertEquals(listOf("b", "a"), vm.results.value.map { it.id })
        coVerify { useCase(any<SearchFilters>(), 2, 20) }
    }

    @Test
    fun `loadMore is a noop when total is reached`() = runTest {
        val raw = listOf(property("a", 200.0))
        coEvery { useCase(any<SearchFilters>(), 1, 20) } returns PagedResult(raw, total = 1, nextOffset = 1)

        vm.search()
        advanceUntilIdle()
        vm.loadMore()
        advanceUntilIdle()

        coVerify(exactly = 1) { useCase(any<SearchFilters>(), 1, 20) }
        coVerify(exactly = 0) { useCase(any<SearchFilters>(), 2, 20) }
    }

    @Test
    fun `changing sort re-orders results without calling the use case again`() = runTest {
        val raw = listOf(
            property("a", 200.0, 4.0, 50),
            property("b", 100.0, 4.5, 200),
            property("c", 300.0, 4.9, 10)
        )
        coEvery { useCase(any<SearchFilters>(), 1, 20) } returns PagedResult(raw, total = 3, nextOffset = 3)

        vm.search()
        advanceUntilIdle()

        vm.onSortChange(SortOption.RATING)
        assertEquals(listOf("c", "b", "a"), vm.results.value.map { it.id })

        vm.onSortChange(SortOption.PRICE_DESC)
        assertEquals(listOf("c", "a", "b"), vm.results.value.map { it.id })

        // Use case was only called once for the initial search — sort changes don't refetch.
        coVerify(exactly = 1) { useCase(any<SearchFilters>(), 1, 20) }
    }

    @Test
    fun `refresh re-runs the search from page 1`() = runTest {
        coEvery { useCase(any<SearchFilters>(), 1, 20) } returns PagedResult(
            items = listOf(property("a", 100.0)),
            total = 1, nextOffset = 1
        )

        vm.search()
        advanceUntilIdle()

        vm.refresh()
        advanceUntilIdle()

        assertFalse(vm.isRefreshing.value)
        coVerify(atLeast = 2) { useCase(any<SearchFilters>(), 1, 20) }
    }
}
