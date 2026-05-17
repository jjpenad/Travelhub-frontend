package com.example.travelhub.ui.screens.booking

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.travelhub.R
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun BookingConfirmationScreen(
    propertyName: String,
    propertyCity: String,
    bookingRef: String,
    totalPrice: Int,
    onViewTrips: () -> Unit
) {
    ConfirmationContent(
        propertyName = propertyName,
        propertyCity = propertyCity,
        bookingRef = bookingRef,
        totalPrice = totalPrice,
        onViewTrips = onViewTrips
    )
}

@Composable
private fun ConfirmationContent(
    propertyName: String,
    propertyCity: String,
    bookingRef: String,
    totalPrice: Int,
    onViewTrips: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier.fillMaxWidth().height(280.dp).background(brush = Brush.horizontalGradient(colors = listOf(Purple, GreenAccent))),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Pure emoji — same across locales — kept as a literal.
                Text(text = "🎉", fontSize = 48.sp)
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = stringResource(R.string.booking_confirmation_title), fontSize = 26.sp, fontWeight = FontWeight.Bold, color = White)
                Text(
                    text = stringResource(R.string.booking_confirmation_subtitle, propertyName),
                    color = White.copy(alpha = 0.9f),
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 32.dp, vertical = 8.dp)
                )
                Text(
                    text = stringResource(R.string.booking_confirmation_ref_template, bookingRef),
                    color = GreenAccent,
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth().padding(24.dp), shape = RoundedCornerShape(16.dp), elevation = CardDefaults.cardElevation(4.dp), colors = CardDefaults.cardColors(containerColor = White)) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(stringResource(R.string.booking_confirmation_hotel_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Text(
                    text = stringResource(R.string.booking_confirmation_hotel_value, propertyName, propertyCity),
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(stringResource(R.string.booking_confirmation_total_paid_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Text(
                    text = stringResource(R.string.booking_confirmation_total_paid_value, totalPrice),
                    color = GreenAccent,
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleMedium
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        TravelHubButton(text = stringResource(R.string.booking_confirmation_view_trips_cta), onClick = onViewTrips, modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp))
        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun BookingConfirmationScreenPreview() {
    TravelHubTheme {
        ConfirmationContent(propertyName = "Casa Sol Lima", propertyCity = "Lima", bookingRef = "RES1E71682C", totalPrice = 880, onViewTrips = {})
    }
}
