package com.example.travelhub.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.travelhub.R
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementación Android del [NotificationDispatcher]. Crea el canal
 * `travelhub_general` la primera vez que se construye y delega el posteo
 * en [NotificationManagerCompat]. Si la app no tiene permiso devuelve
 * `false` para que la UI muestre un mensaje accionable al usuario.
 *
 * Excluida del scope de Kover por su dependencia con el SDK Android.
 */
@Singleton
class AndroidNotificationDispatcher @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gate: PostNotificationsPermissionGate,
) : NotificationDispatcher {

    init {
        ensureChannel()
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(NotificationManager::class.java) ?: return
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.notif_channel_general_name),
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = context.getString(R.string.notif_channel_general_desc)
        }
        nm.createNotificationChannel(channel)
    }

    override fun postTestNotification(): Boolean {
        val status = gate.status()
        if (status != PostNotificationsStatus.Granted &&
            status != PostNotificationsStatus.NotApplicable
        ) {
            return false
        }
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(context.getString(R.string.notif_test_title))
            .setContentText(context.getString(R.string.notif_test_body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
        return try {
            NotificationManagerCompat.from(context).notify(NOTIF_ID_TEST, builder.build())
            true
        } catch (_: SecurityException) {
            // Algunos OEMs revocan el permiso aún sin que ContextCompat lo refleje
            // inmediatamente. Tratamos la SecurityException como "no se posteó".
            false
        }
    }

    companion object {
        const val CHANNEL_ID = "travelhub_general"
        const val NOTIF_ID_TEST = 1001
    }
}
