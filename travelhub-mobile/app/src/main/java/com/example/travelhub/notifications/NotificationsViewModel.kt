package com.example.travelhub.notifications

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import javax.inject.Inject

/**
 * Estado visible en `ProfileSettingsScreen`. Se mantiene deliberadamente
 * pequeño: la UI sólo necesita saber el estado del permiso y si la última
 * prueba se posteó correctamente para mostrar feedback inline.
 */
data class NotificationsUiState(
    val status: PostNotificationsStatus = PostNotificationsStatus.NotRequested,
    val lastTestResult: TestResult = TestResult.Idle,
)

sealed interface TestResult {
    object Idle : TestResult
    object Sent : TestResult
    object PermissionMissing : TestResult
}

/**
 * Coordina el flujo de permisos y notificaciones locales para
 * `ProfileSettingsScreen`. Toma las dos interfaces puras
 * ([PostNotificationsPermissionGate], [NotificationDispatcher]) para que
 * todas las transiciones de estado sean cubrir desde JVM unit tests sin
 * necesidad de Robolectric.
 */
@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val gate: PostNotificationsPermissionGate,
    private val dispatcher: NotificationDispatcher,
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationsUiState(status = gate.status()))
    val uiState: StateFlow<NotificationsUiState> = _uiState.asStateFlow()

    /**
     * Re-lee el estado del permiso desde el gate. Lo llama la UI cuando la
     * pantalla recibe el foco — útil para reflejar cambios hechos desde
     * Ajustes del sistema sin reiniciar la app.
     */
    fun refresh() {
        _uiState.update { it.copy(status = gate.status()) }
    }

    /**
     * Lanza el diálogo nativo del sistema (vía el gate). Si el usuario
     * acepta o deniega, el estado se actualiza vía el callback.
     */
    fun requestPermission() {
        gate.request { result ->
            _uiState.update { it.copy(status = result) }
        }
    }

    /**
     * Postea una notificación local de prueba. Reporta a la UI vía
     * [TestResult] si se envió o si falló por falta de permiso, para que
     * el usuario pueda corregirlo desde Ajustes.
     */
    fun sendTestNotification() {
        val sent = dispatcher.postTestNotification()
        _uiState.update {
            it.copy(
                lastTestResult = if (sent) TestResult.Sent else TestResult.PermissionMissing,
            )
        }
    }

    /**
     * Limpia el feedback de la última prueba. La UI lo llama después de
     * mostrar el snackbar para que no se vuelva a renderizar al
     * recomponer.
     */
    fun acknowledgeTestResult() {
        _uiState.update { it.copy(lastTestResult = TestResult.Idle) }
    }
}
