package com.example.travelhub.ui.screens.home

import app.cash.turbine.test
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.repository.PropertyRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
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

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var propertyRepository: PropertyRepository

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        propertyRepository = mockk()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `init loads hotels and clears loading flag`() = runTest {
        val hotels = listOf(
            Property(id = "1", name = "Casa Sol", address = "", city = "Lima", country = "Peru")
        )
        coEvery { propertyRepository.getAll() } returns hotels

        val vm = HomeViewModel(propertyRepository)
        advanceUntilIdle()

        vm.uiState.test {
            val state = awaitItem()
            assertEquals(hotels, state.hotels)
            assertFalse(state.isLoading)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `initial state is loading and empty before getAll resolves`() = runTest {
        // Don't advance the dispatcher: the launched coroutine in init hasn't run yet.
        coEvery { propertyRepository.getAll() } returns emptyList()
        val vm = HomeViewModel(propertyRepository)

        val state = vm.uiState.value
        assertTrue(state.isLoading)
        assertTrue(state.hotels.isEmpty())
    }
}
