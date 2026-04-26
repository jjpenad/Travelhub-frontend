package com.example.travelhub

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import com.example.travelhub.ui.components.OfflineBanner
import com.example.travelhub.ui.navigation.BottomNavBar
import com.example.travelhub.ui.navigation.NavGraph
import com.example.travelhub.ui.navigation.Screen
import com.example.travelhub.ui.theme.TravelHubTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

// TODO(permissions): Request POST_NOTIFICATIONS permission on Android 13+.
//
// TODO(ui): Add a splash screen using the SplashScreen API while checking session validity.

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var connectivityObserver: ConnectivityObserver
    @Inject lateinit var networkErrorBus: NetworkErrorBus

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Tell the framework we will draw behind system bars and handle
        // insets ourselves. Required for Compose's `WindowInsets.ime` to
        // report the soft-keyboard height — without this, `Modifier.imePadding()`
        // is silently a no-op and scrollable forms can't reach fields hidden
        // behind the keyboard (E2E flows hit this on the SignUp screen).
        WindowCompat.setDecorFitsSystemWindows(window, false)
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
