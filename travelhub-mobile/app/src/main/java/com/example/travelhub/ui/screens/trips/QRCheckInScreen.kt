package com.example.travelhub.ui.screens.trips

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.QrAvailability
import com.example.travelhub.domain.model.QrPayload
import com.example.travelhub.domain.model.QrToken
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.RedAccent
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.LocalDate

@Composable
fun QRCheckInScreen(
    viewModel: MyTripsViewModel,
    bookingId: String,
    onBack: () -> Unit,
    qrViewModel: QRCheckInViewModel = hiltViewModel()
) {
    val tripsState by viewModel.bookings.collectAsStateWithLifecycle()
    val qrState by qrViewModel.state.collectAsStateWithLifecycle()

    // Bind the booking once it arrives in the parent VM. Re-bind if it changes
    // (e.g. status flipped to CHECKED_IN after a list refresh).
    LaunchedEffect(tripsState, bookingId) {
        tripsState.find { it.id == bookingId }?.let { qrViewModel.bind(it) }
    }

    val booking = qrState.booking
    if (booking == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Purple)
        }
        return
    }

    QRCheckInContent(
        booking = booking,
        qr = qrState.qr,
        isCheckingIn = qrState.isCheckingIn,
        error = qrState.checkinError,
        showInfoDialog = qrState.showInfoDialog,
        onBack = onBack,
        onInfoClick = qrViewModel::openInfoDialog,
        onDismissInfo = qrViewModel::dismissInfoDialog,
        onCompleteCheckin = qrViewModel::completeCheckin
    )
}

@Composable
private fun QRCheckInContent(
    booking: Booking,
    qr: QrToken?,
    isCheckingIn: Boolean,
    error: String?,
    showInfoDialog: Boolean,
    onBack: () -> Unit,
    onInfoClick: () -> Unit,
    onDismissInfo: () -> Unit,
    onCompleteCheckin: () -> Unit
) {
    val qrBitmap = remember(qr?.token) { qr?.token?.let { generateQRCode(it) } }
    val availability = qr?.availability ?: QrAvailability.EXPIRED

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().background(Purple).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Back", tint = White) }
            Column(modifier = Modifier.weight(1f).padding(start = 4.dp)) {
                Text("QR Check-In", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = White)
                Text(
                    text = when (availability) {
                        QrAvailability.ACTIVE -> "Show this code at the front desk"
                        QrAvailability.ALREADY_CHECKED_IN -> "You've already checked in"
                        QrAvailability.EXPIRED -> "QR expired — your stay has ended"
                        QrAvailability.CANCELLED -> "Reservation cancelled"
                    },
                    color = White.copy(alpha = 0.8f),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            // Info icon — opens a dialog showing the decoded payload (for demo / review).
            IconButton(onClick = onInfoClick) {
                Icon(Icons.Filled.Info, "QR contents", tint = White)
            }
        }

        // QR card
        Card(
            modifier = Modifier.fillMaxWidth().padding(24.dp),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(4.dp),
            colors = CardDefaults.cardColors(containerColor = White)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "${booking.propertyName} · #${booking.bookingRef.ifBlank { "—" }}",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(16.dp))

                Box(contentAlignment = Alignment.Center) {
                    qrBitmap?.let { bmp ->
                        // Greyscale + alpha when not active so the user sees the same
                        // shape they showed before, but obviously inactive.
                        if (availability == QrAvailability.ACTIVE) {
                            Image(
                                bitmap = bmp.asImageBitmap(),
                                contentDescription = "QR Code",
                                modifier = Modifier.size(220.dp)
                            )
                        } else {
                            Image(
                                bitmap = bmp.asImageBitmap(),
                                contentDescription = "QR Code (inactive)",
                                modifier = Modifier.size(220.dp).alpha(0.35f),
                                colorFilter = ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0f) })
                            )
                        }
                    } ?: Box(
                        modifier = Modifier.size(220.dp).background(Purple.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) { Text("QR unavailable", color = Purple) }
                }

                Spacer(modifier = Modifier.height(12.dp))
                AvailabilityBadge(availability)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Valid for stay: ${booking.checkIn} → ${booking.checkOut}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
                qr?.let {
                    Text(
                        text = "Token expires ${formatInstant(Instant.ofEpochSecond(it.payload.expEpochSeconds))}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }
        }

        // Reservation details card
        Card(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = White),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("CHECK-IN TIME", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                        Text("3:00 PM", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("ROOM", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                        Text(
                            text = booking.roomType.ifBlank { "TBA" },
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Action button — only meaningful when active.
        if (availability == QrAvailability.ACTIVE) {
            if (isCheckingIn) {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Purple)
                }
            } else {
                TravelHubButton(
                    text = "Complete Check-In",
                    onClick = onCompleteCheckin,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )
            }
            error?.let {
                Text(
                    text = it,
                    color = RedAccent,
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp)
                )
            }
        }

        Text(
            text = "The QR is generated locally and signed with HMAC-SHA256. " +
                "It contains the reservation, hotel and session ids plus an expiration timestamp.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        )
    }

    if (showInfoDialog && qr != null) {
        QrInfoDialog(qr = qr, onDismiss = onDismissInfo)
    }
}

@Composable
private fun AvailabilityBadge(availability: QrAvailability) {
    val (color, label) = when (availability) {
        QrAvailability.ACTIVE -> GreenAccent to "Ready to scan"
        QrAvailability.ALREADY_CHECKED_IN -> Purple to "Checked in"
        QrAvailability.EXPIRED -> RedAccent to "Expired"
        QrAvailability.CANCELLED -> RedAccent to "Cancelled"
    }
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(label, color = color, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun QrInfoDialog(qr: QrToken, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } },
        title = { Text("QR contents") },
        text = {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .widthIn(min = 280.dp)
            ) {
                Text(
                    text = "What gets encoded into the QR (for review purposes):",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(8.dp))
                InfoRow("Reservation ID", qr.payload.reservationId)
                InfoRow("Guest session", qr.payload.userId)
                InfoRow("Hotel ID", qr.payload.hotelId)
                InfoRow("Confirmation code", qr.payload.confirmationCode)
                InfoRow("Issued at", formatInstant(Instant.ofEpochSecond(qr.payload.issuedAtEpochSeconds)))
                InfoRow("Expires at", formatInstant(Instant.ofEpochSecond(qr.payload.expEpochSeconds)))
                Spacer(modifier = Modifier.height(8.dp))
                Text("Signature (Base64URL)", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Text(
                    text = qr.signature,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text("Encoded token", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Text(
                    text = qr.token,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    )
}

@Composable
private fun InfoRow(label: String, value: String) {
    Column(modifier = Modifier.padding(vertical = 4.dp)) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontFamily = FontFamily.Monospace)
    }
}

private fun formatInstant(instant: Instant): String =
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
        .withZone(ZoneId.systemDefault())
        .format(instant)

private fun generateQRCode(content: String): Bitmap? {
    return try {
        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, 512, 512)
        val width = bitMatrix.width
        val height = bitMatrix.height
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
        for (x in 0 until width) {
            for (y in 0 until height) {
                bitmap.setPixel(
                    x, y,
                    if (bitMatrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE
                )
            }
        }
        bitmap
    } catch (e: Exception) {
        null
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun QRCheckInScreenPreview() {
    TravelHubTheme {
        val booking = Booking(
            id = "res-1", userId = "guest-1", propertyId = "h1",
            propertyName = "Casa Sol Lima", propertyLocation = "Lima, Peru",
            checkIn = LocalDate.now().plusDays(1), checkOut = LocalDate.now().plusDays(5),
            totalPrice = 500.0, status = BookingStatus.CONFIRMED, bookingRef = "RES1234"
        )
        val payload = QrPayload(
            reservationId = booking.id, userId = booking.userId, hotelId = booking.propertyId,
            confirmationCode = booking.bookingRef,
            issuedAtEpochSeconds = Instant.now().epochSecond,
            expEpochSeconds = Instant.now().plusSeconds(86_400).epochSecond
        )
        QRCheckInContent(
            booking = booking,
            qr = QrToken(
                token = "demo.token",
                payload = payload,
                signature = "demo-signature",
                availability = QrAvailability.ACTIVE
            ),
            isCheckingIn = false, error = null, showInfoDialog = false,
            onBack = {}, onInfoClick = {}, onDismissInfo = {}, onCompleteCheckin = {}
        )
    }
}
