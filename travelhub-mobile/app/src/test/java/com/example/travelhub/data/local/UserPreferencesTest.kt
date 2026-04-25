package com.example.travelhub.data.local

import androidx.datastore.preferences.core.stringPreferencesKey
import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.testing.FakePreferencesDataStore
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class UserPreferencesTest {

    private val keyUserId = stringPreferencesKey("user_id")
    private val keyEmail = stringPreferencesKey("email")
    private val keyFullName = stringPreferencesKey("full_name")
    private val keyToken = stringPreferencesKey("token")

    @Test
    fun `session emits null when no user is stored`() = runTest {
        val ds = FakePreferencesDataStore()
        val prefs = UserPreferences(ds)

        assertNull(prefs.session.first())
    }

    @Test
    fun `saveSession persists all fields and session emits the saved user`() = runTest {
        val ds = FakePreferencesDataStore()
        val prefs = UserPreferences(ds)
        val user = UserSession(
            userId = "u1", email = "alex@test.com",
            fullName = "Alex Doe", token = "tok-123"
        )

        prefs.saveSession(user)

        val emitted = prefs.session.first()
        assertEquals(user, emitted)
        // And the underlying DataStore contains each individual key.
        val backing = ds.data.first()
        assertEquals("u1", backing[keyUserId])
        assertEquals("alex@test.com", backing[keyEmail])
        assertEquals("Alex Doe", backing[keyFullName])
        assertEquals("tok-123", backing[keyToken])
    }

    @Test
    fun `session falls back to empty strings for missing optional fields`() = runTest {
        val ds = FakePreferencesDataStore()
        // Write only the userId — simulate a partial prior state.
        ds.updateData { prefs ->
            prefs.toMutablePreferences().apply { this[keyUserId] = "u-only" }
        }
        val prefs = UserPreferences(ds)

        val emitted = prefs.session.first()!!
        assertEquals("u-only", emitted.userId)
        assertEquals("", emitted.email)
        assertEquals("", emitted.fullName)
        assertEquals("", emitted.token)
    }

    @Test
    fun `clearSession removes everything and session goes back to null`() = runTest {
        val ds = FakePreferencesDataStore()
        val prefs = UserPreferences(ds)
        prefs.saveSession(UserSession("u1", "x", "Y", "t"))

        prefs.clearSession()

        assertNull(prefs.session.first())
    }
}
