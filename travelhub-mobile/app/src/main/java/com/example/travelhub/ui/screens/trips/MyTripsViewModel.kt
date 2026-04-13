package com.example.travelhub.ui.screens.trips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.usecase.CancelBookingUseCase
import com.example.travelhub.domain.usecase.GetRecentBookingsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class MyTripsViewModel @Inject constructor(
    private val getRecentBookingsUseCase: GetRecentBookingsUseCase,
    private val cancelBookingUseCase: CancelBookingUseCase
) : ViewModel() {

    private val _bookings = MutableStateFlow<List<Booking>>(emptyList())
    val bookings: StateFlow<List<Booking>> = _bookings.asStateFlow()

    val upcoming: List<Booking> get() = _bookings.value.filter {
        it.checkIn >= LocalDate.now() && it.status != com.example.travelhub.domain.model.BookingStatus.CANCELLED
    }

    val past: List<Booking> get() = _bookings.value.filter {
        it.checkIn < LocalDate.now() || it.status == com.example.travelhub.domain.model.BookingStatus.CANCELLED
    }

    init {
        loadBookings()
    }

    fun loadBookings() {
        viewModelScope.launch {
            _bookings.value = getRecentBookingsUseCase("user_001")
        }
    }

    fun cancelBooking(bookingId: String) {
        viewModelScope.launch {
            cancelBookingUseCase(bookingId)
            loadBookings()
        }
    }
}
