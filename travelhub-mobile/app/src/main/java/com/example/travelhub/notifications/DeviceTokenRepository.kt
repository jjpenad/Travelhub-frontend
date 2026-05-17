package com.example.travelhub.notifications

import com.example.travelhub.data.remote.api.DeviceTokenApi
import com.example.travelhub.data.remote.dto.DeleteDeviceTokenRequest
import com.example.travelhub.data.remote.dto.RegisterDeviceTokenRequest
import java.util.concurrent.atomic.AtomicReference
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Sincroniza el token FCM de este dispositivo con el backend (service-core).
 *
 * Diseño:
 *
 * - **register** es idempotente desde el lado del backend (UPSERT por
 *   `(user_id, token)`), pero acá guardamos el último token registrado
 *   con éxito en una variable in-memory para evitar spamear el endpoint
 *   cuando el sistema dispara `onNewToken` con el mismo valor varias
 *   veces (puede pasar al rotar la app entre cuentas).
 * - **unregister** se llama antes del logout, mientras todavía tenemos
 *   un JWT válido. Si falla (red, 401), no propagamos la excepción al
 *   caller — el logout local siempre debe completarse.
 * - El upper-layer (`FirebaseMessagingService`, `AuthRepository`) decide
 *   cuándo llamarnos. Esta clase no observa el ciclo de auth ella misma.
 */
interface DeviceTokenRepository {
    /**
     * Registra el token contra el backend. Si el token coincide con el
     * último registrado con éxito, no hace la llamada. Devuelve `true`
     * si se contactó al backend con éxito, `false` si falló o si se
     * deduplicó.
     */
    suspend fun register(
        token: String,
        platform: String = PLATFORM_ANDROID,
        appVersion: String? = null,
    ): Boolean

    /** Borra `token` del backend. Tolerante a fallos. */
    suspend fun unregister(token: String): Boolean

    /** Limpia el cache local. Llamar al hacer logout para que un futuro
     *  `register` (mismo token, otro user) sí dispare la llamada. */
    fun clearCache()

    companion object {
        const val PLATFORM_ANDROID = "android"
    }
}

@Singleton
class DeviceTokenRepositoryImpl @Inject constructor(
    private val api: DeviceTokenApi,
) : DeviceTokenRepository {

    private val lastRegistered = AtomicReference<String?>(null)

    override suspend fun register(
        token: String,
        platform: String,
        appVersion: String?,
    ): Boolean {
        if (token.isBlank()) return false
        // Dedupe: el mismo token ya fue registrado en esta sesión.
        if (lastRegistered.get() == token) return false
        return try {
            api.register(
                RegisterDeviceTokenRequest(
                    token = token,
                    platform = platform,
                    app_version = appVersion,
                ),
            )
            lastRegistered.set(token)
            true
        } catch (_: Exception) {
            // No propagamos: el push es nice-to-have, fallar acá no debe
            // romper el login. Quedará reintentar en el próximo arranque
            // cuando el SDK vuelva a emitir el token.
            false
        }
    }

    override suspend fun unregister(token: String): Boolean {
        if (token.isBlank()) return false
        return try {
            api.unregister(DeleteDeviceTokenRequest(token = token))
            if (lastRegistered.get() == token) lastRegistered.set(null)
            true
        } catch (_: Exception) {
            false
        }
    }

    override fun clearCache() {
        lastRegistered.set(null)
    }
}
