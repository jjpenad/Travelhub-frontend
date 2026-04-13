package com.example.travelhub.data.repository

import com.example.travelhub.data.local.UserPreferences
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AuthRepositoryImplTest {

    private lateinit var userPreferences: UserPreferences
    private lateinit var authRepository: AuthRepositoryImpl

    @Before
    fun setup() {
        userPreferences = mockk(relaxed = true)
        authRepository = AuthRepositoryImpl(userPreferences)
    }

    @Test
    fun `login with admin credentials returns success and saves session`() = runTest {
        val result = authRepository.login("admin", "admin")

        assertTrue(result.isSuccess)
        assertEquals("user_001", result.getOrNull()?.userId)
        coVerify { userPreferences.saveSession(any()) }
    }

    @Test
    fun `login with wrong credentials returns failure`() = runTest {
        val result = authRepository.login("wrong", "wrong")

        assertTrue(result.isFailure)
    }

    @Test
    fun `logout clears session`() = runTest {
        authRepository.logout()

        coVerify { userPreferences.clearSession() }
    }
}
