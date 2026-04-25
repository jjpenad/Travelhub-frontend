package com.example.travelhub.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.util.UUID
import java.util.concurrent.atomic.AtomicReference
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Persists and exposes the guest session id used in the X-Guest-Id header.
 *
 * - The id is persisted in DataStore (survives process death).
 * - A mirror in [AtomicReference] lets the OkHttp interceptor read it
 *   synchronously without blocking on DataStore.
 * - Policy: latest backend `user_session` wins (always overwrite).
 *
 * Lifecycle:
 * - On app start, [preload] hydrates the in-memory mirror from DataStore.
 * - On every successful response that contains `user_session`, repositories
 *   call [update] with the latest value.
 * - [reset] clears both the persisted and in-memory id (used from Profile).
 */
@Singleton
class GuestSessionStore @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    /** Visible to tests so they can substitute a [kotlinx.coroutines.test.TestScope]. */
    internal var scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val cached = AtomicReference<String?>(null)

    /** Synchronous read for the OkHttp interceptor. Returns null if not yet hydrated. */
    fun currentId(): String? = cached.get()

    /** Reactive stream — useful for debug/UI. */
    fun observe(): Flow<String?> = dataStore.data.map { it[KEY] }

    /** Hydrate the in-memory mirror from DataStore. Idempotent. Call once on app start. */
    fun preload() {
        scope.launch {
            val stored = dataStore.data.first()[KEY]
            if (!stored.isNullOrBlank()) cached.compareAndSet(null, stored)
        }
    }

    /** Persist a new guest session id. Called by repositories when a response carries one. */
    fun update(id: String) {
        if (id.isBlank()) return
        cached.set(id)
        scope.launch {
            dataStore.edit { it[KEY] = id }
        }
    }

    /** Clear the persisted id. The next request goes out with an empty header so the
     *  backend issues a brand new one. */
    fun reset() {
        cached.set(null)
        scope.launch {
            dataStore.edit { it.remove(KEY) }
        }
    }

    /** Convenience for tests / future flows that need a client-side fallback. Not used today. */
    @Suppress("unused")
    fun newRandomId(): String = UUID.randomUUID().toString()

    companion object {
        private val KEY = stringPreferencesKey("guest_session_id")
    }
}
