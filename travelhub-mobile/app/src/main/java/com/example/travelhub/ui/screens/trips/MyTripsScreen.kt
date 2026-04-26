package com.example.travelhub.ui.screens.trips

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.ui.components.InfiniteScrollEffect
import com.example.travelhub.ui.theme.GreenAccent
import com.example.travelhub.ui.theme.OrangeAccent
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.RedAccent
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun MyTripsScreen(
    viewModel: MyTripsViewModel,
    onTripClick: (String) -> Unit
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    MyTripsContent(
        upcoming = viewModel.upcoming,
        past = viewModel.past,
        isLoading = state.isLoading,
        isLoadingMore = state.isLoadingMore,
        isRefreshing = state.isRefreshing,
        hasMore = state.hasMore,
        onRefresh = viewModel::refresh,
        onLoadMore = viewModel::loadMore,
        onTripClick = onTripClick
    )
}

@OptIn(ExperimentalMaterialApi::class)
@Composable
private fun MyTripsContent(
    upcoming: List<Booking>,
    past: List<Booking>,
    isLoading: Boolean,
    isLoadingMore: Boolean,
    isRefreshing: Boolean,
    hasMore: Boolean,
    onRefresh: () -> Unit,
    onLoadMore: () -> Unit,
    onTripClick: (String) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val displayBookings = if (selectedTab == 0) upcoming else past

    val listState = rememberLazyListState()
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = onRefresh
    )

    // Infinite scroll trigger — only fire while we still have more pages and we're
    // not in the middle of a refresh.
    InfiniteScrollEffect(
        listState = listState,
        enabled = hasMore && !isRefreshing && !isLoadingMore,
        onLoadMore = onLoadMore
    )

    Column(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(20.dp)) {
            Column {
                Text("My Trips", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White)
                Text("Your upcoming & past adventures", style = MaterialTheme.typography.bodyMedium, color = White.copy(alpha = 0.8f))
            }
        }

        TabRow(
            selectedTabIndex = selectedTab, containerColor = White, contentColor = Purple,
            indicator = { tabPositions -> TabRowDefaults.Indicator(modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]), color = Purple) }
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text("Upcoming", modifier = Modifier.padding(16.dp), fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal)
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text("Past", modifier = Modifier.padding(16.dp), fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .pullRefresh(pullRefreshState)
        ) {
            when {
                isLoading && displayBookings.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Purple)
                    }
                }
                displayBookings.isEmpty() -> {
                    EmptyState(isUpcoming = selectedTab == 0)
                }
                else -> {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(displayBookings, key = { it.id }) { booking ->
                            TripCard(
                                booking = booking,
                                showViewDetails = selectedTab == 0 &&
                                    booking.status in setOf(BookingStatus.CONFIRMED, BookingStatus.PENDING),
                                onClick = { onTripClick(booking.id) }
                            )
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
private fun EmptyState(isUpcoming: Boolean) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = if (isUpcoming) "No upcoming trips yet" else "No past trips",
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = if (isUpcoming) "Start exploring and book your next stay." else "Past trips will appear here.",
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun TripCard(
    booking: Booking,
    showViewDetails: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = White)
    ) {
        Row(modifier = Modifier.padding(12.dp)) {
            Box(
                modifier = Modifier.size(90.dp).clip(RoundedCornerShape(12.dp))
                    .background(Purple.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    booking.propertyName.take(2).uppercase(),
                    color = Purple, fontWeight = FontWeight.Bold, fontSize = 18.sp
                )
            }
            Column(modifier = Modifier.padding(start = 12.dp)) {
                StatusBadge(booking.status)
                Text(booking.propertyName, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                Text("${booking.checkIn} → ${booking.checkOut} · ${booking.guests} guests", style = MaterialTheme.typography.bodySmall)
                if (booking.propertyLocation.isNotBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.LocationOn, null, tint = Purple, modifier = Modifier.size(14.dp))
                        Text(booking.propertyLocation, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                if (showViewDetails) {
                    Box(
                        modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(Purple)
                            .padding(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("View Details", color = White, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusBadge(status: BookingStatus) {
    val (color, text) = when (status) {
        BookingStatus.CONFIRMED -> GreenAccent to "Confirmed"
        BookingStatus.PENDING -> OrangeAccent to "Pending"
        BookingStatus.CANCELLED -> RedAccent to "Cancelled"
        BookingStatus.COMPLETED -> TextSecondary to "Completed"
    }
    Box(
        modifier = Modifier.clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(text, color = color, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold)
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun MyTripsScreenPreview() {
    TravelHubTheme {
        MyTripsContent(
            upcoming = emptyList(), past = emptyList(),
            isLoading = false, isLoadingMore = false, isRefreshing = false, hasMore = false,
            onRefresh = {}, onLoadMore = {}, onTripClick = {}
        )
    }
}
