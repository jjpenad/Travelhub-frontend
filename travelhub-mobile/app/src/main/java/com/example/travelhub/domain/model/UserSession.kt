package com.example.travelhub.domain.model

data class UserSession(
    val userId: String,
    val email: String,
    val fullName: String,
    val token: String = ""
)
