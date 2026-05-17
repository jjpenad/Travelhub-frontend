package com.example.travelhub.ui.screens.profile

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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import android.app.Activity
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
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

// Locale tags supported by the in-app language selector. Empty string means
// "follow the system locale" (default at first launch).
private const val LOCALE_SPANISH = "es"
private const val LOCALE_ENGLISH = "en"
private const val LOCALE_SYSTEM = ""

// TODO(backend): This screen still uses hardcoded user data (avatar, region,
//   currency). The text values now live in strings.xml so they get localised,
//   but the underlying data still needs to come from the API. See pre-existing
//   TODOs below.
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
    val selectedLocale by profileViewModel.selectedLocale.collectAsStateWithLifecycle()
    val isAuthenticated = session?.token?.isNotBlank() == true

    // We need the hosting Activity to force-recreate after a locale change.
    // ComponentActivity isn't an AppCompatActivity, so AppCompatDelegate
    // cannot auto-recreate it; without the explicit recreate the UI keeps
    // rendering the previous locale's resources until the next config change.
    val activity = LocalContext.current as? Activity

    var showLanguagePicker by remember { mutableStateOf(false) }

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
                Text(
                    text = stringResource(R.string.profile_screen_title),
                    color = White,
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(OrangeAccent),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = stringResource(R.string.profile_avatar_initial),
                        color = White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                if (isAuthenticated) {
                    val name = session?.fullName?.takeIf { it.isNotBlank() }
                        ?: stringResource(R.string.profile_guest_name)
                    Text(name, color = White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(
                        text = session?.email.orEmpty(),
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall
                    )
                } else {
                    Text(
                        text = stringResource(R.string.profile_guest_browsing_title),
                        color = White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                    Text(
                        text = stringResource(R.string.profile_guest_subtitle),
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }

        // Account section
        SectionTitle(stringResource(R.string.profile_section_account))
        SettingsRow(icon = Icons.Filled.Person, title = stringResource(R.string.profile_row_personal_information))
        SettingsRow(icon = Icons.Filled.Luggage, title = stringResource(R.string.profile_row_my_bookings))
        SettingsRow(icon = Icons.Filled.CreditCard, title = stringResource(R.string.profile_row_payment_methods))

        // Language & Region
        SectionTitle(stringResource(R.string.profile_section_language_region))
        SettingsRow(
            icon = Icons.Filled.Language,
            title = stringResource(R.string.profile_row_language),
            value = languageDisplayValue(selectedLocale),
            onClick = { showLanguagePicker = true }
        )
        SettingsRow(
            icon = Icons.Filled.Language,
            title = stringResource(R.string.profile_row_currency),
            subtitle = stringResource(R.string.profile_row_currency_subtitle),
            value = stringResource(R.string.profile_currency_value_usd)
        )
        SettingsRow(
            icon = Icons.Filled.Place,
            title = stringResource(R.string.profile_row_region),
            subtitle = stringResource(R.string.profile_row_region_subtitle),
            value = stringResource(R.string.profile_region_value_colombia)
        )

        // Preferences — Notifications uses real permission state from the
        // NotificationsViewModel instead of a stale local switch.
        SectionTitle(stringResource(R.string.profile_section_preferences))
        NotificationsSection(notificationsViewModel)

        Spacer(modifier = Modifier.height(24.dp))

        // Logout — only when actually signed in. Anonymous users have nothing
        // to log out from; their identity is the X-Guest-Id (reset below).
        if (isAuthenticated) {
            TravelHubOutlinedButton(
                text = stringResource(R.string.profile_action_logout),
                onClick = {
                    profileViewModel.logout()
                    onLogout()
                },
                modifier = Modifier.padding(horizontal = 20.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
        }

        // Guest session — shows the current X-Guest-Id and lets the user reset it.
        SectionTitle(stringResource(R.string.profile_section_guest_session))
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
            Text(
                text = stringResource(R.string.profile_guest_session_id_label),
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
            Text(
                text = guestSessionId.ifBlank { stringResource(R.string.profile_guest_session_id_empty) },
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(12.dp))
            TravelHubOutlinedButton(
                text = stringResource(R.string.profile_action_reset_guest_session),
                onClick = { profileViewModel.resetGuestSession() }
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }

    if (showLanguagePicker) {
        LanguagePickerDialog(
            currentTag = selectedLocale,
            onDismiss = { showLanguagePicker = false },
            onSelect = { tag ->
                profileViewModel.setLocale(tag)
                showLanguagePicker = false
                // setLocale applies the locale synchronously via AppCompatDelegate,
                // so by the time recreate() runs the new resources are in effect.
                activity?.recreate()
            }
        )
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
    value: String? = null,
    onClick: (() -> Unit)? = null
) {
    val rowModifier = Modifier
        .fillMaxWidth()
        .let { if (onClick != null) it.clickable(onClick = onClick) else it }
        .padding(horizontal = 20.dp, vertical = 12.dp)
    Row(
        modifier = rowModifier,
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

/**
 * Resolves the user-facing label shown next to the Language row. Reads from
 * string resources so it adapts to the currently-applied locale.
 */
@Composable
private fun languageDisplayValue(tag: String): String = when (tag) {
    LOCALE_SPANISH -> stringResource(R.string.language_value_spanish)
    LOCALE_ENGLISH -> stringResource(R.string.language_value_english)
    else -> stringResource(R.string.language_value_system)
}

/**
 * Simple radio-list dialog for picking the app language. Three options:
 * Español, English, System (default). Persisted via [ProfileViewModel.setLocale].
 */
@Composable
private fun LanguagePickerDialog(
    currentTag: String,
    onDismiss: () -> Unit,
    onSelect: (String) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.language_picker_title)) },
        text = {
            Column {
                LanguageOption(
                    label = stringResource(R.string.language_option_spanish),
                    selected = currentTag == LOCALE_SPANISH,
                    onClick = { onSelect(LOCALE_SPANISH) }
                )
                LanguageOption(
                    label = stringResource(R.string.language_option_english),
                    selected = currentTag == LOCALE_ENGLISH,
                    onClick = { onSelect(LOCALE_ENGLISH) }
                )
                LanguageOption(
                    label = stringResource(R.string.language_option_system),
                    selected = currentTag == LOCALE_SYSTEM,
                    onClick = { onSelect(LOCALE_SYSTEM) }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(stringResource(R.string.dialog_cancel))
            }
        }
    )
}

@Composable
private fun LanguageOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(selected = selected, onClick = onClick)
        Text(label, modifier = Modifier.padding(start = 8.dp))
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun ProfileSettingsScreenPreview() {
    TravelHubTheme {
        // Preview without ViewModel — uses default empty session id.
        ProfileSettingsScreen(onLogout = {})
    }
}
