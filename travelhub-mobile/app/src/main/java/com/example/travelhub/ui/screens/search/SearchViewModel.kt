package com.example.travelhub.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.usecase.SearchPropertiesUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchPropertiesUseCase: SearchPropertiesUseCase
) : ViewModel() {

    companion object {
        val AVAILABLE_CITIES = listOf(
            "Bogotá", "Lima", "Quito", "Santiago", "Buenos Aires", "Ciudad de México"
        )
    }

    private val _selectedCity = MutableStateFlow("")
    val selectedCity: StateFlow<String> = _selectedCity.asStateFlow()

    private val _checkIn = MutableStateFlow(LocalDate.now().plusDays(7))
    val checkIn: StateFlow<LocalDate> = _checkIn.asStateFlow()

    private val _checkOut = MutableStateFlow(LocalDate.now().plusDays(11))
    val checkOut: StateFlow<LocalDate> = _checkOut.asStateFlow()

    private val _guests = MutableStateFlow(2)
    val guests: StateFlow<Int> = _guests.asStateFlow()

    private val _rooms = MutableStateFlow(1)
    val rooms: StateFlow<Int> = _rooms.asStateFlow()

    private val _results = MutableStateFlow<List<Property>>(emptyList())
    val results: StateFlow<List<Property>> = _results.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _hasSearched = MutableStateFlow(false)
    val hasSearched: StateFlow<Boolean> = _hasSearched.asStateFlow()

    val checkInFormatted: String get() = _checkIn.value.format(DateTimeFormatter.ofPattern("MMM dd"))
    val checkOutFormatted: String get() = _checkOut.value.format(DateTimeFormatter.ofPattern("MMM dd"))
    val checkInApi: String get() = _checkIn.value.toString() // yyyy-MM-dd
    val checkOutApi: String get() = _checkOut.value.toString()

    fun onCityChange(city: String) { _selectedCity.value = city }
    fun onCheckInChange(date: LocalDate) { _checkIn.value = date }
    fun onCheckOutChange(date: LocalDate) { _checkOut.value = date }
    fun onGuestsChange(value: Int) { _guests.value = value.coerceAtLeast(1) }
    fun onRoomsChange(value: Int) { _rooms.value = value.coerceAtLeast(1) }

    fun search() {
        viewModelScope.launch {
            _isLoading.value = true
            val filters = SearchFilters(
                destination = _selectedCity.value,
                checkIn = _checkIn.value,
                checkOut = _checkOut.value,
                guests = _guests.value,
                rooms = _rooms.value
            )
            _results.value = searchPropertiesUseCase(filters)
            _hasSearched.value = true
            _isLoading.value = false
        }
    }
}
