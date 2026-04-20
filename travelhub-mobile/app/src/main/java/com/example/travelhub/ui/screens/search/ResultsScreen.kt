package com.example.travelhub.ui.screens.search

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Sort
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.domain.model.SortOption
import com.example.travelhub.ui.components.PropertyCard
import com.example.travelhub.ui.theme.DividerColor
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextPrimary
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun ResultsScreen(
    viewModel: SearchViewModel,
    onPropertyClick: (String) -> Unit,
    onBack: () -> Unit
) {
    val results by viewModel.results.collectAsStateWithLifecycle()
    val selectedCity by viewModel.selectedCity.collectAsStateWithLifecycle()
    val guests by viewModel.guests.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val sortOption by viewModel.sortOption.collectAsStateWithLifecycle()

    ResultsContent(
        results = results,
        destination = selectedCity,
        dateRange = "${viewModel.checkInFormatted} → ${viewModel.checkOutFormatted}",
        guests = guests,
        isLoading = isLoading,
        sortOption = sortOption,
        onSortChange = viewModel::onSortChange,
        onPropertyClick = onPropertyClick,
        onBack = onBack
    )
}

@Composable
private fun ResultsContent(
    results: List<Property>,
    destination: String,
    dateRange: String,
    guests: Int,
    isLoading: Boolean,
    sortOption: SortOption,
    onSortChange: (SortOption) -> Unit,
    onPropertyClick: (String) -> Unit,
    onBack: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().background(White).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Back") }
            Column {
                Text(text = if (destination.isNotBlank()) destination else "All Destinations", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(text = "$dateRange · $guests guests · ${results.size} results", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
        }

        SortBar(
            selected = sortOption,
            onSelect = onSortChange,
            enabled = !isLoading && results.isNotEmpty()
        )

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Purple)
            }
        } else if (results.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("No hotels available", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                    Text("Try different dates or another city", color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
                }
            }
        } else {
            LazyColumn(modifier = Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(results, key = { it.id }) { property ->
                    PropertyCard(property = property, onClick = { onPropertyClick(property.id) })
                }
                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }
}

@Composable
private fun SortBar(
    selected: SortOption,
    onSelect: (SortOption) -> Unit,
    enabled: Boolean
) {
    var expanded by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(White)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Sort by",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )
        Spacer(modifier = Modifier.width(8.dp))

        Box {
            Row(
                modifier = Modifier
                    .border(1.dp, DividerColor, RoundedCornerShape(8.dp))
                    .clickable(enabled = enabled) { expanded = true }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.Sort,
                    contentDescription = null,
                    tint = Purple
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = selected.label,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Filled.ArrowDropDown,
                    contentDescription = "Open sort options",
                    tint = TextSecondary
                )
            }

            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                SortOption.values().forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = option.label,
                                fontWeight = if (option == selected) FontWeight.SemiBold else FontWeight.Normal,
                                color = if (option == selected) Purple else TextPrimary
                            )
                        },
                        onClick = {
                            onSelect(option)
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun ResultsScreenPreview() {
    TravelHubTheme {
        ResultsContent(
            results = listOf(
                Property(id = "1", name = "Casa Sol Lima", city = "Lima", country = "Peru", address = "Malecon",
                    starRating = 5, rating = 4.8, reviewCount = 578, pricePerNight = 247.50,
                    amenities = listOf("pool", "spa"),
                    rooms = listOf(Room("r1", "Ocean Room", price = 247.50, capacity = 2)))
            ),
            destination = "Lima", dateRange = "May 01 → May 05", guests = 2, isLoading = false,
            sortOption = SortOption.PRICE_ASC, onSortChange = {},
            onPropertyClick = {}, onBack = {}
        )
    }
}
