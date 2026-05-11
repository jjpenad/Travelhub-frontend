package com.example.travelhub.notifications

import com.example.travelhub.data.remote.api.DeviceTokenApi
import com.example.travelhub.data.remote.dto.DeleteDeviceTokenRequest
import com.example.travelhub.data.remote.dto.DeviceTokenResponse
import com.example.travelhub.data.remote.dto.RegisterDeviceTokenRequest
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Tests del [DeviceTokenRepositoryImpl]. Mockean [DeviceTokenApi] —
 * la red no se ejerce ni se construye una real Retrofit instance.
 *
 * El contrato bajo test:
 *   - register dedupe el mismo token consecutivo (no spamea backend).
 *   - register tolera fallos de red sin propagar.
 *   - unregister limpia el cache si el token coincide con el último.
 *   - clearCache vuelve el repo a estado virgen.
 */
class DeviceTokenRepositoryImplTest {

    private lateinit var api: DeviceTokenApi
    private lateinit var repo: DeviceTokenRepositoryImpl

    @Before
    fun setup() {
        api = mockk(relaxed = true)
        repo = DeviceTokenRepositoryImpl(api)
    }

    private fun fakeResponse(): DeviceTokenResponse =
        DeviceTokenResponse(
            id = "id-1",
            user_id = "u-1",
            platform = "android",
            app_version = "0.1.1",
            last_seen_at = "2026-05-04T12:00:00",
            created_at = "2026-05-04T12:00:00",
        )

    @Test
    fun `register hits the api and returns true on success`() = runTest {
        coEvery { api.register(any()) } returns fakeResponse()

        val ok = repo.register(token = "fcm-abc", appVersion = "0.1.1")

        assertTrue(ok)
        coVerify(exactly = 1) {
            api.register(
                RegisterDeviceTokenRequest(
                    token = "fcm-abc",
                    platform = "android",
                    app_version = "0.1.1",
                ),
            )
        }
    }

    @Test
    fun `register dedupes the same token consecutively`() = runTest {
        coEvery { api.register(any()) } returns fakeResponse()

        val first = repo.register("fcm-abc")
        val second = repo.register("fcm-abc")

        assertTrue(first)
        // Dedupe: backend solo se contactó una vez.
        assertFalse(second)
        coVerify(exactly = 1) { api.register(any()) }
    }

    @Test
    fun `register hits the api again when the token changes`() = runTest {
        coEvery { api.register(any()) } returns fakeResponse()

        repo.register("fcm-abc")
        val secondRegister = repo.register("fcm-xyz")

        assertTrue(secondRegister)
        coVerify(exactly = 2) { api.register(any()) }
    }

    @Test
    fun `register returns false on api failure but does not propagate`() = runTest {
        coEvery { api.register(any()) } throws RuntimeException("boom")

        val ok = repo.register("fcm-abc")

        assertFalse(ok)
    }

    @Test
    fun `register on api failure does NOT cache the token (so retry happens next time)`() = runTest {
        // Primera llamada falla; segunda con mismo token debería intentar
        // de nuevo, no quedar atrapado en el cache.
        coEvery { api.register(any()) } throws RuntimeException("boom")

        repo.register("fcm-abc")
        repo.register("fcm-abc")

        coVerify(exactly = 2) { api.register(any()) }
    }

    @Test
    fun `register rejects blank tokens without hitting the api`() = runTest {
        val ok1 = repo.register("")
        val ok2 = repo.register("   ")

        assertFalse(ok1)
        assertFalse(ok2)
        coVerify(exactly = 0) { api.register(any()) }
    }

    @Test
    fun `unregister calls the api with the right body`() = runTest {
        val ok = repo.unregister("fcm-abc")

        assertTrue(ok)
        coVerify(exactly = 1) {
            api.unregister(DeleteDeviceTokenRequest(token = "fcm-abc"))
        }
    }

    @Test
    fun `unregister returns false on api failure but does not propagate`() = runTest {
        coEvery { api.unregister(any()) } throws RuntimeException("boom")

        val ok = repo.unregister("fcm-abc")

        assertFalse(ok)
    }

    @Test
    fun `unregister rejects blank tokens`() = runTest {
        assertFalse(repo.unregister(""))
        assertFalse(repo.unregister("   "))
        coVerify(exactly = 0) { api.unregister(any()) }
    }

    @Test
    fun `unregister clears the cache so a re-register hits the api`() = runTest {
        coEvery { api.register(any()) } returns fakeResponse()

        repo.register("fcm-abc")
        repo.unregister("fcm-abc")
        // Re-register del mismo token: ahora debe hablar con backend de nuevo.
        repo.register("fcm-abc")

        coVerify(exactly = 2) { api.register(any()) }
    }

    @Test
    fun `clearCache forces a re-register on the next call`() = runTest {
        coEvery { api.register(any()) } returns fakeResponse()

        repo.register("fcm-abc")
        repo.clearCache()
        repo.register("fcm-abc")

        coVerify(exactly = 2) { api.register(any()) }
    }
}
