package com.example.travelhub.ui.util

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource

/**
 * UI-level wrapper for a piece of text that may come from a string resource
 * (localised) OR from a dynamic source like a backend exception message
 * (already in whatever language the server speaks).
 *
 * Why this exists: ViewModels live below the UI layer and don't hold a Context,
 * so they can't resolve string resources at the moment they construct an error
 * state. They produce a [UiText] instead, and the Compose layer resolves it via
 * [asString] when rendering.
 *
 * Usage from a ViewModel:
 * ```
 * _state.value = LoginUiState.Error(UiText.of(R.string.error_login_failed))
 * ```
 * From a screen:
 * ```
 * Text(state.text.asString())
 * ```
 *
 * For the common case "use the exception's message if it has one, otherwise
 * fall back to a localised resource", use [fromExceptionOrFallback].
 */
sealed class UiText {
    data class StringResource(
        @StringRes val resId: Int,
        val args: List<Any> = emptyList()
    ) : UiText()

    data class DynamicString(val value: String) : UiText()

    @Composable
    fun asString(): String = when (this) {
        is StringResource ->
            if (args.isEmpty()) stringResource(resId)
            else stringResource(resId, *args.toTypedArray())
        is DynamicString -> value
    }

    companion object {
        fun of(@StringRes resId: Int, vararg args: Any): UiText =
            StringResource(resId, args.toList())

        fun raw(value: String): UiText = DynamicString(value)

        /**
         * If the exception carries a non-blank message, use it verbatim; otherwise
         * fall back to the localised [fallbackRes]. The verbatim path covers the
         * "server-rendered error" case where the backend has already produced a
         * user-facing message and we don't want to overwrite it.
         */
        fun fromExceptionOrFallback(e: Throwable?, @StringRes fallbackRes: Int): UiText {
            val msg = e?.message
            return if (msg.isNullOrBlank()) StringResource(fallbackRes) else DynamicString(msg)
        }
    }
}
