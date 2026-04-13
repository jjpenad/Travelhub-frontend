package com.example.travelhub.data.repository

import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.mock.MockUsers
import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val userPreferences: UserPreferences
    // TODO(backend): Inject AuthApi here:
    //   private val authApi: AuthApi
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<UserSession> {
        // TODO(backend): Replace MockUsers with real API call:
        //   return try {
        //       val response = authApi.login(LoginRequest(email, password))
        //       val session = UserSession(
        //           userId = response.userId,
        //           email = response.email,
        //           fullName = response.fullName,
        //           token = response.token
        //       )
        //       userPreferences.saveSession(session)
        //       Result.success(session)
        //   } catch (e: HttpException) {
        //       Result.failure(Exception("Invalid credentials"))
        //   } catch (e: IOException) {
        //       Result.failure(Exception("Network error. Check your connection."))
        //   }
        val session = MockUsers.authenticate(email, password)
        return if (session != null) {
            userPreferences.saveSession(session)
            Result.success(session)
        } else {
            Result.failure(Exception("Invalid credentials"))
        }
    }

    override fun getSession(): Flow<UserSession?> = userPreferences.session

    override suspend fun saveSession(session: UserSession) {
        userPreferences.saveSession(session)
    }

    override suspend fun logout() {
        // TODO(backend): Call API to invalidate token on server side:
        //   try { authApi.logout(userPreferences.getToken()) } catch (_: Exception) {}
        userPreferences.clearSession()
    }
}
