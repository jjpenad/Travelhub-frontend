package com.example.travelhub.ui.screens.trips

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import java.time.LocalDate
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.data.mock.MockBookings
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.ui.components.OnResumeEffect
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.components.TravelHubOutlinedButton
import com.example.travelhub.ui.util.formatLocalized
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun TripDetailsScreen(
    viewModel: MyTripsViewModel,
    bookingId: String,
    onQRCheckIn: (String) -> Unit,
    onBack: () -> Unit
) {
    val bookings by viewModel.bookings.collectAsStateWithLifecycle()
    val booking = bookings.find { it.id == bookingId }

    // Re-pull from backend on resume so status changes (e.g. after a check-in
    // performed from the QR screen) are reflected immediately.
    OnResumeEffect { viewModel.refresh() }

    booking?.let { TripDetailsContent(it, onQRCheckIn, onBack) }
}

@Composable
private fun TripDetailsContent(
    bk: Booking,
    onQRCheckIn: (String) -> Unit,
    onBack: () -> Unit
) {
    val statusLabel = stringResource(
        when (bk.status) {
            BookingStatus.CONFIRMED -> R.string.trips_status_confirmed
            BookingStatus.PENDING -> R.string.trips_status_pending
            BookingStatus.CANCELLED -> R.string.trips_status_cancelled
            BookingStatus.COMPLETED -> R.string.trips_status_completed
        }
    )
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(16.dp)) {
            Column {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, stringResource(R.string.trip_details_back_cd), tint = White)
                }
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(start = 8.dp)) {
                    Box(modifier = Modifier.size(48.dp).clip(RoundedCornerShape(12.dp)).background(White.copy(alpha = 0.2f)), contentAlignment = Alignment.Center) {
                        Text(bk.propertyName.take(2).uppercase(), color = White, fontWeight = FontWeight.Bold)
                    }
                    Column(modifier = Modifier.padding(start = 12.dp)) {
                        Text(bk.propertyName, color = White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text(bk.propertyLocation, color = White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodySmall)
                    }
                }
                Box(modifier = Modifier.padding(start = 8.dp, top = 8.dp).clip(RoundedCornerShape(6.dp)).background(GreenAccent).padding(horizontal = 12.dp, vertical = 4.dp)) {
                    Text(text = stringResource(R.string.trip_details_status_template, statusLabel), color = White, style = MaterialTheme.typography.labelSmall)
                }
            }
        }

        Column(modifier = Modifier.padding(20.dp)) {
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(2.dp)) {
                Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(stringResource(R.string.trip_details_checkin_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                        Text(bk.checkIn.formatLocalized(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.trip_details_checkin_time_hint), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(stringResource(R.string.trip_details_checkout_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                        Text(bk.checkOut.formatLocalized(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.trip_details_checkout_time_hint), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(2.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(stringResource(R.string.trip_details_booking_ref_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                    Text(bk.bookingRef, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text(
                        text = stringResource(R.string.trip_details_summary_template, bk.guests, bk.roomType),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            // Show the QR button for any reservation that's still actionable.
            val canShowQr = bk.status != BookingStatus.CANCELLED &&
                !bk.checkOut.isBefore(LocalDate.now())
            if (canShowQr) {
                val buttonLabel = if (bk.isCheckedIn) {
                    stringResource(R.string.trip_details_qr_button_checked_in)
                } else {
                    stringResource(R.string.trip_details_qr_button_default)
                }
                TravelHubButton(text = buttonLabel, onClick = { onQRCheckIn(bk.id) })
                Spacer(modifier = Modifier.height(12.dp))
            }
            TravelHubOutlinedButton(text = stringResource(R.string.trip_details_notifications_cta), onClick = { })

            Spacer(modifier = Modifier.height(24.dp))
            Text(stringResource(R.string.trip_details_section_contact), fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
            Text(
                text = stringResource(R.string.trip_details_contact_line, bk.propertyLocation),
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                modifier = Modifier.padding(top = 4.dp)
            )
            Text(stringResource(R.string.trip_details_amenities_line), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            Text(stringResource(R.string.trip_details_free_cancellation), style = MaterialTheme.typography.bodySmall, color = GreenAccent, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun TripDetailsScreenPreview() {
    TravelHubTheme {
        TripDetailsContent(bk = MockBookings.getByUserId("user_001").first(), onQRCheckIn = {}, onBack = {})
    }
}
