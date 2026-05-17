package com.example.travelhub.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.components.TravelHubTextField
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun LoginScreen(
    viewModel: AuthViewModel,
    onLoginSuccess: () -> Unit,
    onNavigateToSignUp: () -> Unit
) {
    val loginState by viewModel.loginState.collectAsStateWithLifecycle()
    val email by viewModel.email.collectAsStateWithLifecycle()
    val password by viewModel.password.collectAsStateWithLifecycle()

    LaunchedEffect(loginState) {
        if (loginState is LoginUiState.Success) {
            onLoginSuccess()
        }
    }

    LoginContent(
        email = email,
        password = password,
        loginState = loginState,
        onEmailChange = viewModel::onEmailChange,
        onPasswordChange = viewModel::onPasswordChange,
        onLogin = viewModel::login,
        onNavigateToSignUp = onNavigateToSignUp
    )
}

@Composable
private fun LoginContent(
    email: String,
    password: String,
    loginState: LoginUiState,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onLogin: () -> Unit,
    onNavigateToSignUp: () -> Unit
) {
    val focusManager = LocalFocusManager.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            // Shrinks the scrollable area to exclude the soft keyboard so
            // every field is reachable while the IME is open.
            .imePadding()
            // Tapping anywhere outside an interactive child clears focus
            // and dismisses the keyboard. Lets the user (and Maestro) tap
            // the header to close the IME without triggering system back.
            .pointerInput(Unit) {
                detectTapGestures(onTap = { focusManager.clearFocus() })
            }
            .verticalScroll(rememberScrollState())
    ) {
        // Purple header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Purple)
                .padding(vertical = 48.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = stringResource(R.string.app_name), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = White)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = stringResource(R.string.login_brand_tagline), fontSize = 14.sp, color = White.copy(alpha = 0.8f))
            }
        }

        // Form
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 32.dp)
        ) {
            Text(text = stringResource(R.string.login_welcome_title), style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text(text = stringResource(R.string.login_welcome_subtitle), style = MaterialTheme.typography.bodyMedium, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))

            Spacer(modifier = Modifier.height(16.dp))

            // Hint for users who booked anonymously and now want to see their trips.
            Text(
                text = stringResource(R.string.login_anonymous_hint),
                style = MaterialTheme.typography.bodySmall,
                color = Purple,
                modifier = Modifier.padding(vertical = 4.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            TravelHubTextField(
                value = email, onValueChange = onEmailChange,
                label = stringResource(R.string.login_field_email_label),
                placeholder = stringResource(R.string.login_field_email_placeholder),
                leadingIcon = Icons.Filled.Email,
                keyboardType = KeyboardType.Email, isError = loginState is LoginUiState.Error
            )

            Spacer(modifier = Modifier.height(16.dp))

            TravelHubTextField(
                value = password, onValueChange = onPasswordChange,
                label = stringResource(R.string.login_field_password_label),
                placeholder = stringResource(R.string.login_field_password_placeholder),
                leadingIcon = Icons.Filled.Lock,
                isPassword = true, isError = loginState is LoginUiState.Error,
                errorMessage = (loginState as? LoginUiState.Error)?.text?.asString()
            )

            Text(
                text = stringResource(R.string.login_forgot_password), color = Purple, style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.align(Alignment.End).padding(top = 8.dp).clickable { }
            )

            Spacer(modifier = Modifier.height(32.dp))

            if (loginState is LoginUiState.Loading) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Purple)
                }
            } else {
                TravelHubButton(text = stringResource(R.string.login_submit), onClick = onLogin)
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(text = stringResource(R.string.login_or_continue_with), color = TextSecondary, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())

            Spacer(modifier = Modifier.height(16.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedButton(onClick = { }, modifier = Modifier.weight(1f).height(48.dp), shape = RoundedCornerShape(12.dp)) {
                    Text(stringResource(R.string.login_provider_google))
                }
                OutlinedButton(onClick = { }, modifier = Modifier.weight(1f).height(48.dp), shape = RoundedCornerShape(12.dp)) {
                    Text(stringResource(R.string.login_provider_apple))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                Text(text = stringResource(R.string.login_no_account_prompt), color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
                Text(text = stringResource(R.string.login_no_account_cta), color = Purple, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, modifier = Modifier.clickable { onNavigateToSignUp() })
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun LoginScreenPreview() {
    TravelHubTheme {
        LoginContent(
            email = "", password = "", loginState = LoginUiState.Idle,
            onEmailChange = {}, onPasswordChange = {}, onLogin = {}, onNavigateToSignUp = {}
        )
    }
}
