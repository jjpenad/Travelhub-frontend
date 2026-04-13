package com.example.travelhub.ui.screens.property

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.domain.model.Property
import com.example.travelhub.domain.repository.PropertyRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PropertyDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val propertyRepository: PropertyRepository
) : ViewModel() {

    val propertyId: String = savedStateHandle["propertyId"] ?: ""
    val checkIn: String = savedStateHandle["checkIn"] ?: ""
    val checkOut: String = savedStateHandle["checkOut"] ?: ""

    private val _property = MutableStateFlow<Property?>(null)
    val property: StateFlow<Property?> = _property.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        viewModelScope.launch {
            _isLoading.value = true
            _property.value = if (checkIn.isNotBlank() && checkOut.isNotBlank()) {
                // Load with availability (shows room types)
                propertyRepository.getAvailability(propertyId, checkIn, checkOut)
            } else {
                // Fallback to basic info
                propertyRepository.getById(propertyId)
            }
            _isLoading.value = false
        }
    }
}
