package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.UserSession
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(email: String, password: String): Result<UserSession>
    fun getSession(): Flow<UserSession?>
    suspend fun saveSession(session: UserSession)
    suspend fun logout()
}
