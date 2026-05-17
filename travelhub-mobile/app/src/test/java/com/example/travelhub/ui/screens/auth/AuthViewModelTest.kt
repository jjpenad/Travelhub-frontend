package com.example.travelhub.ui.screens.auth

import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import com.example.travelhub.domain.usecase.LoginUseCase
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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var loginUseCase: LoginUseCase
    private lateinit var authRepository: AuthRepository
    private lateinit var viewModel: AuthViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        loginUseCase = mockk()
        authRepository = mockk(relaxed = true)
        viewModel = AuthViewModel(loginUseCase, authRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is Idle`() {
        assertTrue(viewModel.loginState.value is LoginUiState.Idle)
    }

    @Test
    fun `login with valid credentials transitions to Success`() = runTest {
        val session = UserSession("user_001", "admin@travelhub.com", "Admin", "token")
        coEvery { loginUseCase("admin", "admin") } returns Result.success(session)

        viewModel.onEmailChange("admin")
        viewModel.onPasswordChange("admin")
        viewModel.login()
        advanceUntilIdle()

        assertTrue(viewModel.loginState.value is LoginUiState.Success)
    }

    @Test
    fun `login with invalid credentials transitions to Error`() = runTest {
        coEvery { loginUseCase("wrong", "wrong") } returns Result.failure(Exception("Invalid credentials"))

        viewModel.onEmailChange("wrong")
        viewModel.onPasswordChange("wrong")
        viewModel.login()
        advanceUntilIdle()

        val state = viewModel.loginState.value
        assertTrue(state is LoginUiState.Error)
        // The exception's non-blank message is preserved verbatim via
        // UiText.DynamicString so server-rendered messages reach the UI as-is.
        val text = (state as LoginUiState.Error).text
        assertTrue(text is com.example.travelhub.ui.util.UiText.DynamicString)
        assertEquals("Invalid credentials", (text as com.example.travelhub.ui.util.UiText.DynamicString).value)
    }

    @Test
    fun `changing email clears error state`() = runTest {
        coEvery { loginUseCase("wrong", "wrong") } returns Result.failure(Exception("Invalid"))

        viewModel.onEmailChange("wrong")
        viewModel.onPasswordChange("wrong")
        viewModel.login()
        advanceUntilIdle()

        assertTrue(viewModel.loginState.value is LoginUiState.Error)

        viewModel.onEmailChange("admin")
        assertTrue(viewModel.loginState.value is LoginUiState.Idle)
    }
}
