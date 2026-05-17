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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.domain.model.SortOption
import com.example.travelhub.ui.components.InfiniteScrollEffect
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
    val isLoadingMore by viewModel.isLoadingMore.collectAsStateWithLifecycle()
    val isRefreshing by viewModel.isRefreshing.collectAsStateWithLifecycle()
    val total by viewModel.total.collectAsStateWithLifecycle()
    val sortOption by viewModel.sortOption.collectAsStateWithLifecycle()

    ResultsContent(
        results = results,
        destination = selectedCity,
        dateRange = "${viewModel.checkInFormatted} → ${viewModel.checkOutFormatted}",
        guests = guests,
        totalCount = total,
        isLoading = isLoading,
        isLoadingMore = isLoadingMore,
        isRefreshing = isRefreshing,
        hasMore = viewModel.hasMore,
        sortOption = sortOption,
        onSortChange = viewModel::onSortChange,
        onLoadMore = viewModel::loadMore,
        onRefresh = viewModel::refresh,
        onPropertyClick = onPropertyClick,
        onBack = onBack
    )
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun ResultsContent(
    results: List<Property>,
    destination: String,
    dateRange: String,
    guests: Int,
    totalCount: Int?,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    isRefreshing: Boolean,
    hasMore: Boolean,
    sortOption: SortOption,
    onSortChange: (SortOption) -> Unit,
    onLoadMore: () -> Unit,
    onRefresh: () -> Unit,
    onPropertyClick: (String) -> Unit,
    onBack: () -> Unit
) {
    val listState = rememberLazyListState()
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = onRefresh
    )

    InfiniteScrollEffect(
        listState = listState,
        enabled = hasMore && !isRefreshing && !isLoadingMore && !isLoading,
        onLoadMore = onLoadMore
    )

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth().background(White).padding(horizontal = 8.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, stringResource(R.string.action_back))
            }
            Column {
                Text(
                    text = if (destination.isNotBlank()) destination else stringResource(R.string.results_all_destinations),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                val countLabel = totalCount?.toString()
                    ?: (results.size.toString() + stringResource(R.string.results_count_unknown_suffix))
                Text(
                    text = stringResource(R.string.results_summary_template, dateRange, guests, countLabel),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
        }

        SortBar(
            selected = sortOption,
            onSelect = onSortChange,
            enabled = !isLoading && results.isNotEmpty()
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .pullRefresh(pullRefreshState)
        ) {
            when {
                isLoading && results.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Purple)
                    }
                }
                results.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(stringResource(R.string.results_empty_title), fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                            Text(stringResource(R.string.results_empty_subtitle), color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(results, key = { it.id }) { property ->
                            PropertyCard(property = property, onClick = { onPropertyClick(property.id) })
                        }
                        if (isLoadingMore) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator(color = Purple, strokeWidth = 2.dp)
                                }
                            }
                        }
                        item { Spacer(modifier = Modifier.height(16.dp)) }
                    }
                }
            }

            PullRefreshIndicator(
                refreshing = isRefreshing,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                contentColor = Purple
            )
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
            text = stringResource(R.string.sort_label),
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
                Icon(imageVector = Icons.Filled.Sort, contentDescription = null, tint = Purple)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = stringResource(selected.labelRes),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(imageVector = Icons.Filled.ArrowDropDown, contentDescription = stringResource(R.string.sort_options_dropdown_cd), tint = TextSecondary)
            }

            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                SortOption.values().forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Text(
                                text = stringResource(option.labelRes),
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
            destination = "Lima", dateRange = "May 01 → May 05", guests = 2,
            totalCount = 1,
            isLoading = false, isLoadingMore = false, isRefreshing = false, hasMore = false,
            sortOption = SortOption.PRICE_ASC, onSortChange = {},
            onLoadMore = {}, onRefresh = {},
            onPropertyClick = {}, onBack = {}
        )
    }
}
