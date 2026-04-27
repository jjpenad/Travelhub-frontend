package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.UserSession
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(email: String, password: String): Result<UserSession>

    /** Registers a new account and immediately logs in. Failure carries
     *  `EmailAlreadyExistsException` when the email is taken so the UI can offer
     *  "Sign in instead?". */
    suspend fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String
    ): Result<UserSession>

    fun getSession(): Flow<UserSession?>
    suspend fun saveSession(session: UserSession)
    suspend fun logout()
}
