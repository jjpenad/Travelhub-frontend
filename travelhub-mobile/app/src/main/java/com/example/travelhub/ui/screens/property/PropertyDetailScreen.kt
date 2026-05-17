package com.example.travelhub.ui.screens.property

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Bed
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.ui.util.amenityLabel
import com.example.travelhub.ui.util.formatIsoDateLocalized
import com.example.travelhub.ui.util.formatNumber
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun PropertyDetailScreen(
    viewModel: PropertyDetailViewModel,
    onReserveClick: (propertyId: String, roomId: String, checkIn: String, checkOut: String) -> Unit,
    onBack: () -> Unit
) {
    val property by viewModel.property.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Purple)
        }
    } else {
        property?.let {
            PropertyDetailContent(
                prop = it,
                checkIn = viewModel.checkIn,
                checkOut = viewModel.checkOut,
                onReserveClick = { roomId ->
                    onReserveClick(it.id, roomId, viewModel.checkIn, viewModel.checkOut)
                },
                onBack = onBack
            )
        }
    }
}

@Composable
private fun PropertyDetailContent(
    prop: Property,
    checkIn: String,
    checkOut: String,
    onReserveClick: (roomId: String) -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
    ) {
        // Image header
        Box(modifier = Modifier.fillMaxWidth().height(220.dp).background(Purple)) {
            Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                IconButton(onClick = onBack, modifier = Modifier.clip(CircleShape).background(White.copy(alpha = 0.3f))) {
                    Icon(Icons.Filled.ArrowBack, stringResource(R.string.property_back_cd), tint = White)
                }
                IconButton(onClick = { }, modifier = Modifier.clip(CircleShape).background(White.copy(alpha = 0.3f))) {
                    Icon(Icons.Filled.FavoriteBorder, stringResource(R.string.property_favorite_cd), tint = White)
                }
            }
            Box(modifier = Modifier.align(Alignment.Center)) {
                Text(text = prop.name.take(2).uppercase(), fontSize = 48.sp, fontWeight = FontWeight.Bold, color = White.copy(alpha = 0.5f))
            }
        }

        Column(modifier = Modifier.padding(20.dp)) {
            Text(text = prop.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text(
                text = stringResource(R.string.booking_summary_city_country, prop.city, prop.country),
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium
            )

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 8.dp)) {
                Icon(Icons.Filled.Star, null, tint = OrangeAccent, modifier = Modifier.size(18.dp))
                Text(
                    // formatNumber localises the decimal separator on the
                    // rating ("4.8" en / "4,8" es); starRating is a small
                    // integer (1-5) so leaving it as %d is fine.
                    text = stringResource(R.string.property_rating_template, formatNumber(prop.rating), prop.starRating),
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            // Amenities. `amenityLabel` maps the raw backend value (e.g. "Pool",
            // "WiFi") to a localised label; unknown amenities pass through
            // unchanged so we never hide content from the user.
            if (prop.amenities.isNotEmpty()) {
                Row(modifier = Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    prop.amenities.take(4).forEach { amenity ->
                        AmenityChip(amenityLabel(amenity))
                    }
                }
            }

            Divider(modifier = Modifier.padding(vertical = 8.dp))

            // Description (from the backend; we render as-is for now)
            Text(text = stringResource(R.string.property_section_about), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            Text(text = prop.description, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, modifier = Modifier.padding(top = 8.dp))

            // Dates — checkIn / checkOut arrive as ISO strings from the VM;
            // we parse + reformat in the user's locale so the user sees
            // "1 may 2026" (es) or "May 1, 2026" (en) instead of the raw ISO.
            if (checkIn.isNotBlank()) {
                Spacer(modifier = Modifier.height(16.dp))
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Purple.copy(alpha = 0.05f)), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = stringResource(
                                R.string.property_dates_template,
                                formatIsoDateLocalized(checkIn),
                                formatIsoDateLocalized(checkOut),
                                prop.nights
                            ),
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Available Room Types
            if (prop.rooms.isNotEmpty()) {
                Text(text = stringResource(R.string.property_section_rooms), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                prop.rooms.forEach { room ->
                    RoomTypeCard(room = room, onSelect = { onReserveClick(room.id) })
                    Spacer(modifier = Modifier.height(8.dp))
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = OrangeAccent.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = stringResource(R.string.property_no_rooms_available),
                        modifier = Modifier.padding(16.dp),
                        color = OrangeAccent,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun RoomTypeCard(room: Room, onSelect: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onSelect),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = White)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(room.type, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                Text(
                    text = stringResource(R.string.property_room_price_per_night, room.price.toInt()),
                    fontWeight = FontWeight.Bold, color = Purple, style = MaterialTheme.typography.titleMedium
                )
            }
            Text(room.description, style = MaterialTheme.typography.bodySmall, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Person, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                    Text(stringResource(R.string.property_room_capacity, room.capacity), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Bed, null, tint = TextSecondary, modifier = Modifier.size(14.dp))
                    Text(stringResource(R.string.property_room_bed_type, room.bedType), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
                if (room.sizeSqm > 0) {
                    Text(stringResource(R.string.property_room_size_sqm, room.sizeSqm.toInt()), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
            }

            if (room.amenities.isNotEmpty()) {
                // joinToString with a transform lambda is NOT inline → Compose
                // would reject the @Composable amenityLabel call inside it.
                // Resolve labels first via the inline `map`, then join the
                // already-resolved List<String> without a transform.
                val localisedAmenities = room.amenities.map { amenityLabel(it) }
                Text(
                    text = localisedAmenities.joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                    color = Purple,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                if (room.totalPrice > 0) {
                    Text(stringResource(R.string.property_room_total, room.totalPrice.toInt()), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
                Box(
                    modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(Purple).clickable(onClick = onSelect).padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(stringResource(R.string.property_room_select_cta), color = White, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun AmenityChip(text: String) {
    Card(shape = RoundedCornerShape(8.dp), colors = CardDefaults.cardColors(containerColor = Purple.copy(alpha = 0.08f))) {
        Text(text = text, style = MaterialTheme.typography.labelSmall, color = Purple, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun PropertyDetailScreenPreview() {
    TravelHubTheme {
        PropertyDetailContent(
            prop = Property(
                id = "1", name = "Casa Sol Lima", description = "Hotel de lujo frente al Oceano Pacifico.",
                city = "Lima", country = "Peru", address = "Malecon", starRating = 5, rating = 4.8,
                nights = 4, amenities = listOf("pool", "spa", "wifi"),
                rooms = listOf(
                    Room("r1", "Ocean Room", "Vista al mar", 247.50, 990.0, 2, "king", 35.0, "USD", listOf("minibar", "ocean_view")),
                    Room("r2", "Deluxe Suite", "Suite amplia", 427.50, 1710.0, 3, "king", 55.0, "USD", listOf("balcony", "bathtub"))
                )
            ),
            checkIn = "2026-05-01", checkOut = "2026-05-05",
            onReserveClick = {}, onBack = {}
        )
    }
}
