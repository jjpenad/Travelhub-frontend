package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.remote.api.AuthApi
import com.example.travelhub.data.remote.dto.LoginRequestDto
import com.example.travelhub.data.remote.dto.LoginResponseDto
import com.example.travelhub.domain.model.UserSession
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import javax.inject.Provider

class TokenAuthenticatorTest {

    private fun fakeResponse(url: String, code: Int = 401): Response =
        Response.Builder()
            .request(Request.Builder().url(url).build())
            .protocol(Protocol.HTTP_1_1)
            .code(code).message("X")
            .body("{}".toResponseBody("application/json".toMediaType()))
            .build()

    @Test
    fun `gives up when no stored session`() {
        val prefs = mockk<UserPreferences>(relaxed = true)
        every { prefs.session } returns flowOf(null)
        coEvery { prefs.storedPassword() } returns null

        val auth = TokenAuthenticator(prefs, Provider { mockk() })

        val req = auth.authenticate(null, fakeResponse("http://x/y"))

        assertNull(req)
    }

    @Test
    fun `gives up on auth endpoints to avoid loops`() {
        val prefs = mockk<UserPreferences>(relaxed = true)
        every { prefs.session } returns flowOf(UserSession("u", "e@x.com", "", "tok"))
        coEvery { prefs.storedPassword() } returns "secret"
        val authApi = mockk<AuthApi>()

        val auth = TokenAuthenticator(prefs, Provider { authApi })

        assertNull(auth.authenticate(null, fakeResponse("http://x/service-core/auth/login")))
        assertNull(auth.authenticate(null, fakeResponse("http://x/service-core/auth/register")))
    }

    @Test
    fun `re-logs in and retries with the new bearer`() {
        val prefs = mockk<UserPreferences>(relaxed = true)
        every { prefs.session } returns flowOf(UserSession("u", "e@x.com", "John", "old-token"))
        coEvery { prefs.storedPassword() } returns "secret"
        every { prefs.currentUserId() } returns "u"
        val authApi = mockk<AuthApi>()
        coEvery { authApi.login(LoginRequestDto("e@x.com", "secret")) } returns
            LoginResponseDto(accessToken = "new-token", tokenType = "Bearer", userType = "traveler")

        val auth = TokenAuthenticator(prefs, Provider { authApi })

        val newRequest = auth.authenticate(null, fakeResponse("http://x/some/endpoint"))

        assertNotNull(newRequest)
        assertEquals("Bearer new-token", newRequest!!.header("Authorization"))
        coVerify { prefs.saveSession(match { it.token == "new-token" }, password = "secret") }
    }

    @Test
    fun `wipes session and gives up when re-login fails`() {
        val prefs = mockk<UserPreferences>(relaxed = true)
        every { prefs.session } returns flowOf(UserSession("u", "e@x.com", "", "tok"))
        coEvery { prefs.storedPassword() } returns "wrong"
        val authApi = mockk<AuthApi>()
        coEvery { authApi.login(any()) } throws RuntimeException("boom")

        val auth = TokenAuthenticator(prefs, Provider { authApi })

        val req = auth.authenticate(null, fakeResponse("http://x/some/endpoint"))

        assertNull(req)
        coVerify { prefs.clearSession() }
    }
}
