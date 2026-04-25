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
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
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
    profileViewModel: ProfileViewModel = hiltViewModel()
) {
    var notificationsEnabled by remember { mutableStateOf(true) }
    val guestSessionId by profileViewModel.guestSessionId.collectAsStateWithLifecycle()

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
                Text("Alejandra Pinzon", color = White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("alejandra@email.com", color = White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodySmall)
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

        // Preferences
        SectionTitle("PREFERENCES")
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Filled.Notifications, null, tint = Purple, modifier = Modifier.size(24.dp))
            Text(
                text = "Notifications",
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 16.dp),
                style = MaterialTheme.typography.bodyLarge
            )
            Switch(
                checked = notificationsEnabled,
                onCheckedChange = { notificationsEnabled = it },
                colors = SwitchDefaults.colors(checkedTrackColor = GreenAccent)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        TravelHubOutlinedButton(
            text = "Log Out",
            onClick = onLogout,
            modifier = Modifier.padding(horizontal = 20.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

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
