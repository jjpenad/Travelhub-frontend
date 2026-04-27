package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.UserPreferences
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * Adds `Authorization: Bearer <jwt>` when the user is signed in.
 *
 * Anonymous browsing keeps working — we only add the header when there's a token.
 * Skips the auth endpoints themselves so we don't send a stale token while
 * registering or re-logging in.
 */
class AuthInterceptor @Inject constructor(
    private val userPreferences: UserPreferences
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val path = original.url.encodedPath

        // Don't attach a Bearer when hitting auth endpoints — register and login
        // shouldn't carry a stale token (and the backend would reject it anyway).
        val skip = path.endsWith("/auth/login") || path.endsWith("/auth/register")

        val token = if (!skip) userPreferences.currentToken() else null
        val request = if (token != null) {
            original.newBuilder().header("Authorization", "Bearer $token").build()
        } else {
            original
        }
        return chain.proceed(request)
    }
}
