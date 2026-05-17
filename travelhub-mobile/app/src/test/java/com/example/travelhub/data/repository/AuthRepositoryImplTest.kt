package com.example.travelhub.data.repository

import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.remote.api.AuthApi
import com.example.travelhub.data.remote.dto.LoginRequestDto
import com.example.travelhub.data.remote.dto.LoginResponseDto
import com.example.travelhub.data.remote.dto.RegisterRequestDto
import com.example.travelhub.data.remote.dto.RegisterResponseDto
import com.example.travelhub.notifications.FcmTokenSync
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response

class AuthRepositoryImplTest {

    private lateinit var authApi: AuthApi
    private lateinit var userPreferences: UserPreferences
    private lateinit var fcmTokenSync: FcmTokenSync
    private lateinit var repo: AuthRepositoryImpl

    @Before
    fun setup() {
        authApi = mockk()
        userPreferences = mockk(relaxed = true)
        // FcmTokenSync no devuelve nada útil al test (los métodos son
        // best-effort suspend Unit). `relaxed = true` lo deja como no-op.
        fcmTokenSync = mockk(relaxed = true)
        repo = AuthRepositoryImpl(authApi, userPreferences, fcmTokenSync)
    }

    @Test
    fun `login success returns session and persists JWT`() = runTest {
        coEvery { authApi.login(LoginRequestDto("u@x.com", "secret")) } returns
            LoginResponseDto(accessToken = "jwt.payload.sig", tokenType = "Bearer", userType = "traveler")

        val result = repo.login("u@x.com", "secret")

        assertTrue(result.isSuccess)
        assertEquals("u@x.com", result.getOrNull()?.email)
        assertEquals("jwt.payload.sig", result.getOrNull()?.token)
        coVerify { userPreferences.saveSession(any(), password = "secret") }
    }

    @Test
    fun `login 401 returns failure with friendly message`() = runTest {
        coEvery { authApi.login(any()) } throws HttpException(
            Response.error<Any>(401, "{}".toResponseBody("application/json".toMediaType()))
        )

        val result = repo.login("u@x.com", "wrong")

        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull()?.message?.contains("Invalid", ignoreCase = true) == true)
    }

    @Test
    fun `register success then auto login`() = runTest {
        coEvery {
            authApi.register(RegisterRequestDto("u@x.com", "secret", "John", "Doe", "traveler"))
        } returns RegisterResponseDto(
            id = "user-1", email = "u@x.com", firstName = "John", lastName = "Doe", userType = "traveler"
        )
        coEvery { authApi.login(LoginRequestDto("u@x.com", "secret")) } returns
            LoginResponseDto(accessToken = "jwt.payload.sig", tokenType = "Bearer", userType = "traveler")

        val result = repo.register("u@x.com", "secret", "John", "Doe")

        assertTrue(result.isSuccess)
        assertEquals("John Doe", result.getOrNull()?.fullName)
        coVerify { userPreferences.saveSession(any(), password = "secret") }
    }

    @Test
    fun `register 409 surfaces EmailAlreadyExistsException`() = runTest {
        coEvery { authApi.register(any()) } throws HttpException(
            Response.error<Any>(409, "{}".toResponseBody("application/json".toMediaType()))
        )

        val result = repo.register("taken@x.com", "secret", "A", "B")

        assertTrue(result.isFailure)
        assertTrue(result.exceptionOrNull() is EmailAlreadyExistsException)
    }

    @Test
    fun `logout clears the session`() = runTest {
        repo.logout()

        coVerify { userPreferences.clearSession() }
    }
}
