package com.example.travelhub.notifications

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Tests del [NotificationsViewModel]. Usamos fakes inline en lugar de
 * MockK para ser explícitos sobre las transiciones del gate (síncrono +
 * asíncrono via callback). Cada caso fija el gate y el dispatcher antes
 * de instanciar el VM, igual que en `BookingViewModelTest`.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class NotificationsViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var gate: FakePermissionGate
    private lateinit var dispatcher: FakeNotificationDispatcher

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        gate = FakePermissionGate()
        dispatcher = FakeNotificationDispatcher()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createVm(): NotificationsViewModel =
        NotificationsViewModel(gate, dispatcher)

    @Test
    fun `initial state mirrors the gate's current status`() = runTest {
        gate.currentStatus = PostNotificationsStatus.Granted
        val vm = createVm()
        assertEquals(PostNotificationsStatus.Granted, vm.uiState.value.status)
        assertSame(TestResult.Idle, vm.uiState.value.lastTestResult)
    }

    @Test
    fun `initial state is NotRequested when the gate has not been answered yet`() = runTest {
        gate.currentStatus = PostNotificationsStatus.NotRequested
        val vm = createVm()
        assertEquals(PostNotificationsStatus.NotRequested, vm.uiState.value.status)
    }

    @Test
    fun `initial state is NotApplicable on Android less than 13`() = runTest {
        gate.currentStatus = PostNotificationsStatus.NotApplicable
        val vm = createVm()
        assertEquals(PostNotificationsStatus.NotApplicable, vm.uiState.value.status)
    }

    @Test
    fun `requestPermission updates state to Granted when the user accepts`() = runTest {
        gate.currentStatus = PostNotificationsStatus.NotRequested
        val vm = createVm()

        gate.nextRequestResult = PostNotificationsStatus.Granted
        vm.requestPermission()

        assertEquals(PostNotificationsStatus.Granted, vm.uiState.value.status)
        assertEquals(1, gate.requestInvocations)
    }

    @Test
    fun `requestPermission updates state to Denied when the user rejects`() = runTest {
        gate.currentStatus = PostNotificationsStatus.NotRequested
        val vm = createVm()

        gate.nextRequestResult = PostNotificationsStatus.Denied
        vm.requestPermission()

        assertEquals(PostNotificationsStatus.Denied, vm.uiState.value.status)
    }

    @Test
    fun `sendTestNotification reports Sent when the dispatcher posts successfully`() = runTest {
        gate.currentStatus = PostNotificationsStatus.Granted
        val vm = createVm()

        dispatcher.shouldSucceed = true
        vm.sendTestNotification()

        assertEquals(1, dispatcher.callCount)
        assertSame(TestResult.Sent, vm.uiState.value.lastTestResult)
    }

    @Test
    fun `sendTestNotification reports PermissionMissing when the dispatcher refuses`() = runTest {
        gate.currentStatus = PostNotificationsStatus.Denied
        val vm = createVm()

        dispatcher.shouldSucceed = false
        vm.sendTestNotification()

        assertSame(TestResult.PermissionMissing, vm.uiState.value.lastTestResult)
    }

    @Test
    fun `acknowledgeTestResult clears the last test feedback`() = runTest {
        gate.currentStatus = PostNotificationsStatus.Granted
        val vm = createVm()

        dispatcher.shouldSucceed = true
        vm.sendTestNotification()
        assertSame(TestResult.Sent, vm.uiState.value.lastTestResult)

        vm.acknowledgeTestResult()
        assertSame(TestResult.Idle, vm.uiState.value.lastTestResult)
    }

    @Test
    fun `refresh re-reads the gate so changes from system Settings propagate`() = runTest {
        gate.currentStatus = PostNotificationsStatus.Denied
        val vm = createVm()
        assertEquals(PostNotificationsStatus.Denied, vm.uiState.value.status)

        // User went to Settings and granted the permission manually.
        gate.currentStatus = PostNotificationsStatus.Granted
        vm.refresh()

        assertEquals(PostNotificationsStatus.Granted, vm.uiState.value.status)
    }

    @Test
    fun `requestPermission does not corrupt the lastTestResult feedback`() = runTest {
        gate.currentStatus = PostNotificationsStatus.Granted
        val vm = createVm()
        dispatcher.shouldSucceed = true
        vm.sendTestNotification()
        assertSame(TestResult.Sent, vm.uiState.value.lastTestResult)

        // Re-request (e.g. user wants to change a setting). Permission state
        // updates but the previous test feedback shouldn't reset on its own —
        // it lives until acknowledgeTestResult is called.
        gate.nextRequestResult = PostNotificationsStatus.Granted
        vm.requestPermission()

        assertEquals(PostNotificationsStatus.Granted, vm.uiState.value.status)
        assertSame(TestResult.Sent, vm.uiState.value.lastTestResult)
    }

    @Test
    fun `dispatcher is never invoked from requestPermission`() = runTest {
        gate.currentStatus = PostNotificationsStatus.NotRequested
        val vm = createVm()

        gate.nextRequestResult = PostNotificationsStatus.Granted
        vm.requestPermission()

        assertEquals(0, dispatcher.callCount)
        assertFalse(vm.uiState.value.lastTestResult is TestResult.Sent)
    }

    // ── Fakes ────────────────────────────────────────────────────────

    private class FakePermissionGate : PostNotificationsPermissionGate {
        var currentStatus: PostNotificationsStatus = PostNotificationsStatus.NotRequested
        var nextRequestResult: PostNotificationsStatus = PostNotificationsStatus.Granted
        var requestInvocations: Int = 0

        override fun status(): PostNotificationsStatus = currentStatus

        override fun request(onResult: (PostNotificationsStatus) -> Unit) {
            requestInvocations += 1
            currentStatus = nextRequestResult
            onResult(nextRequestResult)
        }
    }

    private class FakeNotificationDispatcher : NotificationDispatcher {
        var shouldSucceed: Boolean = true
        var callCount: Int = 0

        override fun postTestNotification(): Boolean {
            callCount += 1
            return shouldSucceed
        }
    }
}
