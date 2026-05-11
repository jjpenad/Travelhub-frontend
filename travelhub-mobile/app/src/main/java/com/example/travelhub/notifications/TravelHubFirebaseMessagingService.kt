package com.example.travelhub.notifications

import android.app.NotificationManager
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.travelhub.BuildConfig
import com.example.travelhub.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Punto de entrada de FCM en el cliente. Dos responsabilidades:
 *
 * 1. **`onNewToken`** — el SDK lo llama tras instalar la app y cada vez
 *    que rota el token. Lo registramos contra el backend vía
 *    [DeviceTokenRepository]. Si el usuario aún no se ha logueado, el
 *    POST fallará con 401 — eso es esperado; el `MainActivity` re-disparará
 *    el registro tras el primer login (ver `AuthFlowEffect`).
 *
 * 2. **`onMessageReceived`** — payload de un push entrante. Si la app
 *    está en foreground el SDK NO postea automáticamente la notificación
 *    (a diferencia de cuando está en background); somos nosotros quienes
 *    debemos postearla. Lo hacemos siempre, sin importar el estado, para
 *    tener un único code path.
 *
 * Excluido del scope de Kover: depende del SDK Android + FCM, requiere
 * Robolectric / instrumented tests para ejercerse. La lógica testeable
 * (registro/cache, mapping de payload) vive en clases aparte.
 */
@AndroidEntryPoint
class TravelHubFirebaseMessagingService : FirebaseMessagingService() {

    @Inject lateinit var repository: DeviceTokenRepository

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        scope.launch {
            repository.register(
                token = token,
                platform = DeviceTokenRepository.PLATFORM_ANDROID,
                appVersion = BuildConfig.VERSION_NAME,
            )
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val payload = mapRemoteMessageToPayload(message) ?: return
        postLocalNotification(this, payload)
    }
}

/**
 * Shape interno de un push, normalizado tanto si el payload viene como
 * `notification` (campos `title`/`body`) o como `data` (mapa de strings).
 * El backend usa `data` para que el cliente decida cómo presentar el
 * push; los pushes con `notification` los maneja el SDK por nosotros
 * cuando la app está en background.
 */
internal data class IncomingNotificationPayload(
    val title: String,
    val body: String,
    val deepLink: String?,
    val category: String?,
)

/**
 * Mapea un [RemoteMessage] de FCM al shape interno. Devuelve `null` si
 * el payload no trae ni título ni cuerpo — no tenemos qué mostrar.
 *
 * Convenciones del backend (definidas en `service-external` cuando se
 * sume el adaptador FCM real):
 *   data["title"]      → texto destacado de la notificación
 *   data["body"]       → texto descriptivo
 *   data["deep_link"]  → ruta interna de la app (p. ej. `travelhub://trip/123`)
 *   data["category"]   → 'booking_confirmation' | 'check_in_reminder' | …
 */
internal fun mapRemoteMessageToPayload(message: RemoteMessage): IncomingNotificationPayload? {
    val notification = message.notification
    val data = message.data
    val title = notification?.title ?: data["title"] ?: return null
    val body = notification?.body ?: data["body"] ?: return null
    return IncomingNotificationPayload(
        title = title,
        body = body,
        deepLink = data["deep_link"],
        category = data["category"],
    )
}

/**
 * Postea una notificación local con el payload recibido. Crea el canal
 * si no existe (idempotente). No usamos [AndroidNotificationDispatcher]
 * directamente porque ese path está pensado para la notificación de
 * "prueba" iniciada por el usuario; este se dispara desde el system
 * service y construye su propio builder con los campos del push.
 */
internal fun postLocalNotification(
    context: Context,
    payload: IncomingNotificationPayload,
) {
    ensureChannel(context)
    val builder = NotificationCompat.Builder(context, AndroidNotificationDispatcher.CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(payload.title)
        .setContentText(payload.body)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setAutoCancel(true)
    try {
        NotificationManagerCompat.from(context).notify(
            payload.category?.hashCode() ?: AndroidNotificationDispatcher.NOTIF_ID_TEST,
            builder.build(),
        )
    } catch (_: SecurityException) {
        // Permiso revocado entre el `notify` y este punto — silencioso.
    }
}

private fun ensureChannel(context: Context) {
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.O) return
    val nm = context.getSystemService(NotificationManager::class.java) ?: return
    if (nm.getNotificationChannel(AndroidNotificationDispatcher.CHANNEL_ID) != null) return
    val channel = android.app.NotificationChannel(
        AndroidNotificationDispatcher.CHANNEL_ID,
        context.getString(R.string.notif_channel_general_name),
        NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
        description = context.getString(R.string.notif_channel_general_desc)
    }
    nm.createNotificationChannel(channel)
}
