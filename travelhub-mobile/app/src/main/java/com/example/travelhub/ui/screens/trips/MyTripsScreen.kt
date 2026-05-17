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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.ui.components.InfiniteScrollEffect
import com.example.travelhub.ui.components.OnResumeEffect
import com.example.travelhub.ui.util.formatLocalized
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
    onTripClick: (String) -> Unit,
    onSignInClick: () -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isAuthenticated by viewModel.isAuthenticated.collectAsStateWithLifecycle()

    // Auto-refresh whenever the user lands back on this screen — covers the
    // "I just finished booking, take me to my trips, where's my new one?" case.
    OnResumeEffect { viewModel.refresh() }

    MyTripsContent(
        upcoming = viewModel.upcoming,
        past = viewModel.past,
        isLoading = state.isLoading,
        isLoadingMore = state.isLoadingMore,
        isRefreshing = state.isRefreshing,
        hasMore = state.hasMore,
        isAuthenticated = isAuthenticated,
        onRefresh = viewModel::refresh,
        onLoadMore = viewModel::loadMore,
        onTripClick = onTripClick,
        onSignInClick = onSignInClick
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
    isAuthenticated: Boolean,
    onRefresh: () -> Unit,
    onLoadMore: () -> Unit,
    onTripClick: (String) -> Unit,
    onSignInClick: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }
    val displayBookings = if (selectedTab == 0) upcoming else past

    val listState = rememberLazyListState()
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = onRefresh
    )

    InfiniteScrollEffect(
        listState = listState,
        enabled = hasMore && !isRefreshing && !isLoadingMore,
        onLoadMore = onLoadMore
    )

    Column(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(20.dp)) {
            Column {
                Text(stringResource(R.string.trips_title), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White)
                Text(stringResource(R.string.trips_subtitle), style = MaterialTheme.typography.bodyMedium, color = White.copy(alpha = 0.8f))
            }
        }

        TabRow(
            selectedTabIndex = selectedTab, containerColor = White, contentColor = Purple,
            indicator = { tabPositions -> TabRowDefaults.Indicator(modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]), color = Purple) }
        ) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text(stringResource(R.string.trips_tab_upcoming), modifier = Modifier.padding(16.dp), fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal)
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text(stringResource(R.string.trips_tab_past), modifier = Modifier.padding(16.dp), fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal)
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
                displayBookings.isEmpty() && !isAuthenticated -> {
                    SignInPromptState(onSignInClick = onSignInClick)
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
private fun SignInPromptState(onSignInClick: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = stringResource(R.string.trips_signin_prompt_title),
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = stringResource(R.string.trips_signin_prompt_subtitle),
                color = TextSecondary,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 8.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            com.example.travelhub.ui.components.TravelHubButton(
                text = stringResource(R.string.action_sign_in),
                onClick = onSignInClick
            )
        }
    }
}

@Composable
private fun EmptyState(isUpcoming: Boolean) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = stringResource(
                    if (isUpcoming) R.string.trips_empty_upcoming_title else R.string.trips_empty_past_title
                ),
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = stringResource(
                    if (isUpcoming) R.string.trips_empty_upcoming_subtitle else R.string.trips_empty_past_subtitle
                ),
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
                if (booking.isCheckedIn) CheckedInBadge() else StatusBadge(booking.status)
                Text(booking.propertyName, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                Text(
                    text = stringResource(
                        R.string.trips_card_dates_template,
                        booking.checkIn.formatLocalized(),
                        booking.checkOut.formatLocalized(),
                        booking.guests
                    ),
                    style = MaterialTheme.typography.bodySmall
                )
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
                        Text(stringResource(R.string.trips_card_view_details), color = White, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun CheckedInBadge() {
    Box(
        modifier = Modifier.clip(RoundedCornerShape(4.dp))
            .background(Purple.copy(alpha = 0.15f))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(stringResource(R.string.trips_status_checked_in), color = Purple, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun StatusBadge(status: BookingStatus) {
    val (color, textRes) = when (status) {
        BookingStatus.CONFIRMED -> GreenAccent to R.string.trips_status_confirmed
        BookingStatus.PENDING -> OrangeAccent to R.string.trips_status_pending
        BookingStatus.CANCELLED -> RedAccent to R.string.trips_status_cancelled
        BookingStatus.COMPLETED -> TextSecondary to R.string.trips_status_completed
    }
    Box(
        modifier = Modifier.clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = 8.dp, vertical = 2.dp)
    ) {
        Text(stringResource(textRes), color = color, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.SemiBold)
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun MyTripsScreenPreview() {
    TravelHubTheme {
        MyTripsContent(
            upcoming = emptyList(), past = emptyList(),
            isLoading = false, isLoadingMore = false, isRefreshing = false, hasMore = false,
            isAuthenticated = false,
            onRefresh = {}, onLoadMore = {}, onTripClick = {}, onSignInClick = {}
        )
    }
}
