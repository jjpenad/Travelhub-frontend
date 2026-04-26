package com.example.travelhub.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Lightweight VM for the Profile screen.
 *
 * Coexisting actions:
 * - [resetGuestSession] clears only the X-Guest-Id (anonymous identity).
 * - [logout] signs the user out (clears JWT + creds). Independent of guest reset.
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val guestSessionStore: GuestSessionStore,
    private val authRepository: AuthRepository
) : ViewModel() {

    val guestSessionId: StateFlow<String> = guestSessionStore.observe()
        .map { it.orEmpty() }
        .stateIn(viewModelScope, SharingStarted.Eagerly, guestSessionStore.currentId().orEmpty())

    val session: StateFlow<UserSession?> = authRepository.getSession()
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    fun resetGuestSession() {
        guestSessionStore.reset()
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }
}
