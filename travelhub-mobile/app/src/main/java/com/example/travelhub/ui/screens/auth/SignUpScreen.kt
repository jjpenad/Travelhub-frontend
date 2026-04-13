package com.example.travelhub.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.components.TravelHubTextField
import androidx.compose.ui.tooling.preview.Preview
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.RedAccent
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.White

// TODO(backend): This screen is UI-only. To make it functional:
//   1. Create a SignUpUseCase that calls authRepository.signUp(name, email, password)
//   2. Add signUp() method to AuthRepository and AuthApi
//   3. Add a SignUpViewModel (or extend AuthViewModel) with SignUpUiState
//   4. Wire the "Create Account" button to call the ViewModel
//   5. On success, auto-login and navigate to Home
//   6. Handle errors (email already exists, weak password, network error)
//
// TODO(backend): Add Google/Apple social sign-up via Firebase Auth or OAuth flow.

@Composable
fun SignUpScreen(
    onNavigateBack: () -> Unit
) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var agreedToTerms by remember { mutableStateOf(false) }

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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Purple header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Purple)
                .padding(top = 16.dp, bottom = 32.dp, start = 16.dp, end = 16.dp)
        ) {
            Column {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = White
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Create your account",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = White,
                    modifier = Modifier.padding(start = 8.dp)
                )
                Text(
                    text = "Join millions of happy travellers",
                    fontSize = 14.sp,
                    color = White.copy(alpha = 0.8f),
                    modifier = Modifier.padding(start = 8.dp, top = 4.dp)
                )
            }
        }

        // Form
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 24.dp)
        ) {
            TravelHubTextField(
                value = fullName,
                onValueChange = { fullName = it },
                label = "Full name",
                placeholder = "Your full name",
                leadingIcon = Icons.Filled.Person
            )

            Spacer(modifier = Modifier.height(16.dp))

            TravelHubTextField(
                value = email,
                onValueChange = { email = it },
                label = "Email address",
                placeholder = "you@example.com",
                leadingIcon = Icons.Filled.Email,
                keyboardType = KeyboardType.Email
            )

            Spacer(modifier = Modifier.height(16.dp))

            TravelHubTextField(
                value = password,
                onValueChange = { password = it },
                label = "Password",
                placeholder = "Create a password",
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

            Spacer(modifier = Modifier.height(16.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = agreedToTerms,
                    onCheckedChange = { agreedToTerms = it },
                    colors = CheckboxDefaults.colors(checkedColor = Purple)
                )
                Text(
                    text = "I agree to the Terms of Service & Privacy Policy",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            TravelHubButton(
                text = "Create Account",
                onClick = { /* Mock - just navigate back */ onNavigateBack() },
                enabled = fullName.isNotBlank() && email.isNotBlank() && password.isNotBlank() && agreedToTerms
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "— or sign in —",
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
        SignUpScreen(onNavigateBack = {})
    }
}
