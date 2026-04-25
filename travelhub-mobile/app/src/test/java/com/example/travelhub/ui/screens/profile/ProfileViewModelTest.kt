package com.example.travelhub.ui.screens.profile

import app.cash.turbine.test
import com.example.travelhub.data.local.GuestSessionStore
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `guestSessionId reflects the store value`() = runTest {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returns "preloaded"
        every { store.observe() } returns flowOf("preloaded")
        val vm = ProfileViewModel(store)

        advanceUntilIdle()
        vm.guestSessionId.test {
            assertEquals("preloaded", awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `guestSessionId emits empty string when store is null`() = runTest {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returns null
        every { store.observe() } returns flowOf(null)
        val vm = ProfileViewModel(store)

        advanceUntilIdle()
        vm.guestSessionId.test {
            assertEquals("", awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `resetGuestSession delegates to the store`() = runTest {
        val store = mockk<GuestSessionStore>(relaxed = true).also {
            every { it.currentId() } returns null
            every { it.observe() } returns flowOf(null)
        }
        val vm = ProfileViewModel(store)

        vm.resetGuestSession()

        verify { store.reset() }
    }
}
