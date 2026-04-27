package com.example.travelhub.ui.components

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshotFlow
import kotlinx.coroutines.flow.distinctUntilChanged

/**
 * Triggers [onLoadMore] when the user scrolls within [threshold] items of the end
 * of the [listState]. Idempotent — the caller's loadMore() must guard against
 * concurrent calls (we only fire when the boolean transitions to true).
 */
@Composable
fun InfiniteScrollEffect(
    listState: LazyListState,
    threshold: Int = 5,
    enabled: Boolean = true,
    onLoadMore: () -> Unit
) {
    val shouldLoadMore by remember(listState, threshold, enabled) {
        derivedStateOf {
            if (!enabled) return@derivedStateOf false
            val total = listState.layoutInfo.totalItemsCount
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1
            total > 0 && lastVisible >= total - 1 - threshold
        }
    }

    LaunchedEffect(listState) {
        snapshotFlow { shouldLoadMore }
            .distinctUntilChanged()
            .collect { trigger -> if (trigger) onLoadMore() }
    }
}
