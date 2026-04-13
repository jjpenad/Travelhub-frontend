package com.example.travelhub.ui.screens.trips

import android.graphics.Bitmap
import androidx.compose.foundation.Image
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.data.mock.MockBookings
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter

@Composable
fun QRCheckInScreen(
    viewModel: MyTripsViewModel,
    bookingId: String,
    onBack: () -> Unit
) {
    val bookings by viewModel.bookings.collectAsStateWithLifecycle()
    val booking = bookings.find { it.id == bookingId }
    booking?.let { QRCheckInContent(it, onBack) }
}

@Composable
private fun QRCheckInContent(
    bk: Booking,
    onBack: () -> Unit
) {
    val qrBitmap = remember(bk.bookingRef) { generateQRCode(bk.bookingRef) }

    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(16.dp)) {
            Column {
                IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Back", tint = White) }
                Text(text = "QR Check-In", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White, modifier = Modifier.padding(start = 8.dp))
                Text(text = "Show this code at the front desk", color = White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(start = 8.dp))
            }
        }

        Card(modifier = Modifier.fillMaxWidth().padding(24.dp), shape = RoundedCornerShape(16.dp), elevation = CardDefaults.cardElevation(4.dp), colors = CardDefaults.cardColors(containerColor = White)) {
            Column(modifier = Modifier.fillMaxWidth().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "${bk.propertyName} · Booking #${bk.bookingRef}", style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
                Spacer(modifier = Modifier.height(16.dp))
                qrBitmap?.let { Image(bitmap = it.asImageBitmap(), contentDescription = "QR Code", modifier = Modifier.size(200.dp)) }
                    ?: Box(modifier = Modifier.size(200.dp).background(Purple.copy(alpha = 0.1f)), contentAlignment = Alignment.Center) { Text("QR Code", color = Purple) }
                Spacer(modifier = Modifier.height(16.dp))
                Text(text = "Valid for check-in on ${bk.checkIn}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
        }

        Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(2.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column { Text("CHECK-IN TIME", style = MaterialTheme.typography.labelSmall, color = TextSecondary); Text("3:00 PM", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
                    Column(horizontalAlignment = Alignment.End) { Text("ROOM NUMBER", style = MaterialTheme.typography.labelSmall, color = TextSecondary); Text(bk.roomType, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
                }
                Text("Tap to unlock door after check-in", color = Purple, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        TravelHubButton(text = "Complete Check-In", onClick = { }, modifier = Modifier.padding(horizontal = 24.dp))
        Text(text = "This QR code expires 24 hours after check-in", style = MaterialTheme.typography.bodySmall, color = TextSecondary, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(16.dp))
    }
}

private fun generateQRCode(content: String): Bitmap? {
    return try {
        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, 512, 512)
        val width = bitMatrix.width
        val height = bitMatrix.height
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565)
        for (x in 0 until width) {
            for (y in 0 until height) {
                bitmap.setPixel(x, y, if (bitMatrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
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
        QRCheckInContent(bk = MockBookings.getByUserId("user_001").first(), onBack = {})
    }
}
