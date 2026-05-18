package com.example.travelhub

import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import android.os.LocaleList
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.WindowCompat
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.travelhub.data.network.ConnectivityObserver
import com.example.travelhub.data.network.NetworkErrorBus
import com.example.travelhub.notifications.AndroidPostNotificationsPermissionGate
import com.example.travelhub.ui.components.OfflineBanner
import com.example.travelhub.ui.navigation.BottomNavBar
import com.example.travelhub.ui.navigation.NavGraph
import com.example.travelhub.ui.navigation.Screen
import com.example.travelhub.ui.theme.TravelHubTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

// TODO(ui): Add a splash screen using the SplashScreen API while checking session validity.

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var connectivityObserver: ConnectivityObserver
    @Inject lateinit var networkErrorBus: NetworkErrorBus
    @Inject lateinit var notificationsGate: AndroidPostNotificationsPermissionGate

    /**
     * Per-app locale plumbing for a Compose / ComponentActivity setup.
     *
     * Wraps the base Context with a `Configuration` carrying the active
     * locale. From that point on, every `getResources()` / `getString()`
     * call (including Compose's `stringResource`) reads from the right
     * values folder
     *
     * Source-of-truth priority:
     *
     *  1. **`AppCompatDelegate.getApplicationLocales()`** — catches changes
     *     made by the user from Android Settings → Apps → TravelHub →
     *     Language. The framework propagates those to AppCompat
     *     immediately and the value is reliable on every OEM.
     *
     *  2. **`UserPreferences.currentAuthLocale()`** — catches the in-app
     *     picker case on Samsung One UI 8 (Android 14+), which has a known
     *     race where `AppCompatDelegate.getApplicationLocales()` returns
     *     empty/stale for a few ms after `setApplicationLocales()`. Our
     *     picker writes to UserPreferences synchronously before triggering
     *     the Activity restart, so this fallback is race-free.
     *
     *  3. **No override** — let the system locale through.
     *
     * Without this override, switching the language inside the app appears
     * to do nothing — the activity restarts but loads the system locale's
     * resources anyway. This is the missing piece that the AndroidX docs
     * glide over for ComponentActivity-based projects.
     */
    override fun attachBaseContext(newBase: Context) {
        val systemTag = AppCompatDelegate.getApplicationLocales().toLanguageTags()
        val tag = if (systemTag.isNotBlank()) {
            systemTag
        } else {
            val app = newBase.applicationContext as? TravelHubApp
            app?.userPreferences?.currentAuthLocale().orEmpty()
        }
        if (tag.isBlank()) {
            super.attachBaseContext(newBase)
            return
        }
        val overrideConfig = Configuration(newBase.resources.configuration).apply {
            setLocales(LocaleList.forLanguageTags(tag))
        }
        super.attachBaseContext(newBase.createConfigurationContext(overrideConfig))
    }

    /**
     * Launcher para `POST_NOTIFICATIONS` (Android 13+). Lo registramos
     * temprano y lo bindeamos al gate; el ViewModel pide el permiso vía
     * el gate y este re-emite el resultado al callback registrado.
     */
    private val notificationsPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            notificationsGate.onPermissionResult(granted)
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Tell the framework we will draw behind system bars and handle
        // insets ourselves. Required for Compose's `WindowInsets.ime` to
        // report the soft-keyboard height — without this, `Modifier.imePadding()`
        // is silently a no-op and scrollable forms can't reach fields hidden
        // behind the keyboard (E2E flows hit this on the SignUp screen).
        WindowCompat.setDecorFitsSystemWindows(window, false)
        notificationsGate.bind(notificationsPermissionLauncher)
        setContent {
            TravelHubTheme {
                val navController = rememberNavController()
                val currentRoute by navController.currentBackStackEntryAsState()

                val tabRoutes = remember {
                    setOf(
                        Screen.Home.route,
                        Screen.Search.route,
                        Screen.MyTrips.route,
                        Screen.Profile.route
                    )
                }
                val showBottomBar by remember {
                    derivedStateOf {
                        currentRoute?.destination?.hierarchy?.any { it.route in tabRoutes } == true
                    }
                }

                val isOnline by connectivityObserver.observe()
                    .collectAsStateWithLifecycle(initialValue = true)

                val snackbarHostState = remember { SnackbarHostState() }

                // Surface transient errors emitted from anywhere in the app.
                LaunchedEffect(Unit) {
                    networkErrorBus.events.collect { message ->
                        snackbarHostState.showSnackbar(
                            message = message,
                            duration = SnackbarDuration.Short
                        )
                    }
                }

                Scaffold(
                    bottomBar = {
                        if (showBottomBar) {
                            BottomNavBar(navController)
                        }
                    },
                    snackbarHost = { SnackbarHost(snackbarHostState) }
                ) { innerPadding ->
                    Column(modifier = Modifier.padding(innerPadding)) {
                        OfflineBanner(visible = !isOnline)
                        NavGraph(
                            navController = navController,
                            modifier = Modifier
                        )
                    }
                }
            }
        }
    }
}
