package com.example.travelhub.data.remote.dto

/**
 * Body de POST /service-core/users/me/device-tokens.
 * El user_id se deriva del Bearer en el backend, no se envía en el body.
 */
data class RegisterDeviceTokenRequest(
    val token: String,
    val platform: String,
    val app_version: String?,
)

/**
 * Body de DELETE /service-core/users/me/device-tokens.
 * Borrar selectivamente este token (logout local de este device).
 */
data class DeleteDeviceTokenRequest(
    val token: String,
)

/**
 * Response 201 del registro. Usado solo para detectar éxito y para
 * loggear; la UI no lo consume.
 */
data class DeviceTokenResponse(
    val id: String,
    val user_id: String,
    val platform: String,
    val app_version: String?,
    val last_seen_at: String,
    val created_at: String,
)
