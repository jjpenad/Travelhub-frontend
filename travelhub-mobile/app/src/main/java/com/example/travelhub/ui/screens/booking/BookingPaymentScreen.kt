package com.example.travelhub.ui.screens.booking

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.model.Room
import com.example.travelhub.ui.components.TravelHubButton
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
            onForm = viewModel,
            onConfirmPay = { viewModel.confirmAndPay() },
            onBack = onBack
        )
        is BookingUiState.Processing -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = Purple)
                Spacer(modifier = Modifier.height(16.dp))
                Text("Processing reservation...", color = TextSecondary)
            }
        }
        is BookingUiState.Error -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                Text("Error", fontWeight = FontWeight.Bold, color = RedAccent, style = MaterialTheme.typography.titleLarge)
                Text(state.message, color = TextSecondary, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                Spacer(modifier = Modifier.height(16.dp))
                TravelHubButton(text = "Go Back", onClick = onBack)
            }
        }
        else -> {}
    }

    if (form.emailExistsPrompt) {
        AlertDialog(
            onDismissRequest = viewModel::onSignInPromptDismiss,
            confirmButton = {
                TextButton(onClick = viewModel::onSignInWithExistingAccount) { Text("Sign in") }
            },
            dismissButton = {
                TextButton(onClick = viewModel::onSignInPromptDismiss) { Text("Use a different email") }
            },
            title = { Text("Account already exists") },
            text = {
                Text(
                    "An account with this email already exists. " +
                        "Sign in with the password you entered, or use a different email."
                )
            }
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
    onForm: BookingViewModel,
    onConfirmPay: () -> Unit,
    onBack: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        Box(modifier = Modifier.fillMaxWidth().background(Purple).padding(16.dp)) {
            Column {
                IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Back", tint = White) }
                Text(text = "Complete Booking", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = White, modifier = Modifier.padding(start = 8.dp))
            }
        }

        Column(modifier = Modifier.padding(16.dp)) {
            // Booking summary
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(2.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(property.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                    Text("${property.city}, ${property.country}", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                    Text("$checkIn → $checkOut · $nights nights", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Room: ${room.type}", fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodyMedium)
                    Text(
                        text = "Total: $${totalPrice.toInt()} ${room.currencyCode}",
                        color = Purple, fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Guest information (always required)
            Text("Guest Information", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
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
                        label = { Text("First name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.lastName,
                        onValueChange = onForm::onLastNameChange,
                        label = { Text("Last name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.email,
                        onValueChange = onForm::onEmailChange,
                        label = { Text("Email") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.documentNumber,
                        onValueChange = onForm::onDocumentNumberChange,
                        label = { Text("Document number (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = form.cardNumber,
                        onValueChange = onForm::onCardNumberChange,
                        label = { Text("Card number (mock)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Optional account creation
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
                            Text("Create an account", fontWeight = FontWeight.SemiBold)
                            Text(
                                "Track your trips across devices. Optional.",
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
                            label = { Text("Password") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
                        )
                        Text(
                            text = "Minimum 6 characters",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Price Breakdown
            Text("Price Breakdown", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
            Card(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = White), elevation = CardDefaults.cardElevation(1.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    PriceRow("$${room.price.toInt()} x $nights nights", "$${(room.price * nights).toInt()}")
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total", fontWeight = FontWeight.Bold)
                        Text("$${totalPrice.toInt()}", fontWeight = FontWeight.Bold, color = Purple)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            TravelHubButton(text = "Confirm & Pay  $${totalPrice.toInt()}", onClick = onConfirmPay)
            Row(modifier = Modifier.fillMaxWidth().padding(top = 12.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.Lock, null, tint = TextSecondary, modifier = Modifier.padding(end = 4.dp))
                Text(text = "Secured by 256-bit SSL encryption.", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
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
        Text("Booking screen preview not available here", modifier = Modifier.padding(24.dp))
    }
}
