package com.example.travelhub.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.data.local.GuestSessionStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

/**
 * Lightweight VM that exposes the current guest session id and lets the user reset it
 * from the Profile screen. The reset triggers the next request to be sent with an
 * empty `X-Guest-Id`, prompting the backend to issue a brand new id.
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val guestSessionStore: GuestSessionStore
) : ViewModel() {

    val guestSessionId: StateFlow<String> = guestSessionStore.observe()
        .map { it.orEmpty() }
        .stateIn(viewModelScope, SharingStarted.Eagerly, guestSessionStore.currentId().orEmpty())

    fun resetGuestSession() {
        guestSessionStore.reset()
    }
}
