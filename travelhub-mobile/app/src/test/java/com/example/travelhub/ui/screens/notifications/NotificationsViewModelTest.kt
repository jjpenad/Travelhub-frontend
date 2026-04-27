package com.example.travelhub.ui.screens.notifications

import com.example.travelhub.domain.model.Notification
import com.example.travelhub.domain.model.NotificationType
import com.example.travelhub.domain.usecase.GetNotificationsUseCase
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
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NotificationsViewModelTest {

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
    fun `init loads notifications from use case`() = runTest {
        val items = listOf(
            Notification("n1", "Title", "Message", NotificationType.BOOKING_CONFIRMED, "now")
        )
        val useCase = mockk<GetNotificationsUseCase>()
        coEvery { useCase() } returns items

        val vm = NotificationsViewModel(useCase)
        advanceUntilIdle()

        assertEquals(items, vm.notifications.value)
    }
}
