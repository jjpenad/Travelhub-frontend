package com.example.travelhub.ui.screens.profile

import app.cash.turbine.test
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.LocaleManager
import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.domain.repository.AuthRepository
import io.mockk.coVerify
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

    /** Test factory: builds a ProfileViewModel with sensible mock defaults so
     *  each test only overrides what it actually cares about.
     *
     *  Explicit type parameter on `mockk<T>(relaxed = true)` because Kotlin's
     *  type inference doesn't propagate from the parameter declaration through
     *  the chained `.also { it.X() }`; without the explicit `<T>`, `it` falls
     *  back to `Any` and the lambdas fail to compile. */
    private fun buildViewModel(
        store: GuestSessionStore = mockk<GuestSessionStore>(relaxed = true).also {
            every { it.currentId() } returns null
            every { it.observe() } returns flowOf(null)
        },
        authRepo: AuthRepository = mockk<AuthRepository>(relaxed = true).also {
            every { it.getSession() } returns flowOf(null)
        },
        userPreferences: UserPreferences = mockk<UserPreferences>(relaxed = true).also {
            every { it.currentAuthLocale() } returns ""
            every { it.authLocale } returns flowOf("")
        },
        localeManager: LocaleManager = mockk(relaxed = true)
    ): ProfileViewModel = ProfileViewModel(store, authRepo, userPreferences, localeManager)

    @Test
    fun `guestSessionId reflects the store value`() = runTest {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returns "preloaded"
        every { store.observe() } returns flowOf("preloaded")
        val vm = buildViewModel(store = store)

        advanceUntilIdle()
        vm.guestSessionId.test {
            assertEquals("preloaded", awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `guestSessionId emits empty string when store is null`() = runTest {
        val vm = buildViewModel()

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
        val vm = buildViewModel(store = store)

        vm.resetGuestSession()

        verify { store.reset() }
    }

    @Test
    fun `selectedLocale starts from persisted value and tracks updates`() = runTest {
        val prefs = mockk<UserPreferences>(relaxed = true).also {
            every { it.currentAuthLocale() } returns "es"
            every { it.authLocale } returns flowOf("es", "en")
        }
        val vm = buildViewModel(userPreferences = prefs)

        advanceUntilIdle()
        vm.selectedLocale.test {
            // Final emission after both upstream items are consumed.
            assertEquals("en", awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `setLocale applies synchronously and persists asynchronously`() = runTest {
        val localeManager = mockk<LocaleManager>(relaxed = true)
        val vm = buildViewModel(localeManager = localeManager)

        vm.setLocale("es")
        advanceUntilIdle()

        // apply() is sync so the screen can recreate the activity right after.
        verify { localeManager.apply("es") }
        // persist() runs in the background via viewModelScope.launch.
        coVerify { localeManager.persist("es") }
    }

    @Test
    fun `setLocale with empty string resets to system locale`() = runTest {
        val localeManager = mockk<LocaleManager>(relaxed = true)
        val vm = buildViewModel(localeManager = localeManager)

        vm.setLocale("")
        advanceUntilIdle()

        verify { localeManager.apply("") }
        coVerify { localeManager.persist("") }
    }
}
