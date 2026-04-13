package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.UserSession
import com.example.travelhub.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<UserSession> {
        if (email.isBlank() || password.isBlank()) {
            return Result.failure(Exception("Email and password are required"))
        }
        return authRepository.login(email, password)
    }
}
