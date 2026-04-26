package com.example.travelhub.ui.state

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PagedListStateTest {

    @Test
    fun `hasMore is true when total is unknown`() {
        val state = PagedListState<String>(items = listOf("a", "b"), total = null)
        assertTrue(state.hasMore)
    }

    @Test
    fun `hasMore is true when items size is below total`() {
        val state = PagedListState<String>(items = listOf("a"), total = 5)
        assertTrue(state.hasMore)
    }

    @Test
    fun `hasMore is false when items size equals total`() {
        val state = PagedListState<String>(items = listOf("a", "b"), total = 2)
        assertFalse(state.hasMore)
    }

    @Test
    fun `hasMore is false when items size exceeds total`() {
        val state = PagedListState<String>(items = listOf("a", "b", "c"), total = 2)
        assertFalse(state.hasMore)
    }

    @Test
    fun `default state is empty and not loading`() {
        val state = PagedListState<String>()
        assertTrue(state.items.isEmpty())
        assertTrue(state.hasMore) // total is null → unknown → assume more
        assertFalse(state.isLoading)
        assertFalse(state.isLoadingMore)
        assertFalse(state.isRefreshing)
    }
}
