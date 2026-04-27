package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.UserPreferences
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * Adds the `X-Guest-Id` header to every outgoing request.
 *
 * - When the user is signed in (a JWT is present), the header is sent as an
 *   EMPTY string. The Bearer token is the authoritative identity; the empty
 *   header keeps backend code paths happy (some endpoints treat absence and
 *   empty differently) without overriding the JWT.
 * - When anonymous, we send whatever the [GuestSessionStore] has (which the
 *   backend issues via the `user_session` field on search/create responses).
 * - An empty header is also acceptable on cold start; backend issues a fresh
 *   id on the first hit.
 */
class GuestSessionInterceptor @Inject constructor(
    private val store: GuestSessionStore,
    private val userPreferences: UserPreferences
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val headerValue = if (userPreferences.currentToken() != null) {
            // Authenticated: send empty so backend defers to the Bearer token.
            ""
        } else {
            store.currentId().orEmpty()
        }
        val request = chain.request().newBuilder()
            .header(HEADER, headerValue)
            .build()
        return chain.proceed(request)
    }

    companion object {
        const val HEADER = "X-Guest-Id"
    }
}
