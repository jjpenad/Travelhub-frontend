package com.example.travelhub.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.tooling.preview.Preview
import com.example.travelhub.R
import com.example.travelhub.data.mock.MockProperties
import com.example.travelhub.domain.model.Property
import com.example.travelhub.ui.util.formatNumber
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.White

@Composable
fun PropertyCard(
    property: Property,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // TODO(backend): Replace placeholder with real property images using Coil:
            //   AsyncImage(
            //       model = property.images.firstOrNull(),
            //       contentDescription = property.name,
            //       modifier = Modifier.size(100.dp).clip(RoundedCornerShape(12.dp)),
            //       contentScale = ContentScale.Crop,
            //       placeholder = painterResource(R.drawable.hotel_placeholder)
            //   )
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Purple.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = property.name.take(2).uppercase(),
                    color = Purple,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 12.dp)
            ) {
                Text(
                    text = property.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = Purple
                    )
                    Text(
                        text = "${property.city}, ${property.country}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(start = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.Star,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = OrangeAccent
                    )
                    Text(
                        // Ratings are decimals — formatNumber respects the
                        // locale's decimal separator ("." in en, "," in es).
                        text = stringResource(
                            R.string.property_card_rating_value,
                            formatNumber(property.rating)
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.SemiBold,
                        color = OrangeAccent
                    )
                    Text(
                        // reviewCount can exceed 999, where the grouping
                        // separator becomes visible ("1,234" vs "1.234").
                        text = stringResource(
                            R.string.property_card_reviews_template,
                            formatNumber(property.reviewCount)
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                if (property.amenities.isNotEmpty()) {
                    Text(
                        text = property.amenities.take(3).joinToString(" · "),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        // Reuse the same template that PropertyDetail's RoomTypeCard
                        // uses for "$X / noche" / "$X/night" — same visual shape, no
                        // reason to duplicate a key.
                        text = stringResource(
                            R.string.property_room_price_per_night,
                            property.pricePerNight.toInt()
                        ),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Purple
                    )
                    TravelHubSmallButton(
                        text = stringResource(R.string.property_card_book_now),
                        onClick = onClick
                    )
                }
            }
        }
    }
}

@Composable
fun TravelHubSmallButton(
    text: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Purple)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text(
            text = text,
            color = White,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
fun FeaturedDestinationCard(
    property: Property,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(170.dp)
            .height(200.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .background(Purple.copy(alpha = 0.8f))
                .padding(12.dp)
        ) {
            Column(
                modifier = Modifier.align(Alignment.BottomStart)
            ) {
                Spacer(modifier = Modifier.weight(1f))
                // Price badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(White.copy(alpha = 0.2f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "$${property.pricePerNight.toInt()}",
                        color = White,
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = property.city.split(",").first(),
                    color = White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                        tint = White.copy(alpha = 0.8f)
                    )
                    Text(
                        text = property.country,
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
fun PopularDestinationCard(
    property: Property,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(120.dp)
            .height(140.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(
            modifier = Modifier
                .background(Purple.copy(alpha = 0.6f))
                .padding(10.dp)
        ) {
            Column(modifier = Modifier.align(Alignment.BottomStart)) {
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    text = property.city.split(",").first(),
                    color = White,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        modifier = Modifier.size(10.dp),
                        tint = White.copy(alpha = 0.8f)
                    )
                    Text(
                        text = property.country,
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun PropertyCardPreview() {
    TravelHubTheme {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            PropertyCard(property = MockProperties.getById("prop_001")!!, onClick = {})
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun FeaturedDestinationCardPreview() {
    TravelHubTheme {
        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FeaturedDestinationCard(property = MockProperties.getById("prop_001")!!, onClick = {})
            PopularDestinationCard(property = MockProperties.getById("prop_005")!!, onClick = {})
        }
    }
}
