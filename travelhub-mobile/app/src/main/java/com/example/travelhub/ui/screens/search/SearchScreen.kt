package com.example.travelhub.ui.screens.search

import android.app.DatePickerDialog
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White
import java.time.LocalDate

@Composable
fun SearchScreen(
    viewModel: SearchViewModel,
    onResultsReady: () -> Unit
) {
    val selectedCity by viewModel.selectedCity.collectAsStateWithLifecycle()
    val checkIn by viewModel.checkIn.collectAsStateWithLifecycle()
    val checkOut by viewModel.checkOut.collectAsStateWithLifecycle()
    val guests by viewModel.guests.collectAsStateWithLifecycle()
    val rooms by viewModel.rooms.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()

    SearchContent(
        selectedCity = selectedCity,
        checkIn = checkIn,
        checkOut = checkOut,
        checkInFormatted = viewModel.checkInFormatted,
        checkOutFormatted = viewModel.checkOutFormatted,
        guests = guests,
        rooms = rooms,
        isLoading = isLoading,
        onCityChange = viewModel::onCityChange,
        onCheckInChange = viewModel::onCheckInChange,
        onCheckOutChange = viewModel::onCheckOutChange,
        onGuestsInc = { viewModel.onGuestsChange(guests + 1) },
        onGuestsDec = { viewModel.onGuestsChange(guests - 1) },
        onSearch = { viewModel.search(); onResultsReady() }
    )
}

@Composable
private fun SearchContent(
    selectedCity: String,
    checkIn: LocalDate,
    checkOut: LocalDate,
    checkInFormatted: String,
    checkOutFormatted: String,
    guests: Int,
    rooms: Int,
    isLoading: Boolean,
    onCityChange: (String) -> Unit,
    onCheckInChange: (LocalDate) -> Unit,
    onCheckOutChange: (LocalDate) -> Unit,
    onGuestsInc: () -> Unit,
    onGuestsDec: () -> Unit,
    onSearch: () -> Unit
) {
    var cityDropdownExpanded by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val cityPlaceholder = stringResource(R.string.search_city_placeholder)
    val cityPickerCd = stringResource(R.string.search_city_picker_cd)

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())
    ) {
        // Header
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(20.dp)) {
            Column {
                Text(text = stringResource(R.string.search_title), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White)
                Text(text = stringResource(R.string.search_subtitle), style = MaterialTheme.typography.bodyMedium, color = White.copy(alpha = 0.8f))
            }
        }

        // Search form card
        Card(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            colors = CardDefaults.cardColors(containerColor = White)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                // City selector
                Text(stringResource(R.string.search_section_destination), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Box {
                    OutlinedTextField(
                        value = selectedCity.ifEmpty { cityPlaceholder },
                        onValueChange = {},
                        modifier = Modifier.fillMaxWidth(),
                        enabled = false,
                        leadingIcon = { Icon(Icons.Filled.LocationOn, null, tint = Purple) },
                        trailingIcon = { Icon(Icons.Filled.KeyboardArrowDown, null, tint = Purple) },
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            disabledTextColor = if (selectedCity.isEmpty()) TextSecondary else MaterialTheme.colorScheme.onSurface,
                            disabledBorderColor = MaterialTheme.colorScheme.outline,
                            disabledLeadingIconColor = Purple,
                            disabledTrailingIconColor = Purple
                        ),
                        singleLine = true
                    )
                    Box(
                        modifier = Modifier.matchParentSize()
                            .clickable { cityDropdownExpanded = true }
                            // mergeDescendants=true collapses the disabled
                            // OutlinedTextField's semantics into this node so
                            // accessibility tooling (Maestro, talkback) sees a
                            // single tappable element exposing the description.
                            .semantics(mergeDescendants = true) {
                                contentDescription = cityPickerCd
                            }
                    )
                    DropdownMenu(
                        expanded = cityDropdownExpanded,
                        onDismissRequest = { cityDropdownExpanded = false }
                    ) {
                        SearchViewModel.AVAILABLE_CITIES.forEach { city ->
                            DropdownMenuItem(
                                text = { Text(city) },
                                onClick = {
                                    onCityChange(city)
                                    cityDropdownExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Date selectors
                Text(stringResource(R.string.search_section_dates), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Check-in date
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                DatePickerDialog(
                                    context,
                                    { _, year, month, day ->
                                        onCheckInChange(LocalDate.of(year, month + 1, day))
                                    },
                                    checkIn.year, checkIn.monthValue - 1, checkIn.dayOfMonth
                                ).show()
                            },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Purple.copy(alpha = 0.05f))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.CalendarMonth, null, tint = Purple)
                            Column(modifier = Modifier.padding(start = 8.dp)) {
                                Text(stringResource(R.string.search_checkin_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text(checkInFormatted, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
                            }
                        }
                    }

                    // Check-out date
                    Card(
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                DatePickerDialog(
                                    context,
                                    { _, year, month, day ->
                                        onCheckOutChange(LocalDate.of(year, month + 1, day))
                                    },
                                    checkOut.year, checkOut.monthValue - 1, checkOut.dayOfMonth
                                ).show()
                            },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Purple.copy(alpha = 0.05f))
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.CalendarMonth, null, tint = Purple)
                            Column(modifier = Modifier.padding(start = 8.dp)) {
                                Text(stringResource(R.string.search_checkout_label), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                                Text(checkOutFormatted, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(stringResource(R.string.search_section_guests_rooms), style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Person, null, tint = Purple)
                    Text(
                        text = stringResource(R.string.search_guests_rooms_summary, guests, rooms),
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.weight(1f).padding(vertical = 12.dp)
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        CounterButton(label = "-", contentDescription = stringResource(R.string.search_decrement_cd), onClick = onGuestsDec)
                        CounterButton(label = "+", contentDescription = stringResource(R.string.search_increment_cd), onClick = onGuestsInc)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                if (isLoading) {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Purple)
                    }
                } else {
                    TravelHubButton(
                        text = stringResource(R.string.search_submit),
                        onClick = onSearch,
                        enabled = selectedCity.isNotEmpty()
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

/**
 * `+` / `-` are pure mathematical symbols, identical across all locales —
 * they stay as raw chars. The contentDescription is what carries the
 * accessible, localised meaning of the button.
 */
@Composable
private fun CounterButton(label: String, contentDescription: String, onClick: () -> Unit) {
    Box(modifier = Modifier.background(Purple.copy(alpha = 0.1f), RoundedCornerShape(8.dp)).padding(horizontal = 12.dp, vertical = 4.dp)) {
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .padding(0.dp)
                .semantics { this.contentDescription = contentDescription }
        ) {
            Text(label, fontWeight = FontWeight.Bold, color = Purple)
        }
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun SearchScreenPreview() {
    TravelHubTheme {
        SearchContent(
            selectedCity = "Lima",
            checkIn = LocalDate.of(2026, 5, 1),
            checkOut = LocalDate.of(2026, 5, 5),
            checkInFormatted = "May 1, 2026", checkOutFormatted = "May 5, 2026",
            guests = 2, rooms = 1, isLoading = false,
            onCityChange = {}, onCheckInChange = {}, onCheckOutChange = {},
            onGuestsInc = {}, onGuestsDec = {}, onSearch = {}
        )
    }
}
