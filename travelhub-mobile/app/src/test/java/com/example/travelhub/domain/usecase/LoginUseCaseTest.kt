package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class LoginUseCaseTest {

    private lateinit var authRepository: AuthRepository
    private lateinit var loginUseCase: LoginUseCase

    @Before
    fun setup() {
        authRepository = mockk()
        loginUseCase = LoginUseCase(authRepository)
    }

    @Test
    fun `login with valid credentials returns success`() = runTest {
        val session = UserSession("user_001", "admin@travelhub.com", "Admin", "token")
        coEvery { authRepository.login("admin", "admin") } returns Result.success(session)

        val result = loginUseCase("admin", "admin")

        assertTrue(result.isSuccess)
        assertEquals("user_001", result.getOrNull()?.userId)
    }

    @Test
    fun `login with invalid credentials returns failure`() = runTest {
        coEvery { authRepository.login("wrong", "wrong") } returns Result.failure(Exception("Invalid credentials"))

        val result = loginUseCase("wrong", "wrong")

        assertTrue(result.isFailure)
    }

    @Test
    fun `login with empty email returns failure`() = runTest {
        val result = loginUseCase("", "password")

        assertTrue(result.isFailure)
        assertEquals("Email and password are required", result.exceptionOrNull()?.message)
    }

    @Test
    fun `login with empty password returns failure`() = runTest {
        val result = loginUseCase("admin", "")

        assertTrue(result.isFailure)
        assertEquals("Email and password are required", result.exceptionOrNull()?.message)
    }
}
