package com.example.travelhub.domain.model

/**
 * Generic page payload returned by repositories.
 *
 * - [items]: the rows for THIS page only.
 * - [total]: total count from the backend (null if the backend doesn't report it).
 * - [nextOffset]: the offset to ask for next time (`offset + items.size`).
 *
 * Consumers should call repositories with growing offsets and accumulate items in
 * a [com.example.travelhub.ui.state.PagedListState] until `total` is reached or
 * the next page comes back empty.
 */
data class PagedResult<T>(
    val items: List<T>,
    val total: Int?,
    val nextOffset: Int
) {
    companion object {
        fun <T> empty(): PagedResult<T> = PagedResult(emptyList(), 0, 0)
    }
}
