package com.example.travelhub.ui.screens.home

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

data class HomeUiState(
    val hotels: List<Property> = emptyList(),
    val isLoading: Boolean = true
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val propertyRepository: PropertyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        viewModelScope.launch {
            _uiState.value = HomeUiState(
                hotels = propertyRepository.getAll(),
                isLoading = false
            )
        }
    }
}
