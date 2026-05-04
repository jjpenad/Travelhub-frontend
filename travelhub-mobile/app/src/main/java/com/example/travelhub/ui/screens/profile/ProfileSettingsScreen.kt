package com.example.travelhub.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Luggage
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.res.stringResource
import com.example.travelhub.R
import com.example.travelhub.notifications.NotificationsViewModel
import com.example.travelhub.notifications.PostNotificationsStatus
import com.example.travelhub.notifications.TestResult
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.travelhub.ui.components.TravelHubOutlinedButton
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.White

// TODO(backend): This screen uses hardcoded user data (name, email, settings).
//   1. Create a ProfileViewModel that reads UserSession from AuthRepository.getSession()
//   2. Load real user profile from API (profile picture URL, language, currency, region)
//   3. Make settings rows functional (navigate to edit screens or show dialogs)
//   4. "Personal Information" should navigate to an editable profile form
//   5. "My Bookings" should navigate to MyTrips
//   6. "Payment Methods" should show saved cards from the payment API
//
// TODO(ui): Replace the hardcoded "A" avatar with user's profile image using Coil:
//   AsyncImage(model = userProfile.avatarUrl, ...)

@Composable
fun ProfileSettingsScreen(
    onLogout: () -> Unit,
    profileViewModel: ProfileViewModel = hiltViewModel(),
    notificationsViewModel: NotificationsViewModel = hiltViewModel()
) {
    val guestSessionId by profileViewModel.guestSessionId.collectAsStateWithLifecycle()
    val session by profileViewModel.session.collectAsStateWithLifecycle()
    val isAuthenticated = session?.token?.isNotBlank() == true

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Purple)
                .padding(vertical = 32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Profile & Settings", color = White, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(OrangeAccent),
                    contentAlignment = Alignment.Center
                ) {
                    Text("A", color = White, fontSize = 28.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(8.dp))
                if (isAuthenticated) {
                    val name = session?.fullName?.takeIf { it.isNotBlank() } ?: "Guest"
                    Text(name, color = White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(
                        text = session?.email.orEmpty(),
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall
                    )
                } else {
                    Text("Browsing as Guest", color = White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(
                        "Sign in to track your trips across devices",
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }

        // Account section
        SectionTitle("ACCOUNT")
        SettingsRow(icon = Icons.Filled.Person, title = "Personal Information")
        SettingsRow(icon = Icons.Filled.Luggage, title = "My Bookings")
        SettingsRow(icon = Icons.Filled.CreditCard, title = "Payment Methods")

        // Language & Region
        SectionTitle("LANGUAGE & REGION")
        SettingsRow(icon = Icons.Filled.Language, title = "Language", value = "English")
        SettingsRow(icon = Icons.Filled.Language, title = "Currency", subtitle = "Prices displayed in this currency", value = "USD (\$)")
        SettingsRow(icon = Icons.Filled.Place, title = "Region", subtitle = "Affects dates, formats & local content", value = "Colombia")

        // Preferences — Notifications uses real permission state from the
        // NotificationsViewModel instead of a stale local switch.
        SectionTitle("PREFERENCES")
        NotificationsSection(notificationsViewModel)

        Spacer(modifier = Modifier.height(24.dp))

        // Logout — only when actually signed in. Anonymous users have nothing
        // to log out from; their identity is the X-Guest-Id (reset below).
        if (isAuthenticated) {
            TravelHubOutlinedButton(
                text = "Log Out",
                onClick = {
                    profileViewModel.logout()
                    onLogout()
                },
                modifier = Modifier.padding(horizontal = 20.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
        }

        // Guest session — shows the current X-Guest-Id and lets the user reset it.
        SectionTitle("GUEST SESSION")
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
            Text(
                text = "Session ID",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
            Text(
                text = guestSessionId.ifBlank { "(not yet assigned)" },
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(12.dp))
            TravelHubOutlinedButton(
                text = "Reset guest session",
                onClick = { profileViewModel.resetGuestSession() }
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

/**
 * Bloque de notificaciones: muestra el estado del permiso y los CTAs
 * "Enable" / "Send test notification" según corresponda. Lee el estado
 * del ViewModel inyectado desde Hilt en el padre.
 */
@Composable
private fun NotificationsSection(viewModel: NotificationsViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.refresh() }

    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Filled.Notifications,
                contentDescription = null,
                tint = Purple,
                modifier = Modifier.size(24.dp),
            )
            Text(
                text = stringResource(R.string.notifications_section_title),
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.padding(start = 16.dp),
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = when (state.status) {
                PostNotificationsStatus.Granted ->
                    stringResource(R.string.notifications_status_granted)
                PostNotificationsStatus.Denied ->
                    stringResource(R.string.notifications_status_denied)
                PostNotificationsStatus.NotRequested ->
                    stringResource(R.string.notifications_status_not_requested)
                PostNotificationsStatus.NotApplicable ->
                    stringResource(R.string.notifications_status_not_applicable)
            },
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )

        when (state.lastTestResult) {
            TestResult.Sent -> {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.notifications_test_sent_ok),
                    style = MaterialTheme.typography.bodySmall,
                    color = GreenAccent,
                )
            }
            TestResult.PermissionMissing -> {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = stringResource(R.string.notifications_test_sent_fail),
                    style = MaterialTheme.typography.bodySmall,
                    color = OrangeAccent,
                )
            }
            TestResult.Idle -> Unit
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (state.status == PostNotificationsStatus.NotRequested) {
            TravelHubOutlinedButton(
                text = stringResource(R.string.notifications_enable_cta),
                onClick = viewModel::requestPermission,
            )
        } else if (state.status == PostNotificationsStatus.Granted ||
            state.status == PostNotificationsStatus.NotApplicable
        ) {
            TravelHubOutlinedButton(
                text = stringResource(R.string.notifications_send_test_cta),
                onClick = viewModel::sendTestNotification,
            )
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelMedium,
        color = Purple,
        modifier = Modifier.padding(start = 20.dp, top = 20.dp, bottom = 8.dp)
    )
}

@Composable
private fun SettingsRow(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    value: String? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = Purple, modifier = Modifier.size(24.dp))
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(start = 16.dp)
        ) {
            Text(title, style = MaterialTheme.typography.bodyLarge)
            subtitle?.let {
                Text(it, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
        }
        value?.let {
            Text(it, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        }
        Icon(Icons.Filled.ChevronRight, null, tint = TextSecondary)
    }
    Divider(modifier = Modifier.padding(horizontal = 20.dp))
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun ProfileSettingsScreenPreview() {
    TravelHubTheme {
        // Preview without ViewModel — uses default empty session id.
        ProfileSettingsScreen(onLogout = {})
    }
}
