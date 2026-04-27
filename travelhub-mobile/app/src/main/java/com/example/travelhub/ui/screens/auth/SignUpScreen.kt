package com.example.travelhub.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.components.TravelHubTextField
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.RedAccent
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun SignUpScreen(
    viewModel: AuthViewModel,
    onSignUpSuccess: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val email by viewModel.email.collectAsStateWithLifecycle()
    val password by viewModel.password.collectAsStateWithLifecycle()
    val firstName by viewModel.firstName.collectAsStateWithLifecycle()
    val lastName by viewModel.lastName.collectAsStateWithLifecycle()
    val state by viewModel.signUpState.collectAsStateWithLifecycle()

    LaunchedEffect(state) {
        if (state is SignUpUiState.Success) onSignUpSuccess()
    }

    SignUpContent(
        firstName = firstName,
        lastName = lastName,
        email = email,
        password = password,
        state = state,
        onFirstNameChange = viewModel::onFirstNameChange,
        onLastNameChange = viewModel::onLastNameChange,
        onEmailChange = viewModel::onEmailChange,
        onPasswordChange = viewModel::onPasswordChange,
        onSignUp = viewModel::signUp,
        onNavigateBack = onNavigateBack
    )
}

@Composable
private fun SignUpContent(
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    state: SignUpUiState,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onSignUp: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val passwordStrength = when {
        password.length >= 8 && password.any { it.isDigit() } && password.any { !it.isLetterOrDigit() } -> "Strong"
        password.length >= 6 -> "Medium"
        password.isNotEmpty() -> "Weak"
        else -> ""
    }
    val strengthColor = when (passwordStrength) {
        "Strong" -> GreenAccent
        "Medium" -> OrangeAccent
        "Weak" -> RedAccent
        else -> TextSecondary
    }
    val strengthProgress = when (passwordStrength) {
        "Strong" -> 1f
        "Medium" -> 0.66f
        "Weak" -> 0.33f
        else -> 0f
    }

    val focusManager = LocalFocusManager.current
    Column(
        // imePadding() shrinks the scrollable area to exclude the soft
        // keyboard's bounds, so the verticalScroll above can reach every
        // field even when the IME is open.
        //
        // pointerInput + detectTapGestures clears focus on any tap that
        // doesn't hit an interactive child (TextField, Button). That makes
        // tapping anywhere outside a field — e.g. the purple header — close
        // the keyboard, which both improves UX and gives Maestro flows a
        // reliable way to dismiss the IME between fields without resorting
        // to system Back (which navigates away from the screen).
        modifier = Modifier.fillMaxSize()
            .imePadding()
            .pointerInput(Unit) {
                detectTapGestures(onTap = { focusManager.clearFocus() })
            }
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Box(
            modifier = Modifier.fillMaxWidth().background(Purple)
                .padding(top = 16.dp, bottom = 32.dp, start = 16.dp, end = 16.dp)
        ) {
            Column {
                IconButton(onClick = onNavigateBack) {
                    Icon(Icons.Filled.ArrowBack, "Back", tint = White)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Create your account",
                    fontSize = 24.sp, fontWeight = FontWeight.Bold,
                    color = White, modifier = Modifier.padding(start = 8.dp)
                )
                Text(
                    text = "Already booked anonymously? Sign up with the same email and we'll link your reservations automatically.",
                    fontSize = 13.sp,
                    color = White.copy(alpha = 0.85f),
                    modifier = Modifier.padding(start = 8.dp, top = 6.dp, end = 8.dp)
                )
            }
        }

        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 24.dp)) {
            // Stacked vertically so each field gets full width and accessibility
            // tooling (talkback, Maestro) can find both labels reliably even on
            // narrow screens.
            TravelHubTextField(
                value = firstName,
                onValueChange = onFirstNameChange,
                label = "First name",
                placeholder = "John",
                leadingIcon = Icons.Filled.Person
            )

            Spacer(modifier = Modifier.height(12.dp))

            TravelHubTextField(
                value = lastName,
                onValueChange = onLastNameChange,
                label = "Last name",
                placeholder = "Doe",
                leadingIcon = Icons.Filled.Person
            )

            Spacer(modifier = Modifier.height(16.dp))

            TravelHubTextField(
                value = email,
                onValueChange = onEmailChange,
                label = "Email address",
                placeholder = "you@example.com",
                leadingIcon = Icons.Filled.Email,
                keyboardType = KeyboardType.Email
            )

            Spacer(modifier = Modifier.height(16.dp))

            TravelHubTextField(
                value = password,
                onValueChange = onPasswordChange,
                label = "Password",
                placeholder = "At least 6 characters",
                leadingIcon = Icons.Filled.Lock,
                isPassword = true
            )

            if (password.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = strengthProgress,
                    modifier = Modifier.fillMaxWidth(),
                    color = strengthColor,
                    trackColor = TextSecondary.copy(alpha = 0.2f)
                )
                Text(
                    text = "$passwordStrength — use 8+ chars, numbers & symbols",
                    style = MaterialTheme.typography.bodySmall,
                    color = strengthColor,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (state is SignUpUiState.Loading) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Purple)
                }
            } else {
                TravelHubButton(
                    text = "Create Account",
                    onClick = onSignUp,
                    enabled = firstName.isNotBlank() && lastName.isNotBlank() &&
                        email.isNotBlank() && password.length >= 6
                )
            }

            if (state is SignUpUiState.Error) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = if (state.emailAlreadyExists) {
                        "That email is already registered. Go back and sign in instead."
                    } else state.message,
                    color = RedAccent,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Have an account? Tap back to sign in.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.align(Alignment.CenterHorizontally)
            )
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun SignUpScreenPreview() {
    TravelHubTheme {
        SignUpContent(
            firstName = "", lastName = "", email = "", password = "",
            state = SignUpUiState.Idle,
            onFirstNameChange = {}, onLastNameChange = {},
            onEmailChange = {}, onPasswordChange = {},
            onSignUp = {}, onNavigateBack = {}
        )
    }
}
