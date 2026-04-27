package com.example.travelhub.ui.screens.property

import androidx.lifecycle.SavedStateHandle
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.repository.PropertyRepository
import io.mockk.coEvery
import io.mockk.coVerify
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
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class PropertyDetailViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var repository: PropertyRepository

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        repository = mockk()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loads property via getAvailability when dates are present`() = runTest {
        val saved = SavedStateHandle(
            mapOf(
                "propertyId" to "p1",
                "checkIn" to "2026-05-01",
                "checkOut" to "2026-05-05"
            )
        )
        val expected = Property(id = "p1", name = "Casa Sol", address = "", city = "Lima", country = "Peru")
        coEvery { repository.getAvailability("p1", "2026-05-01", "2026-05-05") } returns expected

        val vm = PropertyDetailViewModel(saved, repository)
        advanceUntilIdle()

        assertEquals(expected, vm.property.value)
        assertFalse(vm.isLoading.value)
        coVerify(exactly = 1) { repository.getAvailability("p1", "2026-05-01", "2026-05-05") }
        coVerify(exactly = 0) { repository.getById(any()) }
    }

    @Test
    fun `falls back to getById when dates are blank`() = runTest {
        val saved = SavedStateHandle(mapOf("propertyId" to "p1"))
        val expected = Property(id = "p1", name = "Hotel", address = "", city = "", country = "")
        coEvery { repository.getById("p1") } returns expected

        val vm = PropertyDetailViewModel(saved, repository)
        advanceUntilIdle()

        assertEquals(expected, vm.property.value)
        assertFalse(vm.isLoading.value)
        coVerify(exactly = 1) { repository.getById("p1") }
        coVerify(exactly = 0) { repository.getAvailability(any(), any(), any()) }
    }

    @Test
    fun `exposes savedStateHandle args verbatim`() {
        val saved = SavedStateHandle(
            mapOf("propertyId" to "P", "checkIn" to "in", "checkOut" to "out")
        )
        coEvery { repository.getById(any()) } returns null
        coEvery { repository.getAvailability(any(), any(), any()) } returns null

        val vm = PropertyDetailViewModel(saved, repository)

        assertEquals("P", vm.propertyId)
        assertEquals("in", vm.checkIn)
        assertEquals("out", vm.checkOut)
    }
}
