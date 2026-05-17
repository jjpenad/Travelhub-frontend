package com.example.travelhub.ui.screens.booking

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.R
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.ui.components.TravelHubButton
import com.example.travelhub.ui.util.formatIsoDateLocalized
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.RedAccent
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.TravelHubTheme
import com.example.travelhub.ui.theme.White

@Composable
fun BookingPaymentScreen(
    viewModel: BookingViewModel,
    onConfirmed: (bookingId: String, ref: String, hotel: String, city: String, total: String) -> Unit,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val form by viewModel.form.collectAsStateWithLifecycle()
    val isAuthenticated by viewModel.isAuthenticated.collectAsStateWithLifecycle()

    LaunchedEffect(uiState) {
        val confirmed = uiState as? BookingUiState.Confirmed ?: return@LaunchedEffect
        onConfirmed(
            confirmed.bookingId,
            confirmed.bookingRef,
            confirmed.property.name,
            confirmed.property.city,
            confirmed.totalPrice.toInt().toString()
        )
    }

    when (val state = uiState) {
        is BookingUiState.Loading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Purple)
        }
        is BookingUiState.Summary -> PaymentContent(
            property = state.property, room = state.selectedRoom,
            checkIn = state.checkIn, checkOut = state.checkOut,
            nights = state.nights, totalPrice = state.totalPrice,
            form = form,
            isAuthenticated = isAuthenticated,
            onForm = viewModel,
            onConfirmPay = { viewModel.confirmAndPay() },
            onBack = onBack
        )
        is BookingUiState.Processing -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Purple)
                Spacer(modifier = Modifier.height(16.dp))
                Text(stringResource(R.string.booking_processing), color = TextSecondary)
            }
        }
        is BookingUiState.Error -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                Text(stringResource(R.string.booking_error_title), fontWeight = FontWeight.Bold, color = RedAccent, style = MaterialTheme.typography.titleLarge)
                // UiText resolves against the active locale; server-provided messages
                // still pass through verbatim via UiText.DynamicString.
                Text(state.text.asString(), color = TextSecondary, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                Spacer(modifier = Modifier.height(16.dp))
                TravelHubButton(text = stringResource(R.string.booking_error_go_back), onClick = onBack)
            }
        }
        else -> {}
    }

    if (form.emailExistsPrompt) {
        AlertDialog(
            onDismissRequest = viewModel::onSignInPromptDismiss,
            confirmButton = {
                TextButton(onClick = viewModel::onSignInWithExistingAccount) {
                    Text(stringResource(R.string.action_sign_in))
                }
            },
            dismissButton = {
                TextButton(onClick = viewModel::onSignInPromptDismiss) {
                    Text(stringResource(R.string.action_use_different_email))
                }
            },
            title = { Text(stringResource(R.string.booking_email_exists_dialog_title)) },
            text = { Text(stringResource(R.string.booking_email_exists_dialog_text)) }
        )
    }
}

@Composable
private fun PaymentContent(
    property: Property,
    room: Room,
    checkIn: String,
    checkOut: String,
    nights: Int,
    totalPrice: Double,
    form: BookingFormState,
    isAuthenticated: Boolean,
    onForm: BookingViewModel,
    onConfirmPay: () -> Unit,
    onBack: () -> Unit
) {
    val focusManager = LocalFocusManager.current
    Column(
        modifier = Modifier.fillMaxSize()
            // Make the scrollable area exclude the soft keyboard so all
            // form fields (and the Confirm & Pay button) stay reachable
            // while typing. Combined with the tap-outside-to-clear-focus
            // handler below, this gives Maestro a reliable way to advance
            // through the form without fields getting trapped under the IME.
            .imePadding()
            .pointerInput(Unit) {
                detectTapGestures(onTap = { focusManager.clearFocus() })
            }
            .verticalScroll(rememberScrollState())
    ) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(16.dp)) {
            Column {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, stringResource(R.string.booking_back_cd), tint = White)
                }
                Text(text = stringResource(R.string.booking_title), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White, modifier = Modifier.padding(start = 8.dp))
            }
        }

        Column(modifier = Modifier.padding(16.dp)) {
            // Booking summary
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(2.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(property.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = stringResource(R.string.booking_summary_city_country, property.city, property.country),
                        color = TextSecondary,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        // checkIn / checkOut arrive as ISO strings via
                        // BookingUiState.Summary; we localise at render time
                        // so the user sees "1 may 2026" / "May 1, 2026"
                        // instead of the raw ISO.
                        text = stringResource(
                            R.string.booking_summary_dates,
                            formatIsoDateLocalized(checkIn),
                            formatIsoDateLocalized(checkOut),
                            nights
                        ),
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.booking_summary_room, room.type),
                        fontWeight = FontWeight.Medium,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = stringResource(R.string.booking_summary_total, totalPrice.toInt(), room.currencyCode),
                        color = Purple, fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Guest information. When the user is signed in, the personal fields
            // (name + email) come from the account and are NOT editable — those
            // are the canonical user details and live in the user profile.
            Text(
                text = if (isAuthenticated) stringResource(R.string.booking_guest_info_title_authenticated)
                else stringResource(R.string.booking_guest_info_title_anonymous),
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.titleMedium
            )
            Card(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = White),
                elevation = CardDefaults.cardElevation(1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    OutlinedTextField(
                        value = form.firstName,
                        onValueChange = onForm::onFirstNameChange,
                        label = { Text(stringResource(R.string.booking_field_first_name)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        readOnly = isAuthenticated,
                        enabled = !isAuthenticated
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.lastName,
                        onValueChange = onForm::onLastNameChange,
                        label = { Text(stringResource(R.string.booking_field_last_name)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        readOnly = isAuthenticated,
                        enabled = !isAuthenticated
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.email,
                        onValueChange = onForm::onEmailChange,
                        label = { Text(stringResource(R.string.booking_field_email)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        readOnly = isAuthenticated,
                        enabled = !isAuthenticated
                    )
                    if (isAuthenticated) {
                        Text(
                            text = stringResource(R.string.booking_authenticated_profile_hint),
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.documentNumber,
                        onValueChange = onForm::onDocumentNumberChange,
                        label = { Text(stringResource(R.string.booking_field_document_number)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.cardNumber,
                        onValueChange = onForm::onCardNumberChange,
                        label = { Text(stringResource(R.string.booking_field_card_number)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }
            }

            // Optional account creation — only relevant for anonymous users.
            if (!isAuthenticated) {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = White),
                    elevation = CardDefaults.cardElevation(1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(stringResource(R.string.booking_create_account_title), fontWeight = FontWeight.SemiBold)
                                Text(
                                    text = stringResource(R.string.booking_create_account_subtitle),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                            Switch(
                                checked = form.createAccount,
                                onCheckedChange = onForm::onCreateAccountToggle
                            )
                        }
                        if (form.createAccount) {
                            Spacer(modifier = Modifier.height(8.dp))
                            OutlinedTextField(
                                value = form.password,
                                onValueChange = onForm::onPasswordChange,
                                label = { Text(stringResource(R.string.booking_create_account_password_label)) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                visualTransformation = PasswordVisualTransformation(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                            )
                            Text(
                                text = stringResource(R.string.booking_create_account_password_hint),
                                style = MaterialTheme.typography.labelSmall,
                                color = TextSecondary,
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Price Breakdown
            Text(stringResource(R.string.booking_section_price_breakdown), fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
            Card(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(1.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    PriceRow(
                        label = stringResource(R.string.booking_price_per_night_breakdown, room.price.toInt(), nights),
                        amount = stringResource(R.string.booking_price_subtotal_value, (room.price * nights).toInt())
                    )
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(stringResource(R.string.booking_price_total_label), fontWeight = FontWeight.Bold)
                        Text(stringResource(R.string.booking_price_total_value, totalPrice.toInt()), fontWeight = FontWeight.Bold, color = Purple)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            TravelHubButton(text = stringResource(R.string.booking_confirm_pay_cta, totalPrice.toInt()), onClick = onConfirmPay)
            Row(modifier = Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Lock, null, tint = TextSecondary, modifier = Modifier.padding(end = 4.dp))
                Text(text = stringResource(R.string.booking_secure_payment_footer), style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun PriceRow(label: String, amount: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
        Text(amount, style = MaterialTheme.typography.bodyMedium)
    }
}

@Preview(showBackground = true, showSystemUi = true)
@Composable
private fun BookingPaymentScreenPreview() {
    TravelHubTheme {
        // Preview omitted to avoid having to instantiate a fake VM.
        Text(text = stringResource(R.string.booking_title), modifier = Modifier.padding(24.dp))
    }
}
