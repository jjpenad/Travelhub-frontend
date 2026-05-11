package com.example.travelhub.data.remote.api

import com.example.travelhub.data.remote.dto.DeleteDeviceTokenRequest
import com.example.travelhub.data.remote.dto.DeviceTokenResponse
import com.example.travelhub.data.remote.dto.RegisterDeviceTokenRequest
import retrofit2.http.Body
import retrofit2.http.HTTP
import retrofit2.http.POST

/**
 * Endpoints JWT-only para registrar y borrar el token FCM de este
 * dispositivo. El backend (service-core) deriva el user_id del Bearer.
 *
 * Mismo path que el router del backend: `/users/me/device-tokens`.
 *
 * Nota sobre DELETE con body: Retrofit por defecto no permite body en
 * DELETE. Usamos `@HTTP(method = "DELETE", hasBody = true)` para enviar
 * el token a borrar en el body — alineado con el contrato del backend.
 */
interface DeviceTokenApi {

    @POST("service-core/users/me/device-tokens")
    suspend fun register(
        @Body body: RegisterDeviceTokenRequest,
    ): DeviceTokenResponse

    @HTTP(
        method = "DELETE",
        path = "service-core/users/me/device-tokens",
        hasBody = true,
    )
    suspend fun unregister(
        @Body body: DeleteDeviceTokenRequest,
    )
}
