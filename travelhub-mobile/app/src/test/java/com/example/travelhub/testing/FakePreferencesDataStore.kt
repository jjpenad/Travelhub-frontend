package com.example.travelhub.testing

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.emptyPreferences
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

/**
 * In-memory replacement for [DataStore<Preferences>]. Sufficient for unit tests of
 * components that only need read/write semantics on top of `Preferences`.
 */
class FakePreferencesDataStore(
    initial: Preferences = emptyPreferences()
) : DataStore<Preferences> {

    private val _data = MutableStateFlow(initial)
    override val data: Flow<Preferences> = _data

    override suspend fun updateData(
        transform: suspend (t: Preferences) -> Preferences
    ): Preferences {
        val updated = transform(_data.value)
        _data.value = updated
        return updated
    }
}
