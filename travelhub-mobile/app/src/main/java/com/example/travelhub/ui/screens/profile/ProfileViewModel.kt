package com.example.travelhub.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.LocaleManager
import com.example.travelhub.data.local.UserPreferences
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
    private val authRepository: AuthRepository,
    private val userPreferences: UserPreferences,
    private val localeManager: LocaleManager
) : ViewModel() {

    val guestSessionId: StateFlow<String> = guestSessionStore.observe()
        .map { it.orEmpty() }
        .stateIn(viewModelScope, SharingStarted.Eagerly, guestSessionStore.currentId().orEmpty())

    val session: StateFlow<UserSession?> = authRepository.getSession()
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    /** BCP-47 tag of the user-chosen locale, empty string for "follow system".
     *  Drives the value shown next to the Language row and the selected radio
     *  in the language picker. */
    val selectedLocale: StateFlow<String> = userPreferences.authLocale
        .stateIn(viewModelScope, SharingStarted.Eagerly, userPreferences.currentAuthLocale())

    fun resetGuestSession() {
        guestSessionStore.reset()
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }

    /** Set the app locale.
     *
     *  Apply happens synchronously so the screen can immediately call
     *  `activity.recreate()` to pick up the new resources — necessary because
     *  MainActivity extends ComponentActivity (not AppCompatActivity), so
     *  AppCompatDelegate cannot auto-recreate it on its own. Persistence
     *  happens in the background; the user-perceived flip is zero-latency. */
    fun setLocale(tag: String) {
        localeManager.apply(tag)
        viewModelScope.launch { localeManager.persist(tag) }
    }
}
