package com.example.travelhub.notifications

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.result.ActivityResultLauncher
import androidx.core.content.ContextCompat
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Implementación Android del [PostNotificationsPermissionGate]. El
 * `ActivityResultLauncher` viene del Activity (única vía oficial para
 * registrar `RequestPermission`), por eso se inyecta a posteriori vía
 * [bind] desde `MainActivity.onCreate` en lugar de pedirlo al constructor.
 *
 * Excluida del scope de unit tests (Kover) por su dependencia con el SDK
 * Android — se valida en device. La lógica testeable vive en el ViewModel,
 * que toma la interfaz pura.
 */
@Singleton
class AndroidPostNotificationsPermissionGate @Inject constructor(
    @ApplicationContext private val context: Context,
) : PostNotificationsPermissionGate {

    @Volatile
    private var launcher: ActivityResultLauncher<String>? = null

    @Volatile
    private var pendingCallback: ((PostNotificationsStatus) -> Unit)? = null

    /**
     * Vincula el launcher registrado en la activity con
     * `registerForActivityResult(RequestPermission()) { ... }`. Idempotente.
     */
    fun bind(activityLauncher: ActivityResultLauncher<String>) {
        launcher = activityLauncher
    }

    /**
     * El callback del launcher debe llamar a este método con el resultado
     * que reciba del sistema. Mantiene la simetría con [request] sin que
     * la activity necesite conocer los detalles del callback.
     */
    fun onPermissionResult(granted: Boolean) {
        val cb = pendingCallback
        pendingCallback = null
        cb?.invoke(
            if (granted) PostNotificationsStatus.Granted
            else PostNotificationsStatus.Denied,
        )
    }

    override fun status(): PostNotificationsStatus {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return PostNotificationsStatus.NotApplicable
        }
        val granted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
        return if (granted) PostNotificationsStatus.Granted
        else PostNotificationsStatus.NotRequested
    }

    override fun request(onResult: (PostNotificationsStatus) -> Unit) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            onResult(PostNotificationsStatus.NotApplicable)
            return
        }
        if (status() == PostNotificationsStatus.Granted) {
            onResult(PostNotificationsStatus.Granted)
            return
        }
        val l = launcher
        if (l == null) {
            // Si nadie llamó a `bind` (config bug), reportamos `Denied` para
            // que la UI no se quede colgada esperando un callback que nunca
            // va a llegar — mejor un negativo claro que un timeout silencioso.
            onResult(PostNotificationsStatus.Denied)
            return
        }
        pendingCallback = onResult
        l.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
}
