package com.example.travelhub.notifications

import com.example.travelhub.BuildConfig
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

/**
 * Sincroniza el token FCM del dispositivo con el backend en momentos
 * clave del ciclo de auth: tras login/registro (con un JWT recién
 * obtenido) y antes de logout (mientras todavía tenemos JWT).
 *
 * Es deliberadamente "best-effort":
 *
 * - Si Firebase no está inicializado en runtime (caso típico cuando aún
 *   no hay `google-services.json` en `app/`), `FirebaseMessaging.getInstance()`
 *   lanza `IllegalStateException`. Lo capturamos y no hacemos nada — la
 *   app sigue funcionando sin push remoto.
 * - Si el backend rechaza el upsert (red, 401, 5xx), `DeviceTokenRepository`
 *   ya silencia la excepción; volveremos a intentar la próxima vez que el
 *   SDK rote el token (vía [TravelHubFirebaseMessagingService.onNewToken]).
 *
 * El upper-layer ([AuthRepositoryImpl]) lo llama y nunca propaga
 * excepciones desde acá.
 */
interface FcmTokenSync {
    /** Llamar tras `login`/`register` exitosos. */
    suspend fun syncOnLogin()
    /** Llamar antes de `clearSession()` — el JWT debe seguir vivo. */
    suspend fun syncOnLogout()
}

@Singleton
class FcmTokenSyncImpl @Inject constructor(
    private val repository: DeviceTokenRepository,
) : FcmTokenSync {

    override suspend fun syncOnLogin() {
        val token = fetchCurrentToken() ?: return
        repository.register(
            token = token,
            platform = DeviceTokenRepository.PLATFORM_ANDROID,
            appVersion = BuildConfig.VERSION_NAME,
        )
    }

    override suspend fun syncOnLogout() {
        val token = fetchCurrentToken()
        if (token != null) {
            repository.unregister(token)
        }
        // Vaciar el cache aunque no hayamos podido contactar al backend:
        // el siguiente login con otro user debe forzar un nuevo register.
        repository.clearCache()
    }

    /**
     * Lee el token cacheado por el SDK FCM. Devuelve `null` si:
     *   - Firebase no está inicializado (no hay `google-services.json`).
     *   - El SDK reporta un fallo (red, Google Play Services no presente).
     */
    private suspend fun fetchCurrentToken(): String? =
        suspendCancellableCoroutine { cont ->
            try {
                FirebaseMessaging.getInstance().token
                    .addOnSuccessListener { token ->
                        cont.resume(token?.takeIf { it.isNotBlank() })
                    }
                    .addOnFailureListener { _ ->
                        cont.resume(null)
                    }
            } catch (_: Throwable) {
                // FirebaseApp no inicializado o cualquier otro error de bootstrap.
                cont.resume(null)
            }
        }
}
