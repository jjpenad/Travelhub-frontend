package com.example.travelhub

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.travelhub.ui.navigation.BottomNavBar
import com.example.travelhub.ui.navigation.NavGraph
import com.example.travelhub.ui.navigation.Screen
import com.example.travelhub.ui.theme.TravelHubTheme
import dagger.hilt.android.AndroidEntryPoint

// TODO(permissions): Request POST_NOTIFICATIONS permission on Android 13+.
//   Add this in onCreate or a dedicated composable:
//   if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
//       val launcher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
//           // Handle granted/denied
//       }
//       launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
//   }
//
// TODO(backend): Check saved session on startup and navigate directly to Home if valid.
//   Currently always starts at Login. Use authRepository.getSession() to decide startDestination.
//
// TODO(ui): Add a splash screen using the SplashScreen API while checking session validity.

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TravelHubTheme {
                val navController = rememberNavController()
                val currentRoute by navController.currentBackStackEntryAsState()

                val showBottomBar by remember {
                    derivedStateOf {
                        val route = currentRoute?.destination?.route
                        route == Screen.Home.route ||
                            route == Screen.Search.route ||
                            route == Screen.MyTrips.route ||
                            route == Screen.Profile.route
                    }
                }

                Scaffold(
                    bottomBar = {
                        if (showBottomBar) {
                            BottomNavBar(navController)
                        }
                    }
                ) { innerPadding ->
                    NavGraph(
                        navController = navController,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}
