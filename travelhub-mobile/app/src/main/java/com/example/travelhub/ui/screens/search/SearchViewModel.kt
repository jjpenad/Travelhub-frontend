package com.example.travelhub.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.SearchFilters
import com.example.travelhub.domain.model.SortOption
import com.example.travelhub.domain.model.applySort
import com.example.travelhub.domain.usecase.SearchPropertiesUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
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
        val DEFAULT_SORT = SortOption.PRICE_ASC
        private const val PAGE_SIZE = 20
    }

    // ── Form state ──────────────────────────────────────────────────────────

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

    // ── Paged results state ─────────────────────────────────────────────────

    private val _items = MutableStateFlow<List<Property>>(emptyList())
    private val _nextPage = MutableStateFlow(1)
    private val _total = MutableStateFlow<Int?>(null)

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _isLoadingMore = MutableStateFlow(false)
    val isLoadingMore: StateFlow<Boolean> = _isLoadingMore.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _hasSearched = MutableStateFlow(false)
    val hasSearched: StateFlow<Boolean> = _hasSearched.asStateFlow()

    private val _sortOption = MutableStateFlow(DEFAULT_SORT)
    val sortOption: StateFlow<SortOption> = _sortOption.asStateFlow()

    /** Sorted view of [_items]. Re-emits whenever items or sort changes. */
    val results: StateFlow<List<Property>> = combine(_items, _sortOption) { raw, sort ->
        raw.applySort(sort)
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val total: StateFlow<Int?> = _total.asStateFlow()
    val hasMore: Boolean get() = _total.value?.let { _items.value.size < it } ?: true

    // ── Date helpers ────────────────────────────────────────────────────────

    val checkInFormatted: String get() = _checkIn.value.format(DateTimeFormatter.ofPattern("MMM dd"))
    val checkOutFormatted: String get() = _checkOut.value.format(DateTimeFormatter.ofPattern("MMM dd"))
    val checkInApi: String get() = _checkIn.value.toString()
    val checkOutApi: String get() = _checkOut.value.toString()

    // ── Form mutators ───────────────────────────────────────────────────────

    fun onCityChange(city: String) { _selectedCity.value = city }
    fun onCheckInChange(date: LocalDate) { _checkIn.value = date }
    fun onCheckOutChange(date: LocalDate) { _checkOut.value = date }
    fun onGuestsChange(value: Int) { _guests.value = value.coerceAtLeast(1) }
    fun onRoomsChange(value: Int) { _rooms.value = value.coerceAtLeast(1) }
    fun onSortChange(option: SortOption) { _sortOption.value = option }

    // ── Search actions ──────────────────────────────────────────────────────

    private fun currentFilters(): SearchFilters = SearchFilters(
        destination = _selectedCity.value,
        checkIn = _checkIn.value,
        checkOut = _checkOut.value,
        guests = _guests.value,
        rooms = _rooms.value
    )

    /** First page. Used by the search button. */
    fun search() {
        if (_isLoading.value) return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val page = searchPropertiesUseCase(currentFilters(), page = 1, pageSize = PAGE_SIZE)
                _items.value = page.items
                _total.value = page.total
                _nextPage.value = 2
                _hasSearched.value = true
            } finally {
                _isLoading.value = false
            }
        }
    }

    /** Append next page. Idempotent. */
    fun loadMore() {
        if (_isLoadingMore.value || _isLoading.value || !hasMore) return
        viewModelScope.launch {
            _isLoadingMore.value = true
            try {
                val page = searchPropertiesUseCase(currentFilters(), page = _nextPage.value, pageSize = PAGE_SIZE)
                _items.update { current -> (current + page.items).distinctBy { it.id } }
                _total.value = page.total ?: _total.value
                if (page.items.isNotEmpty()) _nextPage.update { it + 1 }
            } finally {
                _isLoadingMore.value = false
            }
        }
    }

    /** Pull-to-refresh: re-runs the same query from page 1. */
    fun refresh() {
        if (_isRefreshing.value) return
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                val page = searchPropertiesUseCase(currentFilters(), page = 1, pageSize = PAGE_SIZE)
                _items.value = page.items
                _total.value = page.total
                _nextPage.value = 2
            } finally {
                _isRefreshing.value = false
            }
        }
    }
}
