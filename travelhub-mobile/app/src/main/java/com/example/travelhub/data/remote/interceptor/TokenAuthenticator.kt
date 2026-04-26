package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.remote.api.AuthApi
import com.example.travelhub.data.remote.dto.LoginRequestDto
import com.example.travelhub.domain.model.UserSession
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import javax.inject.Inject
import javax.inject.Provider

/**
 * Silent re-login on 401.
 *
 * OkHttp calls this when a request comes back 401 Unauthorized. We try to refresh
 * the JWT using the email + password we stored at login time. If the refresh
 * succeeds, the original request is retried with the new Bearer; if it fails, we
 * wipe the session and let the 401 propagate — the UI (MyTrips, Profile) will
 * then show the "Sign in" empty state.
 *
 * `AuthApi` is wrapped in a `Provider` so Hilt can break the dependency cycle
 * between OkHttpClient and AuthApi (AuthApi → Retrofit → OkHttpClient → here).
 */
class TokenAuthenticator @Inject constructor(
    private val userPreferences: UserPreferences,
    private val authApiProvider: Provider<AuthApi>
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        // Don't loop forever: if the retried request also got 401, give up.
        if (responseCount(response) >= 2) return null

        // Skip the auth endpoints themselves.
        val path = response.request.url.encodedPath
        if (path.endsWith("/auth/login") || path.endsWith("/auth/register")) return null

        return runBlocking {
            val email = userPreferences.session.first()?.email?.takeIf { it.isNotBlank() }
                ?: return@runBlocking null
            val password = userPreferences.storedPassword()?.takeIf { it.isNotBlank() }
                ?: return@runBlocking null

            val newToken = runCatching {
                authApiProvider.get().login(LoginRequestDto(email, password)).accessToken
            }.getOrNull()

            if (newToken == null) {
                // Re-login failed — wipe so the UI surfaces the sign-in CTA.
                userPreferences.clearSession()
                return@runBlocking null
            }

            userPreferences.saveSession(
                UserSession(
                    userId = userPreferences.currentUserId().orEmpty(),
                    email = email,
                    fullName = "",
                    token = newToken
                ),
                password = password
            )

            response.request.newBuilder()
                .header("Authorization", "Bearer $newToken")
                .build()
        }
    }

    private fun responseCount(response: Response): Int {
        var count = 1
        var prior = response.priorResponse
        while (prior != null) {
            count++
            prior = prior.priorResponse
        }
        return count
    }
}
