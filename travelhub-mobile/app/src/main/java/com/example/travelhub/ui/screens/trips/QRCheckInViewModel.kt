package com.example.travelhub.ui.screens.trips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.R
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.QrToken
import com.example.travelhub.domain.usecase.CheckinUseCase
import com.example.travelhub.domain.usecase.GenerateReservationQrUseCase
import com.example.travelhub.ui.util.UiText
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI state for the QR / check-in screen.
 *
 * - [booking] is null while we're hydrating from the parent [MyTripsViewModel].
 * - [qr] is recomputed every time the booking changes (e.g. after a self check-in).
 * - [checkinError] is a [UiText] so the screen resolves it via stringResource
 *   at render time; the field stays null while no error is pending.
 */
data class QrCheckInState(
    val booking: Booking? = null,
    val qr: QrToken? = null,
    val isCheckingIn: Boolean = false,
    val checkinError: UiText? = null,
    val showInfoDialog: Boolean = false
)

@HiltViewModel
class QRCheckInViewModel @Inject constructor(
    private val generateQr: GenerateReservationQrUseCase,
    private val checkinUseCase: CheckinUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(QrCheckInState())
    val state: StateFlow<QrCheckInState> = _state.asStateFlow()

    /** Called by the screen once it knows which booking is targeted. Re-running with
     *  the same booking (e.g. after status update) refreshes the QR availability. */
    fun bind(booking: Booking) {
        _state.update {
            it.copy(booking = booking, qr = generateQr(booking))
        }
    }

    fun openInfoDialog() {
        _state.update { it.copy(showInfoDialog = true) }
    }

    fun dismissInfoDialog() {
        _state.update { it.copy(showInfoDialog = false) }
    }

    fun completeCheckin() {
        val booking = _state.value.booking ?: return
        if (_state.value.isCheckingIn) return
        viewModelScope.launch {
            _state.update { it.copy(isCheckingIn = true, checkinError = null) }
            val result = checkinUseCase(booking.id)
            result.fold(
                onSuccess = {
                    val updatedBooking = booking.copy(
                        // Backend transitioned the reservation to "confirmed"; we
                        // additionally remember the self check-in act locally.
                        status = com.example.travelhub.domain.model.BookingStatus.CONFIRMED,
                        isCheckedIn = true
                    )
                    _state.update {
                        it.copy(
                            booking = updatedBooking,
                            qr = generateQr(updatedBooking),
                            isCheckingIn = false
                        )
                    }
                },
                onFailure = { e ->
                    _state.update {
                        it.copy(
                            isCheckingIn = false,
                            checkinError = UiText.fromExceptionOrFallback(e, R.string.error_checkin_failed)
                        )
                    }
                }
            )
        }
    }
}
