package com.example.travelhub.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.domain.model.Property
import com.example.travelhub.ui.components.PropertyCard
import com.example.travelhub.ui.screens.search.SearchViewModel
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.PurpleDark
import com.example.travelhub.ui.theme.PurpleLight
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onSearchClick: () -> Unit,
    onCityClick: (String) -> Unit,
    onPropertyClick: (String) -> Unit,
    onNotificationsClick: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    HomeContent(
        hotels = uiState.hotels,
        onSearchClick = onSearchClick,
        onCityClick = onCityClick,
        onPropertyClick = onPropertyClick,
        onNotificationsClick = onNotificationsClick
    )
}

@Composable
private fun HomeContent(
    hotels: List<Property>,
    onSearchClick: () -> Unit,
    onCityClick: (String) -> Unit,
    onPropertyClick: (String) -> Unit,
    onNotificationsClick: () -> Unit
) {
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
                .padding(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 24.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Good morning", style = MaterialTheme.typography.bodyMedium, color = White.copy(alpha = 0.8f))
                    IconButton(onClick = onNotificationsClick) {
                        Icon(imageVector = Icons.Filled.Notifications, contentDescription = "Notifications", tint = White)
                    }
                }
                Text(text = "Where to next?", style = MaterialTheme.typography.headlineMedium, color = White, fontWeight = FontWeight.Bold)
                Text(text = "Explore the world's best destinations", style = MaterialTheme.typography.bodyMedium, color = White.copy(alpha = 0.7f))
            }
        }

        // Search bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .offset(y = (-16).dp)
                .clip(RoundedCornerShape(12.dp))
                .background(White)
                .clickable(onClick = onSearchClick)
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = Icons.Filled.Search, contentDescription = "Search", tint = TextSecondary)
                Text(text = "Search destinations, hotels...", color = TextSecondary, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f).padding(start = 8.dp))
                Icon(imageVector = Icons.Filled.FilterList, contentDescription = "Filter", tint = Purple)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Featured Destinations (cities) - clicking navigates to Search with city pre-selected
        SectionHeader(title = "Featured Destinations", onSeeAllClick = onSearchClick)
        LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(SearchViewModel.AVAILABLE_CITIES) { city ->
                CityCard(city = city, onClick = { onCityClick(city) })
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Hotels list from API
        if (hotels.isNotEmpty()) {
            SectionHeader(title = "Hotels", onSeeAllClick = onSearchClick)
            Column(modifier = Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                hotels.forEach { property ->
                    PropertyCard(property = property, onClick = { onPropertyClick(property.id) })
                }
            }
        }

        // TODO(future): Re-enable "Popular This Week" and "Top Stays" sections
        //   when a dedicated view with date selection is available for direct booking

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun CityCard(city: String, onClick: () -> Unit) {
    val countryMap = mapOf(
        "Bogotá" to "Colombia", "Lima" to "Peru", "Quito" to "Ecuador",
        "Santiago" to "Chile", "Buenos Aires" to "Argentina", "Ciudad de México" to "Mexico"
    )
    val colorMap = mapOf(
        "Bogotá" to Purple, "Lima" to PurpleDark, "Quito" to PurpleLight,
        "Santiago" to Purple.copy(alpha = 0.7f), "Buenos Aires" to PurpleDark.copy(alpha = 0.8f),
        "Ciudad de México" to PurpleLight.copy(alpha = 0.9f)
    )

    Card(
        modifier = Modifier
            .width(150.dp)
            .height(180.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colorMap[city] ?: Purple)
                .padding(12.dp)
        ) {
            Column(modifier = Modifier.align(Alignment.BottomStart)) {
                Text(
                    text = city,
                    color = White,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.LocationOn, null, modifier = Modifier.padding(end = 2.dp), tint = White.copy(alpha = 0.8f))
                    Text(
                        text = countryMap[city] ?: "",
                        color = White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, onSeeAllClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(text = "See all", color = Purple, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.clickable(onClick = onSeeAllClick))
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun HomeScreenPreview() {
    TravelHubTheme {
        HomeContent(
            hotels = emptyList(),
            onSearchClick = {},
            onCityClick = {},
            onPropertyClick = {},
            onNotificationsClick = {}
        )
    }
}
