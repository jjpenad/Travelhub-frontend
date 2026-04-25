package com.example.travelhub.ui.screens.search

import app.cash.turbine.test
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.model.SortOption
import com.example.travelhub.domain.usecase.SearchPropertiesUseCase
import io.mockk.coEvery
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

    // Unconfined dispatcher so StateFlow emissions propagate eagerly through combine +
    // stateIn without having to advance the dispatcher after every onSortChange().
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

    private fun property(id: String, price: Double, rating: Double, reviews: Int): Property =
        Property(
            id = id, name = "Hotel $id", address = "", city = "Lima", country = "Peru",
            pricePerNight = price, rating = rating, reviewCount = reviews
        )

    @Test
    fun `default state values`() {
        assertEquals("", vm.selectedCity.value)
        assertEquals(2, vm.guests.value)
        assertEquals(1, vm.rooms.value)
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
        assertEquals(LocalDate.of(2026, 5, 1), vm.checkIn.value)
        assertEquals(LocalDate.of(2026, 5, 5), vm.checkOut.value)
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
    fun `search populates results and toggles isLoading then hasSearched`() = runTest {
        val raw = listOf(
            property("a", 200.0, 4.5, 50),
            property("b", 100.0, 4.9, 10)
        )
        coEvery { useCase(any<SearchFilters>()) } returns raw

        vm.onCityChange("Lima")
        vm.search()
        advanceUntilIdle()

        // Default sort is PRICE_ASC → cheapest first.
        assertEquals(listOf("b", "a"), vm.results.value.map { it.id })
        assertFalse(vm.isLoading.value)
        assertTrue(vm.hasSearched.value)
    }

    @Test
    fun `changing sort re-orders results without calling the use case again`() = runTest {
        val raw = listOf(
            property("a", 200.0, 4.5, 50),
            property("b", 100.0, 4.9, 10),
            property("c", 300.0, 4.0, 200)
        )
        coEvery { useCase(any<SearchFilters>()) } returns raw

        vm.onCityChange("Lima")
        vm.search()
        advanceUntilIdle()

        vm.onSortChange(SortOption.RATING)
        assertEquals(listOf("b", "a", "c"), vm.results.value.map { it.id })

        vm.onSortChange(SortOption.POPULARITY)
        assertEquals(listOf("c", "a", "b"), vm.results.value.map { it.id })

        vm.onSortChange(SortOption.PRICE_DESC)
        assertEquals(listOf("c", "a", "b"), vm.results.value.map { it.id })
    }

    @Test
    fun `formatted dates use MMM dd pattern`() {
        vm.onCheckInChange(LocalDate.of(2026, 5, 1))
        vm.onCheckOutChange(LocalDate.of(2026, 5, 9))

        // The pattern uses the JVM default locale; we only check the day component
        // which is locale-stable.
        assertTrue(vm.checkInFormatted.contains("01"))
        assertTrue(vm.checkOutFormatted.contains("09"))
        // ISO API form is locale-independent and always yyyy-MM-dd.
        assertEquals("2026-05-01", vm.checkInApi)
        assertEquals("2026-05-09", vm.checkOutApi)
    }

    @Test
    fun `results StateFlow emits a new value when sort changes`() = runTest {
        // Two items — PRICE_ASC vs PRICE_DESC are guaranteed to differ.
        // Only assert sorts that produce a DIFFERENT list, otherwise StateFlow's
        // distinct-until-changed semantics would (correctly) skip the emission.
        val raw = listOf(
            property("a", 200.0, 4.0, 50),
            property("b", 100.0, 4.9, 10)
        )
        coEvery { useCase(any<SearchFilters>()) } returns raw

        vm.onCityChange("Lima")
        vm.search()
        advanceUntilIdle()

        vm.results.test {
            // First emission: current sorted list (PRICE_ASC).
            assertEquals(listOf("b", "a"), awaitItem().map { it.id })

            vm.onSortChange(SortOption.PRICE_DESC)
            assertEquals(listOf("a", "b"), awaitItem().map { it.id })

            cancelAndIgnoreRemainingEvents()
        }
    }
}
