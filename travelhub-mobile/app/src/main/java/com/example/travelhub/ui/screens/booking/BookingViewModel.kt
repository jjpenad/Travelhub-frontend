package com.example.travelhub.ui.screens.booking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.PaymentRequestDto
import com.example.travelhub.data.remote.dto.PrimaryGuestDto
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.BookingStatus
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.domain.repository.BookingRepository
import com.example.travelhub.domain.repository.PropertyRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

sealed interface BookingUiState {
    object Loading : BookingUiState
    data class Summary(
        val property: Property,
        val selectedRoom: Room,
        val checkIn: String,
        val checkOut: String,
        val nights: Int,
        val totalPrice: Double
    ) : BookingUiState
    object Processing : BookingUiState
    data class Confirmed(
        val bookingId: String,
        val bookingRef: String,
        val property: Property,
        val totalPrice: Double
    ) : BookingUiState
    data class Error(val message: String) : BookingUiState
}

@HiltViewModel
class BookingViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val propertyRepository: PropertyRepository,
    private val bookingRepository: BookingRepository,
    private val guestSessionStore: GuestSessionStore
) : ViewModel() {

    private val propertyId: String = savedStateHandle["propertyId"] ?: ""
    private val roomId: String = savedStateHandle["roomId"] ?: ""
    private val checkIn: String = savedStateHandle["checkIn"] ?: ""
    private val checkOut: String = savedStateHandle["checkOut"] ?: ""

    private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Loading)
    val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            val property = propertyRepository.getAvailability(propertyId, checkIn, checkOut)
            if (property != null) {
                val selectedRoom = property.rooms.find { it.id == roomId } ?: property.rooms.firstOrNull()
                if (selectedRoom != null) {
                    _uiState.value = BookingUiState.Summary(
                        property = property,
                        selectedRoom = selectedRoom,
                        checkIn = checkIn,
                        checkOut = checkOut,
                        nights = property.nights,
                        totalPrice = selectedRoom.totalPrice
                    )
                } else {
                    _uiState.value = BookingUiState.Error("No rooms available")
                }
            } else {
                _uiState.value = BookingUiState.Error("Property not found")
            }
        }
    }

    fun confirmAndPay() {
        val currentState = _uiState.value as? BookingUiState.Summary ?: return
        viewModelScope.launch {
            _uiState.value = BookingUiState.Processing

            val request = CreateReservationRequest(
                hotelId = propertyId,
                roomTypeId = currentState.selectedRoom.id,
                checkIn = currentState.checkIn,
                checkOut = currentState.checkOut,
                guests = 2,
                basePrice = String.format("%.2f", currentState.selectedRoom.price * currentState.nights),
                taxes = "0.00",
                discounts = "0.00",
                totalPrice = String.format("%.2f", currentState.totalPrice),
                currencyCode = currentState.selectedRoom.currencyCode,
                primaryGuest = PrimaryGuestDto(
                    firstName = "Alejandra",
                    lastName = "Pinzon"
                ),
                payment = PaymentRequestDto(
                    amount = String.format("%.2f", currentState.totalPrice)
                )
            )

            val result = bookingRepository.createReservation(request)

            result.fold(
                onSuccess = { response ->
                    val confirmationCode = response.result.confirmationCode ?: "N/A"
                    // reservation_id can come from top-level result or nested reservation object
                    val reservationId = response.result.reservationId
                        ?: response.result.reservation?.id
                        ?: confirmationCode

                    // Save booking locally — tag it with the active guest session id
                    // so MyTrips can filter by current session and wipe stale rows.
                    val booking = Booking(
                        id = reservationId,
                        userId = guestSessionStore.currentId().orEmpty(),
                        propertyId = propertyId,
                        propertyName = currentState.property.name,
                        propertyLocation = "${currentState.property.city}, ${currentState.property.country}",
                        checkIn = LocalDate.parse(currentState.checkIn),
                        checkOut = LocalDate.parse(currentState.checkOut),
                        guests = 2,
                        rooms = 1,
                        roomType = currentState.selectedRoom.type,
                        totalPrice = currentState.totalPrice,
                        status = BookingStatus.PENDING,
                        bookingRef = confirmationCode
                    )
                    bookingRepository.create(booking)

                    _uiState.value = BookingUiState.Confirmed(
                        bookingId = reservationId,
                        bookingRef = confirmationCode,
                        property = currentState.property,
                        totalPrice = currentState.totalPrice
                    )
                },
                onFailure = { e ->
                    _uiState.value = BookingUiState.Error(e.message ?: "Reservation failed")
                }
            )
        }
    }
}
