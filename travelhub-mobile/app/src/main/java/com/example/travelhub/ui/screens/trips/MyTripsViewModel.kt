package com.example.travelhub.ui.screens.trips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.repository.AuthRepository
import com.example.travelhub.domain.usecase.CancelBookingUseCase
import com.example.travelhub.domain.usecase.GetUserReservationsUseCase
import com.example.travelhub.ui.state.PagedListState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class MyTripsViewModel @Inject constructor(
    private val getUserReservationsUseCase: GetUserReservationsUseCase,
    private val cancelBookingUseCase: CancelBookingUseCase,
    authRepository: AuthRepository
) : ViewModel() {

    /** True when the user has an active session with a JWT. UI uses this to show
     *  a "Sign in to track your trips" CTA when false. */
    val isAuthenticated: StateFlow<Boolean> = authRepository.getSession()
        .map { it?.token?.isNotBlank() == true }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    companion object {
        private const val PAGE_SIZE = 20
    }

    private val _state = MutableStateFlow(PagedListState<Booking>(pageSize = PAGE_SIZE))
    val state: StateFlow<PagedListState<Booking>> = _state.asStateFlow()

    /** Flat list of all loaded bookings — kept for screens that don't care about
     *  the upcoming/past split (TripDetails, QRCheckIn). */
    val bookings: StateFlow<List<Booking>> = _state
        .map { it.items }
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    /** Upcoming = checkIn ≥ today AND not cancelled. Sorted by checkIn ascending. */
    val upcoming: List<Booking>
        get() = _state.value.items
            .filter { it.checkIn >= LocalDate.now() && it.status != BookingStatus.CANCELLED }
            .sortedBy { it.checkIn }

    /** Past = checkIn < today OR cancelled. Sorted by checkOut descending (most recent first). */
    val past: List<Booking>
        get() = _state.value.items
            .filter { it.checkIn < LocalDate.now() || it.status == BookingStatus.CANCELLED }
            .sortedByDescending { it.checkOut }

    init {
        loadFirstPage()
    }

    /** Initial load: replaces items with the first page. Used at startup. */
    fun loadFirstPage() {
        if (_state.value.isLoading) return
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try {
                val page = getUserReservationsUseCase(limit = PAGE_SIZE, offset = 0)
                _state.update {
                    it.copy(
                        items = page.items,
                        nextOffset = page.nextOffset,
                        total = page.total,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, error = e.message ?: "Could not load trips") }
            }
        }
    }

    /** Append the next page. Idempotent: noop if already loading or no more pages. */
    fun loadMore() {
        val s = _state.value
        if (s.isLoadingMore || s.isLoading || !s.hasMore) return
        viewModelScope.launch {
            _state.update { it.copy(isLoadingMore = true) }
            try {
                val page = getUserReservationsUseCase(limit = PAGE_SIZE, offset = s.nextOffset)
                _state.update { current ->
                    val merged = (current.items + page.items).distinctBy { it.id }
                    current.copy(
                        items = merged,
                        nextOffset = page.nextOffset,
                        total = page.total ?: current.total,
                        isLoadingMore = false
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoadingMore = false, error = e.message) }
            }
        }
    }

    /** Pull-to-refresh: re-fetch from offset=0 without clearing the list immediately. */
    fun refresh() {
        if (_state.value.isRefreshing) return
        viewModelScope.launch {
            _state.update { it.copy(isRefreshing = true, error = null) }
            try {
                val page = getUserReservationsUseCase(limit = PAGE_SIZE, offset = 0)
                _state.update {
                    it.copy(
                        items = page.items,
                        nextOffset = page.nextOffset,
                        total = page.total,
                        isRefreshing = false
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isRefreshing = false, error = e.message) }
            }
        }
    }

    fun cancelBooking(bookingId: String) {
        viewModelScope.launch {
            cancelBookingUseCase(bookingId)
            refresh()
        }
    }
}
