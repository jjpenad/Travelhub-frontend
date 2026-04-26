package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.UserPreferences
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * Adds the X-Guest-Id header to every outgoing request.
 *
 * - If the user is signed in, the header carries the authenticated user_id so the
 *   backend's "OR user_id = X OR user_guest_id = X" listing query works regardless
 *   of which path the reservation took.
 * - Otherwise, fall back to whatever the [GuestSessionStore] has (which the backend
 *   itself issues via the `user_session` field on search/create responses).
 * - Empty header is acceptable on cold start; backend issues a fresh id on first hit.
 */
class GuestSessionInterceptor @Inject constructor(
    private val store: GuestSessionStore,
    private val userPreferences: UserPreferences
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val effectiveId = userPreferences.currentUserId()
            ?: store.currentId().orEmpty()
        val request = chain.request().newBuilder()
            .header(HEADER, effectiveId)
            .build()
        return chain.proceed(request)
    }

    companion object {
        const val HEADER = "X-Guest-Id"
    }
}
