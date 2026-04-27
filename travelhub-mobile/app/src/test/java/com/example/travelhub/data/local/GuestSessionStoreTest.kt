package com.example.travelhub.data.local

import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.example.travelhub.testing.FakePreferencesDataStore
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class GuestSessionStoreTest {

    private val key = stringPreferencesKey("guest_session_id")

    private fun newStore(scope: TestScope): Pair<GuestSessionStore, FakePreferencesDataStore> {
        val ds = FakePreferencesDataStore()
        val store = GuestSessionStore(ds).apply { this.scope = scope }
        return store to ds
    }

    @Test
    fun `currentId is null before any update or preload`() = runTest {
        val (store, _) = newStore(TestScope(StandardTestDispatcher(testScheduler)))

        assertNull(store.currentId())
    }

    @Test
    fun `update sets currentId synchronously`() = runTest {
        val (store, _) = newStore(TestScope(StandardTestDispatcher(testScheduler)))

        store.update("session-A")

        assertEquals("session-A", store.currentId())
    }

    @Test
    fun `update with blank id is ignored`() = runTest {
        val (store, _) = newStore(TestScope(StandardTestDispatcher(testScheduler)))
        store.update("session-A")

        store.update("")
        store.update("   ")

        assertEquals("session-A", store.currentId())
    }

    @Test
    fun `update persists to DataStore`() = runTest {
        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        val (store, ds) = newStore(testScope)

        store.update("session-XYZ")
        testScope.advanceUntilIdle()

        val persisted = ds.data.first()[key]
        assertEquals("session-XYZ", persisted)
    }

    @Test
    fun `latest update wins over the previous one`() = runTest {
        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        val (store, ds) = newStore(testScope)

        store.update("first")
        store.update("second")
        store.update("third")
        testScope.advanceUntilIdle()

        assertEquals("third", store.currentId())
        assertEquals("third", ds.data.first()[key])
    }

    @Test
    fun `reset clears in-memory id and removes from DataStore`() = runTest {
        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        val (store, ds) = newStore(testScope)
        store.update("session-A")
        testScope.advanceUntilIdle()

        store.reset()
        testScope.advanceUntilIdle()

        assertNull(store.currentId())
        assertNull(ds.data.first()[key])
    }

    @Test
    fun `preload hydrates currentId from DataStore`() = runTest {
        val ds = FakePreferencesDataStore()
        ds.updateData { prefs ->
            prefs.toMutablePreferences().apply { this[key] = "preloaded" }
        }
        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        val store = GuestSessionStore(ds).apply { this.scope = testScope }

        store.preload()
        testScope.advanceUntilIdle()

        assertEquals("preloaded", store.currentId())
    }

    @Test
    fun `preload does not overwrite a value already set in memory`() = runTest {
        val ds = FakePreferencesDataStore()
        ds.updateData { prefs ->
            prefs.toMutablePreferences().apply { this[key] = "stored-old" }
        }
        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        val store = GuestSessionStore(ds).apply { this.scope = testScope }
        store.update("in-memory-new")

        store.preload()
        testScope.advanceUntilIdle()

        assertEquals("in-memory-new", store.currentId())
    }

    @Test
    fun `newRandomId returns a non-blank UUID-like string`() {
        val ds = FakePreferencesDataStore()
        val store = GuestSessionStore(ds)

        val id1 = store.newRandomId()
        val id2 = store.newRandomId()

        // Two consecutive calls must produce distinct, non-blank ids.
        assertNotEquals(id1, id2)
        assertEquals(36, id1.length) // canonical UUID length with dashes
    }

    @Test
    fun `observe emits the current persisted value`() = runTest {
        val ds = FakePreferencesDataStore()
        val testScope = TestScope(StandardTestDispatcher(testScheduler))
        val store = GuestSessionStore(ds).apply { this.scope = testScope }

        store.update("emit-me")
        testScope.advanceUntilIdle()

        val collected = store.observe().first()
        assertEquals("emit-me", collected)
    }
}
