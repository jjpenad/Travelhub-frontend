package com.example.travelhub.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.example.travelhub.domain.model.UserSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicReference
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    /** Test override hook (same pattern as GuestSessionStore). */
    internal var scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /** In-memory mirror of the JWT for the OkHttp interceptor (sync read). */
    private val cachedToken = AtomicReference<String?>(null)
    /** In-memory mirror of the user id; used by the X-Guest-Id interceptor when
     *  the user is logged in so the same UUID is on both sides. */
    private val cachedUserId = AtomicReference<String?>(null)

    companion object {
        private val KEY_USER_ID = stringPreferencesKey("user_id")
        private val KEY_EMAIL = stringPreferencesKey("email")
        private val KEY_FULL_NAME = stringPreferencesKey("full_name")
        private val KEY_TOKEN = stringPreferencesKey("token")
        private val KEY_PASSWORD = stringPreferencesKey("password")
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

    /** Synchronous read for the OkHttp interceptor. Returns null if not signed in. */
    fun currentToken(): String? = cachedToken.get()?.takeIf { it.isNotBlank() }

    /** Synchronous read of the authenticated user id (or null if anonymous). */
    fun currentUserId(): String? = cachedUserId.get()?.takeIf { it.isNotBlank() }

    /** Hydrate the in-memory mirrors from disk. Idempotent. Call once on app start.
     *  If the persisted token doesn't look like a real JWT (3 dot-separated parts),
     *  we assume it was left over from older mock-based builds and wipe everything
     *  so the user starts clean. */
    fun preload() {
        scope.launch {
            val prefs = dataStore.data.first()
            val token = prefs[KEY_TOKEN]
            if (token != null && !looksLikeJwt(token)) {
                dataStore.edit { it.clear() }
                return@launch
            }
            cachedToken.compareAndSet(null, token)
            cachedUserId.compareAndSet(null, prefs[KEY_USER_ID])
        }
    }

    private fun looksLikeJwt(token: String): Boolean =
        token.count { it == '.' } == 2 && token.length >= 16

    suspend fun saveSession(session: UserSession, password: String? = null) {
        cachedToken.set(session.token)
        cachedUserId.set(session.userId)
        dataStore.edit { prefs ->
            prefs[KEY_USER_ID] = session.userId
            prefs[KEY_EMAIL] = session.email
            prefs[KEY_FULL_NAME] = session.fullName
            prefs[KEY_TOKEN] = session.token
            // Password is stored locally so we can silently re-login when the JWT
            // expires. Trade-off acknowledged — not for a production app, fine for
            // the academic project. Pass null to keep whatever's stored.
            password?.let { prefs[KEY_PASSWORD] = it }
        }
    }

    /** Used by silent re-login when JWT expires. Returns null if we never stored one. */
    suspend fun storedPassword(): String? = dataStore.data.first()[KEY_PASSWORD]

    suspend fun clearSession() {
        cachedToken.set(null)
        cachedUserId.set(null)
        dataStore.edit { it.clear() }
    }
}
