package com.example.travelhub.ui.screens.booking

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.remote.dto.ConfirmReservationRequestDto
import com.example.travelhub.data.remote.dto.CreateReservationRequest
import com.example.travelhub.data.remote.dto.PaymentDetailDto
import com.example.travelhub.data.remote.dto.PaymentRequestDto
import com.example.travelhub.data.remote.dto.PrimaryGuestDto
import com.example.travelhub.data.remote.dto.PrimaryGuestPaymentDto
import com.example.travelhub.data.repository.EmailAlreadyExistsException
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.domain.repository.AuthRepository
import com.example.travelhub.domain.repository.BookingRepository
import com.example.travelhub.domain.repository.PropertyRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
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

/**
 * Form fields collected from the BookingPaymentScreen. The booking flow is split
 * into "always-required" personal/payment info (collected for primary_guest) plus
 * an OPTIONAL account-creation block (email + password). If the user opts in,
 * we register/login before booking so MyTrips works for them; if not, the booking
 * still succeeds anonymously via X-Guest-Id.
 */
data class BookingFormState(
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val documentNumber: String = "",
    val nationality: String = "COL",
    val cardNumber: String = "",
    // Optional account creation
    val createAccount: Boolean = false,
    val password: String = "",
    val emailExistsPrompt: Boolean = false  // shown when register returns 409
)

@HiltViewModel
class BookingViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val propertyRepository: PropertyRepository,
    private val bookingRepository: BookingRepository,
    private val authRepository: AuthRepository,
    private val guestSessionStore: GuestSessionStore
) : ViewModel() {

    private val propertyId: String = savedStateHandle["propertyId"] ?: ""
    private val roomId: String = savedStateHandle["roomId"] ?: ""
    private val checkIn: String = savedStateHandle["checkIn"] ?: ""
    private val checkOut: String = savedStateHandle["checkOut"] ?: ""

    private val _uiState = MutableStateFlow<BookingUiState>(BookingUiState.Loading)
    val uiState: StateFlow<BookingUiState> = _uiState.asStateFlow()

    private val _form = MutableStateFlow(BookingFormState())
    val form: StateFlow<BookingFormState> = _form.asStateFlow()

    /** True when the user is signed in. Drives read-only form fields + hides the
     *  "Create an account" toggle in BookingPaymentScreen. */
    val isAuthenticated: StateFlow<Boolean> = authRepository.getSession()
        .map { it?.token?.isNotBlank() == true }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    init {
        // Pre-fill the form with the signed-in user's details (if any). The screen
        // renders these fields disabled so the user can't change them — those are
        // their canonical account details.
        viewModelScope.launch {
            val session = authRepository.getSession().first()
            if (session != null && session.token.isNotBlank()) {
                val (first, last) = splitFullName(session.fullName, session.email)
                _form.update {
                    it.copy(
                        firstName = first,
                        lastName = last,
                        email = session.email
                    )
                }
            }
        }
        viewModelScope.launch {
            val property = propertyRepository.getAvailability(propertyId, checkIn, checkOut)
            if (property != null) {
                val selectedRoom = property.rooms.find { it.id == roomId }
                    ?: property.rooms.firstOrNull()
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

    // ── Form mutators ──────────────────────────────────────────────────────

    fun onFirstNameChange(v: String) = _form.update { it.copy(firstName = v) }
    fun onLastNameChange(v: String) = _form.update { it.copy(lastName = v) }
    fun onEmailChange(v: String) = _form.update {
        it.copy(email = v.trim(), emailExistsPrompt = false)
    }
    fun onDocumentNumberChange(v: String) = _form.update { it.copy(documentNumber = v) }
    fun onNationalityChange(v: String) = _form.update { it.copy(nationality = v) }
    fun onCardNumberChange(v: String) = _form.update { it.copy(cardNumber = v) }
    fun onCreateAccountToggle(v: Boolean) = _form.update {
        it.copy(createAccount = v, emailExistsPrompt = false)
    }
    fun onPasswordChange(v: String) = _form.update { it.copy(password = v) }

    /** Used when the email-exists dialog shows: try login with the same password. */
    fun onSignInWithExistingAccount() {
        val s = _form.value
        viewModelScope.launch {
            _uiState.value = BookingUiState.Processing
            authRepository.login(s.email, s.password).fold(
                onSuccess = { confirmAndPay() },
                onFailure = { e ->
                    _form.update { it.copy(emailExistsPrompt = false) }
                    _uiState.value = BookingUiState.Error(
                        e.message ?: "Could not sign in with that email"
                    )
                }
            )
        }
    }

    fun onSignInPromptDismiss() {
        _form.update { it.copy(emailExistsPrompt = false) }
        // Restore previous Summary state (Processing was set when register failed).
        // The init Summary is the source of truth — if it's not there anymore the
        // user navigated away, nothing to do.
    }

    // ── Submit ─────────────────────────────────────────────────────────────

    fun confirmAndPay() {
        val currentState = _uiState.value as? BookingUiState.Summary
            ?: (_uiState.value as? BookingUiState.Processing)?.let {
                // Already processing — ignore re-entry.
                return
            } ?: return
        val s = _form.value

        if (s.firstName.isBlank() || s.lastName.isBlank() || s.email.isBlank()) {
            _uiState.value = BookingUiState.Error("First name, last name and email are required")
            return
        }
        if (s.createAccount && s.password.length < 6) {
            _uiState.value = BookingUiState.Error("Password must be at least 6 characters")
            return
        }

        viewModelScope.launch {
            _uiState.value = BookingUiState.Processing

            // Step 0: optional account creation. If it fails with 409, surface a
            // prompt so the user can offer to sign in with their existing account.
            if (s.createAccount) {
                val regResult = authRepository.register(
                    email = s.email,
                    password = s.password,
                    firstName = s.firstName,
                    lastName = s.lastName
                )
                if (regResult.isFailure) {
                    val ex = regResult.exceptionOrNull()
                    if (ex is EmailAlreadyExistsException) {
                        _form.update { it.copy(emailExistsPrompt = true) }
                        _uiState.value = currentState
                        return@launch
                    }
                    _uiState.value = BookingUiState.Error(
                        ex?.message ?: "Could not create account"
                    )
                    return@launch
                }
            }

            // Step 1: create reservation (works anonymous via X-Guest-Id, or
            // authenticated if we just registered/logged in).
            val summary = currentState
            val createRequest = CreateReservationRequest(
                hotelId = propertyId,
                roomTypeId = summary.selectedRoom.id,
                checkIn = summary.checkIn,
                checkOut = summary.checkOut,
                guests = 2,
                basePrice = String.format("%.2f", summary.selectedRoom.price * summary.nights),
                taxes = "0.00",
                discounts = "0.00",
                totalPrice = String.format("%.2f", summary.totalPrice),
                currencyCode = summary.selectedRoom.currencyCode,
                primaryGuest = PrimaryGuestDto(
                    firstName = s.firstName,
                    lastName = s.lastName
                ),
                payment = PaymentRequestDto(
                    amount = String.format("%.2f", summary.totalPrice)
                )
            )
            val createResult = bookingRepository.createReservation(createRequest)
            createResult.fold(
                onSuccess = { response ->
                    val reservationId = response.result.reservationId
                        ?: response.result.reservation?.id
                        ?: response.result.confirmationCode
                        ?: run {
                            _uiState.value = BookingUiState.Error(
                                "Reservation created but server did not return an id"
                            )
                            return@launch
                        }
                    val confirmationCode = response.result.confirmationCode ?: ""

                    // Step 2: confirm payment with primary_guest details (email is the
                    // crucial bit so the backend can associate it to the reservation).
                    val paymentRequest = ConfirmReservationRequestDto(
                        reservationId = reservationId,
                        primaryGuest = PrimaryGuestPaymentDto(
                            firstName = s.firstName,
                            lastName = s.lastName,
                            documentType = "CC",
                            documentNumber = s.documentNumber.ifBlank { null },
                            nationality = s.nationality.ifBlank { null },
                            email = s.email
                        ),
                        payment = PaymentDetailDto(
                            amount = String.format("%.2f", summary.totalPrice),
                            currencyCode = summary.selectedRoom.currencyCode,
                            paymentToken = "tok_visa_${s.cardNumber.filter { it.isDigit() }
                                .ifBlank { "4242424242424242" }}"
                        )
                    )
                    val payResult = bookingRepository.confirmReservationPayment(paymentRequest)
                    payResult.fold(
                        onSuccess = {
                            _uiState.value = BookingUiState.Confirmed(
                                bookingId = reservationId,
                                bookingRef = confirmationCode.ifBlank { reservationId },
                                property = summary.property,
                                totalPrice = summary.totalPrice
                            )
                        },
                        onFailure = { e ->
                            // Step 1 created the reservation but step 2 failed. The
                            // reservation exists server-side as pending; user can see
                            // it in My Trips (when authenticated) and try again.
                            _uiState.value = BookingUiState.Error(
                                "Reservation created but payment failed: ${e.message}"
                            )
                        }
                    )
                },
                onFailure = { e ->
                    _uiState.value = BookingUiState.Error(e.message ?: "Reservation failed")
                }
            )
        }
    }

    /**
     * Best-effort split of "John Doe" → ("John", "Doe"). If [fullName] is empty,
     * fall back to the local part of the email as the first name and leave last
     * empty — better than two blank fields.
     */
    private fun splitFullName(fullName: String, fallbackEmail: String): Pair<String, String> {
        val trimmed = fullName.trim()
        if (trimmed.isNotBlank()) {
            val parts = trimmed.split(" ", limit = 2)
            return parts[0] to (parts.getOrNull(1).orEmpty())
        }
        val emailLocal = fallbackEmail.substringBefore("@")
        return emailLocal to ""
    }
}
