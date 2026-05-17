package com.example.travelhub.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.R
import com.example.travelhub.data.repository.EmailAlreadyExistsException
import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import com.example.travelhub.domain.usecase.LoginUseCase
import com.example.travelhub.ui.util.UiText
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface LoginUiState {
    object Idle : LoginUiState
    object Loading : LoginUiState
    data class Success(val session: UserSession) : LoginUiState
    /** [text] is resolved at render time by the screen via [UiText.asString]. */
    data class Error(val text: UiText) : LoginUiState
}

sealed interface SignUpUiState {
    object Idle : SignUpUiState
    object Loading : SignUpUiState
    data class Success(val session: UserSession) : SignUpUiState
    data class Error(val text: UiText, val emailAlreadyExists: Boolean = false) : SignUpUiState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val authRepository: AuthRepository
) : ViewModel() {

    // ── Login state ────────────────────────────────────────────────────────

    private val _loginState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val loginState: StateFlow<LoginUiState> = _loginState.asStateFlow()

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email.asStateFlow()

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password.asStateFlow()

    fun onEmailChange(value: String) {
        _email.value = value
        if (_loginState.value is LoginUiState.Error) _loginState.value = LoginUiState.Idle
        if (_signUpState.value is SignUpUiState.Error) _signUpState.value = SignUpUiState.Idle
    }

    fun onPasswordChange(value: String) {
        _password.value = value
        if (_loginState.value is LoginUiState.Error) _loginState.value = LoginUiState.Idle
        if (_signUpState.value is SignUpUiState.Error) _signUpState.value = SignUpUiState.Idle
    }

    fun login() {
        viewModelScope.launch {
            _loginState.value = LoginUiState.Loading
            val result = loginUseCase(_email.value, _password.value)
            _loginState.value = result.fold(
                onSuccess = { LoginUiState.Success(it) },
                onFailure = { LoginUiState.Error(UiText.fromExceptionOrFallback(it, R.string.error_login_failed)) }
            )
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _loginState.value = LoginUiState.Idle
            _signUpState.value = SignUpUiState.Idle
            _email.value = ""
            _password.value = ""
        }
    }

    // ── Sign up state ──────────────────────────────────────────────────────

    private val _signUpState = MutableStateFlow<SignUpUiState>(SignUpUiState.Idle)
    val signUpState: StateFlow<SignUpUiState> = _signUpState.asStateFlow()

    private val _firstName = MutableStateFlow("")
    val firstName: StateFlow<String> = _firstName.asStateFlow()

    private val _lastName = MutableStateFlow("")
    val lastName: StateFlow<String> = _lastName.asStateFlow()

    fun onFirstNameChange(value: String) { _firstName.value = value }
    fun onLastNameChange(value: String) { _lastName.value = value }

    /**
     * Register the user against the backend. On success the response includes the JWT
     * (auto-login is performed inside the repository) — backend `_link_guest_reservations`
     * automatically migrates any anonymous reservation tied to this email to the new
     * user_id, so the next visit to MyTrips already shows them.
     */
    fun signUp() {
        if (_email.value.isBlank() || _password.value.length < 6 ||
            _firstName.value.isBlank() || _lastName.value.isBlank()
        ) {
            _signUpState.value = SignUpUiState.Error(
                UiText.of(R.string.error_signup_validation_required)
            )
            return
        }
        viewModelScope.launch {
            _signUpState.value = SignUpUiState.Loading
            val result = authRepository.register(
                email = _email.value,
                password = _password.value,
                firstName = _firstName.value,
                lastName = _lastName.value
            )
            _signUpState.value = result.fold(
                onSuccess = { SignUpUiState.Success(it) },
                onFailure = { e ->
                    SignUpUiState.Error(
                        text = UiText.fromExceptionOrFallback(e, R.string.error_signup_failed),
                        emailAlreadyExists = e is EmailAlreadyExistsException
                    )
                }
            )
        }
    }
}
