package com.example.travelhub.notifications

/**
 * Estado del permiso `POST_NOTIFICATIONS` desde el punto de vista de la UI.
 *
 * Sólo lo necesitamos en Android 13+; en versiones anteriores el sistema
 * concede el permiso automáticamente al instalar la app, por eso el caso
 * `NotApplicable` — la UI muestra un copy distinto en lugar del CTA de
 * "Enable" que solo tendría sentido en API 33+.
 */
enum class PostNotificationsStatus {
    Granted,
    Denied,
    NotRequested,
    NotApplicable,
}

/**
 * Wrap del API de permisos de Android para que el ViewModel sea testeable
 * sin Robolectric. La impl real ([AndroidPostNotificationsPermissionGate])
 * delega en `ContextCompat.checkSelfPermission` y en un
 * `ActivityResultLauncher`; los tests usan un fake que devuelve
 * directamente los estados.
 */
interface PostNotificationsPermissionGate {

    /** Lectura síncrona del estado actual del permiso. */
    fun status(): PostNotificationsStatus

    /**
     * Lanza el diálogo nativo del sistema para solicitar el permiso.
     * El resultado llega de forma asíncrona vía [onResult]. Si el permiso
     * ya está concedido o no aplica para esta versión de Android, [onResult]
     * se invoca síncronamente con el estado actual sin mostrar diálogo.
     */
    fun request(onResult: (PostNotificationsStatus) -> Unit)
}
