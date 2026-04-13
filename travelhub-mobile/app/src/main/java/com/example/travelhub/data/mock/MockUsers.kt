package com.example.travelhub.data.mock

import com.example.travelhub.domain.model.UserSession

object MockUsers {
    private const val ADMIN_EMAIL = "admin"
    private const val ADMIN_PASSWORD = "admin"

    fun authenticate(email: String, password: String): UserSession? {
        return if (email == ADMIN_EMAIL && password == ADMIN_PASSWORD) {
            UserSession(
                userId = "user_001",
                email = "admin@travelhub.com",
                fullName = "Alejandra Pinzon",
                token = "mock_token_123"
            )
        } else null
    }
}
