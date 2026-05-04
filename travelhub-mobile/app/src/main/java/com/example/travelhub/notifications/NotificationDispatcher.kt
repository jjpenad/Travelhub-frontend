package com.example.travelhub.notifications

/**
 * Postea notificaciones al sistema. Por ahora la única operación es enviar
 * una notificación local de prueba — útil para validar el flujo de permiso
 * end-to-end sin necesidad de un backend ni de FCM.
 *
 * Cuando se sume el HU de push remoto, esta misma interfaz se reutiliza:
 * el handler de mensajes FCM construye un payload y delega la publicación
 * a esta clase, así no duplicamos la lógica del canal ni del posting.
 */
interface NotificationDispatcher {

    /**
     * Postea una notificación local en el canal general.
     *
     * @return `true` si la notificación se envió, `false` si la app no
     * tiene permiso (en cuyo caso la UI debe avisar al usuario para que
     * habilite las notificaciones desde Ajustes).
     */
    fun postTestNotification(): Boolean
}
