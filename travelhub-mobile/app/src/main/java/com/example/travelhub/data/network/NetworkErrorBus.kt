package com.example.travelhub.data.network

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * One-way bus for transient network/HTTP errors.
 *
 * Repositories or interceptors emit; the app shell observes and shows a Snackbar.
 * Configured as drop-oldest so a burst of failures doesn't queue forever.
 */
@Singleton
class NetworkErrorBus @Inject constructor() {
    private val _events = MutableSharedFlow<String>(
        extraBufferCapacity = 4,
        onBufferOverflow = BufferOverflow.DROP_OLDEST
    )
    val events: SharedFlow<String> = _events.asSharedFlow()

    fun emit(message: String) {
        if (message.isNotBlank()) _events.tryEmit(message)
    }
}
