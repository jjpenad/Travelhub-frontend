package com.example.travelhub.data.remote.api

import com.example.travelhub.data.remote.dto.LoginRequestDto
import com.example.travelhub.data.remote.dto.LoginResponseDto
import com.example.travelhub.data.remote.dto.RegisterRequestDto
import com.example.travelhub.data.remote.dto.RegisterResponseDto
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthApi {

    /** Returns 201 + user info; 409 if email already exists. */
    @POST("service-core/auth/register")
    suspend fun register(@Body request: RegisterRequestDto): RegisterResponseDto

    /** Returns access_token (JWT) + token_type + user_type; 401 on bad creds. */
    @POST("service-core/auth/login")
    suspend fun login(@Body request: LoginRequestDto): LoginResponseDto
}
