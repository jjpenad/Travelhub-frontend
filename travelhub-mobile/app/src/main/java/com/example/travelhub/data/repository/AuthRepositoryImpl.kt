package com.example.travelhub.data.repository

import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.remote.api.AuthApi
import com.example.travelhub.data.remote.dto.LoginRequestDto
import com.example.travelhub.data.remote.dto.RegisterRequestDto
import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Real backend-backed auth.
 *
 * - [login] authenticates against `POST /auth/login`, persists the JWT and the user's
 *   public info, and the password so we can silently re-login on JWT expiration.
 * - [register] hits `POST /auth/register`. Account creation is optional in the app —
 *   anonymous booking still works via X-Guest-Id.
 * - [logout] clears every stored credential plus the JWT.
 */
@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authApi: AuthApi,
    private val userPreferences: UserPreferences
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<UserSession> {
        return try {
            val response = authApi.login(LoginRequestDto(email = email, password = password))
            val userId = decodeJwtSubject(response.accessToken).orEmpty()
            val session = UserSession(
                userId = userId,
                email = email,
                fullName = "",
                token = response.accessToken
            )
            userPreferences.saveSession(session, password = password)
            Result.success(session)
        } catch (e: HttpException) {
            val message = when (e.code()) {
                401 -> "Invalid email or password"
                else -> "Login failed (${e.code()})"
            }
            Result.failure(Exception(message, e))
        } catch (e: Exception) {
            Result.failure(Exception("Network error. Check your connection.", e))
        }
    }

    /**
     * Register + login in one call. Returns the session with a fresh JWT.
     * Surfaces [EmailAlreadyExistsException] for the 409 path so the UI can
     * offer "Sign in instead?".
     */
    override suspend fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String
    ): Result<UserSession> {
        return try {
            authApi.register(
                RegisterRequestDto(
                    email = email,
                    password = password,
                    firstName = firstName,
                    lastName = lastName,
                    userType = "traveler"
                )
            )
            login(email, password).map { session ->
                val withName = session.copy(fullName = "$firstName $lastName")
                userPreferences.saveSession(withName, password = password)
                withName
            }
        } catch (e: HttpException) {
            when (e.code()) {
                409 -> Result.failure(EmailAlreadyExistsException(email))
                else -> Result.failure(Exception("Registration failed (${e.code()})", e))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error. Check your connection.", e))
        }
    }

    override fun getSession(): Flow<UserSession?> = userPreferences.session

    override suspend fun saveSession(session: UserSession) {
        userPreferences.saveSession(session)
    }

    override suspend fun logout() {
        userPreferences.clearSession()
    }

    /**
     * Best-effort JWT subject extraction. We don't validate the signature client-side
     * (the backend does that on each request); we just need the user id stored in `sub`.
     */
    private fun decodeJwtSubject(token: String): String? = runCatching {
        val payload = token.split(".").getOrNull(1) ?: return null
        val decoded = android.util.Base64.decode(
            payload,
            android.util.Base64.URL_SAFE or android.util.Base64.NO_WRAP or android.util.Base64.NO_PADDING
        )
        val json = String(decoded, Charsets.UTF_8)
        Regex("\"sub\"\\s*:\\s*\"([^\"]+)\"").find(json)?.groupValues?.get(1)
    }.getOrNull()
}

/** Marker exception so the booking UI can offer "Sign in instead?". */
class EmailAlreadyExistsException(val email: String) :
    Exception("Email '$email' is already registered")
