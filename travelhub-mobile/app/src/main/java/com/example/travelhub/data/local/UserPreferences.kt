package com.example.travelhub.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.example.travelhub.domain.model.UserSession
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_EMAIL = stringPreferencesKey("email")
        private val KEY_FULL_NAME = stringPreferencesKey("full_name")
        private val KEY_TOKEN = stringPreferencesKey("token")
    }

    val session: Flow<UserSession?> = dataStore.data.map { prefs ->
        val userId = prefs[KEY_USER_ID] ?: return@map null
        UserSession(
            userId = userId,
            email = prefs[KEY_EMAIL] ?: "",
            fullName = prefs[KEY_FULL_NAME] ?: "",
            token = prefs[KEY_TOKEN] ?: ""
        )
    }

    suspend fun saveSession(session: UserSession) {
        dataStore.edit { prefs ->
            prefs[KEY_USER_ID] = session.userId
            prefs[KEY_EMAIL] = session.email
            prefs[KEY_FULL_NAME] = session.fullName
            prefs[KEY_TOKEN] = session.token
        }
    }

    suspend fun clearSession() {
        dataStore.edit { it.clear() }
    }
}
