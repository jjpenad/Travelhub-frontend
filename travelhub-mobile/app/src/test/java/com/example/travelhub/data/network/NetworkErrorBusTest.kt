package com.example.travelhub.data.network

import app.cash.turbine.test
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NetworkErrorBusTest {

    @Test
    fun `emit forwards a non-blank message to subscribers`() = runTest {
        val bus = NetworkErrorBus()

        bus.events.test {
            bus.emit("Boom")
            assertEquals("Boom", awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `emit ignores blank messages`() = runTest {
        val bus = NetworkErrorBus()

        bus.events.test {
            bus.emit("")
            bus.emit("   ")
            bus.emit("Real")
            assertEquals("Real", awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }
}
