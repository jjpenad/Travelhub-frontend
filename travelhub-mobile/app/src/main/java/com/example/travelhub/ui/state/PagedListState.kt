package com.example.travelhub.ui.state

/**
 * Reusable UI state for paginated lists in ViewModels.
 *
 * Lifecycle:
 *  1. ViewModel exposes a [kotlinx.coroutines.flow.MutableStateFlow] of this type.
 *  2. First load → set `isLoading = true`, replace `items` with first page on success.
 *  3. `loadMore()` → set `isLoadingMore = true`, append next page items.
 *  4. `refresh()` → set `isRefreshing = true`, replace items, reset `nextOffset`.
 *  5. [hasMore] becomes `false` when `total != null && items.size >= total`,
 *     or when the latest page returned 0 items (we set `total = items.size`).
 */
data class PagedListState<T>(
    val items: List<T> = emptyList(),
    val nextOffset: Int = 0,
    val pageSize: Int = 20,
    val total: Int? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null
) {
    val hasMore: Boolean
        get() = total?.let { items.size < it } ?: true
}
