package com.example.travelhub.ui.screens.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Hotel
import androidx.compose.material.icons.filled.Upgrade
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.data.mock.MockNotifications
import com.example.travelhub.domain.model.Notification
import com.example.travelhub.domain.model.NotificationType
import com.example.travelhub.ui.util.label
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun NotificationsScreen(
    viewModel: NotificationsViewModel,
    onBack: () -> Unit
) {
    val notifications by viewModel.notifications.collectAsStateWithLifecycle()
    NotificationsContent(notifications = notifications, onBack = onBack)
}

@Composable
private fun NotificationsContent(
    notifications: List<Notification>,
    onBack: () -> Unit
) {
    var bookingUpdates by remember { mutableStateOf(true) }
    var checkinReminders by remember { mutableStateOf(true) }

    Column(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(16.dp)) {
            Column {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, stringResource(R.string.notifications_screen_back_cd), tint = White)
                }
                Text(text = stringResource(R.string.notifications_screen_title), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White, modifier = Modifier.padding(start = 8.dp))
            }
        }

        LazyColumn(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(notifications) { notification -> NotificationCard(notification) }
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text(stringResource(R.string.notifications_preferences_title), fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 8.dp))
                PreferenceRow(stringResource(R.string.notifications_pref_booking_updates), bookingUpdates) { bookingUpdates = it }
                PreferenceRow(stringResource(R.string.notifications_pref_checkin_reminders), checkinReminders) { checkinReminders = it }
            }
        }
    }
}

@Composable
private fun NotificationCard(notification: Notification) {
    val (iconColor, icon) = when (notification.type) {
        NotificationType.BOOKING_CONFIRMED -> GreenAccent to Icons.Filled.CheckCircle
        NotificationType.CHECKIN_REMINDER -> Purple to Icons.Filled.Hotel
        NotificationType.ROOM_UPGRADE -> OrangeAccent to Icons.Filled.Upgrade
        NotificationType.PAYMENT_SUCCESS -> GreenAccent to Icons.Filled.CreditCard
    }
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(2.dp)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
            Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)).background(iconColor.copy(alpha = 0.15f)), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = iconColor, modifier = Modifier.size(20.dp))
            }
            Column(modifier = Modifier.padding(start = 12.dp)) {
                // Title and message come from the backend / mock and pass through
                // unchanged — full backend-side localisation of those is a backend
                // concern. The timestamp IS localised here because it's a typed
                // value (NotificationTimestamp) we can resolve.
                Text(notification.title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyLarge)
                Text(notification.message, style = MaterialTheme.typography.bodySmall, color = TextSecondary, modifier = Modifier.padding(top = 2.dp))
                Text(notification.timestamp.label(), style = MaterialTheme.typography.labelSmall, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

@Composable
private fun PreferenceRow(title: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text(title, style = MaterialTheme.typography.bodyLarge)
        Switch(checked = checked, onCheckedChange = onCheckedChange, colors = SwitchDefaults.colors(checkedTrackColor = GreenAccent))
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun NotificationsScreenPreview() {
    TravelHubTheme {
        NotificationsContent(notifications = MockNotifications.getAll(), onBack = {})
    }
}
