package com.example.travelhub.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver

/**
 * Runs [block] every time the surrounding screen is resumed (i.e. becomes the
 * top-of-stack and visible).
 *
 * Compose Navigation does NOT recreate composables when the user navigates back
 * to a destination that was suspended in the back stack — so `LaunchedEffect(Unit)`
 * fires only once. This effect listens to `Lifecycle.Event.ON_RESUME` and re-fires
 * on each return, which is what we want for "auto-refresh when re-entering".
 *
 * Compatible with `lifecycle-runtime-compose:2.6` (no LifecycleEventEffect there).
 */
@Composable
fun OnResumeEffect(block: () -> Unit) {
    val owner = LocalLifecycleOwner.current
    val callback by rememberUpdatedState(newValue = block)
    DisposableEffect(owner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) callback()
        }
        owner.lifecycle.addObserver(observer)
        onDispose { owner.lifecycle.removeObserver(observer) }
    }
}
