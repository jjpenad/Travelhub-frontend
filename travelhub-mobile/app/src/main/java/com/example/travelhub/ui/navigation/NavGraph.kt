package com.example.travelhub.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.compose.runtime.remember
import com.example.travelhub.ui.screens.auth.AuthViewModel
import com.example.travelhub.ui.screens.auth.LoginScreen
import com.example.travelhub.ui.screens.auth.SignUpScreen
import com.example.travelhub.ui.screens.booking.BookingConfirmationScreen
import com.example.travelhub.ui.screens.booking.BookingPaymentScreen
import com.example.travelhub.ui.screens.booking.BookingViewModel
import com.example.travelhub.ui.screens.home.HomeScreen
import com.example.travelhub.ui.screens.home.HomeViewModel
import com.example.travelhub.ui.screens.notifications.NotificationsScreen
import com.example.travelhub.ui.screens.notifications.NotificationsViewModel
import com.example.travelhub.ui.screens.profile.ProfileSettingsScreen
import com.example.travelhub.ui.screens.property.PropertyDetailScreen
import com.example.travelhub.ui.screens.property.PropertyDetailViewModel
import com.example.travelhub.ui.screens.search.ResultsScreen
import com.example.travelhub.ui.screens.search.SearchScreen
import com.example.travelhub.ui.screens.search.SearchViewModel
import com.example.travelhub.ui.screens.trips.MyTripsScreen
import com.example.travelhub.ui.screens.trips.MyTripsViewModel
import com.example.travelhub.ui.screens.trips.QRCheckInScreen
import com.example.travelhub.ui.screens.trips.TripDetailsScreen

@Composable
fun NavGraph(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    // Guests start at Home. Login screens remain in the graph and reachable on demand
    // (e.g. from Profile), but no longer gate the app.
    startDestination: String = Screen.Home.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {
        // Auth
        composable(Screen.Login.route) {
            val authViewModel: AuthViewModel = hiltViewModel()
            LoginScreen(
                viewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToSignUp = { navController.navigate(Screen.SignUp.route) }
            )
        }
        composable(Screen.SignUp.route) {
            SignUpScreen(onNavigateBack = { navController.popBackStack() })
        }

        // Home
        composable(Screen.Home.route) {
            val homeViewModel: HomeViewModel = hiltViewModel()
            HomeScreen(
                viewModel = homeViewModel,
                onSearchClick = { navController.navigate(Screen.Search.createRoute()) },
                onCityClick = { city ->
                    navController.navigate(Screen.Search.createRoute(city))
                },
                onPropertyClick = { id -> navController.navigate(Screen.PropertyDetail.createRoute(id)) },
                onNotificationsClick = { navController.navigate(Screen.Notifications.route) }
            )
        }

        // Search
        composable(
            route = Screen.Search.route,
            arguments = listOf(navArgument("city") { type = NavType.StringType; defaultValue = "" })
        ) { backStackEntry ->
            val cityArg = backStackEntry.arguments?.getString("city") ?: ""
            val searchViewModel: SearchViewModel = hiltViewModel()
            // Pre-select city only on first composition (when city is empty)
            androidx.compose.runtime.LaunchedEffect(cityArg) {
                if (cityArg.isNotBlank() && searchViewModel.selectedCity.value.isEmpty()) {
                    searchViewModel.onCityChange(cityArg)
                }
            }
            SearchScreen(
                viewModel = searchViewModel,
                onResultsReady = { navController.navigate(Screen.Results.route) }
            )
        }

        // Results — shares the SearchViewModel from the Search back stack entry
        composable(Screen.Results.route) { backStackEntry ->
            // Key the remember on the current NavBackStackEntry so Lint is happy and
            // the parent reference is refreshed if the back stack changes.
            val parentEntry = remember(backStackEntry) {
                navController.getBackStackEntry(Screen.Search.route)
            }
            val searchViewModel: SearchViewModel = hiltViewModel(parentEntry)
            ResultsScreen(
                viewModel = searchViewModel,
                onPropertyClick = { id ->
                    navController.navigate(
                        Screen.PropertyDetail.createRoute(
                            propertyId = id,
                            checkIn = searchViewModel.checkInApi,
                            checkOut = searchViewModel.checkOutApi
                        )
                    )
                },
                onBack = { navController.popBackStack() }
            )
        }

        // Property Detail
        composable(
            route = Screen.PropertyDetail.route,
            arguments = listOf(
                navArgument("propertyId") { type = NavType.StringType },
                navArgument("checkIn") { type = NavType.StringType; defaultValue = "" },
                navArgument("checkOut") { type = NavType.StringType; defaultValue = "" }
            )
        ) {
            val viewModel: PropertyDetailViewModel = hiltViewModel()
            PropertyDetailScreen(
                viewModel = viewModel,
                onReserveClick = { propertyId, roomId, checkIn, checkOut ->
                    navController.navigate(Screen.BookingPayment.createRoute(propertyId, roomId, checkIn, checkOut))
                },
                onBack = { navController.popBackStack() }
            )
        }

        // Booking Payment
        composable(
            route = Screen.BookingPayment.route,
            arguments = listOf(
                navArgument("propertyId") { type = NavType.StringType },
                navArgument("roomId") { type = NavType.StringType },
                navArgument("checkIn") { type = NavType.StringType; defaultValue = "" },
                navArgument("checkOut") { type = NavType.StringType; defaultValue = "" }
            )
        ) {
            val viewModel: BookingViewModel = hiltViewModel()
            BookingPaymentScreen(
                viewModel = viewModel,
                onConfirmed = { bookingId, ref, hotel, city, total ->
                    navController.navigate(Screen.BookingConfirmation.createRoute(bookingId, ref, hotel, city, total)) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        // Booking Confirmation
        composable(
            route = Screen.BookingConfirmation.route,
            arguments = listOf(
                navArgument("bookingId") { type = NavType.StringType },
                navArgument("ref") { type = NavType.StringType; defaultValue = "" },
                navArgument("hotel") { type = NavType.StringType; defaultValue = "" },
                navArgument("city") { type = NavType.StringType; defaultValue = "" },
                navArgument("total") { type = NavType.StringType; defaultValue = "0" }
            )
        ) { backStackEntry ->
            val bookingRef = backStackEntry.arguments?.getString("ref") ?: ""
            val hotelName = backStackEntry.arguments?.getString("hotel") ?: ""
            val city = backStackEntry.arguments?.getString("city") ?: ""
            val total = backStackEntry.arguments?.getString("total")?.toIntOrNull() ?: 0
            BookingConfirmationScreen(
                propertyName = hotelName,
                propertyCity = city,
                bookingRef = bookingRef,
                totalPrice = total,
                onViewTrips = {
                    navController.navigate(Screen.MyTrips.route) {
                        popUpTo(Screen.Home.route)
                    }
                }
            )
        }

        // My Trips
        composable(Screen.MyTrips.route) {
            val viewModel: MyTripsViewModel = hiltViewModel()
            MyTripsScreen(
                viewModel = viewModel,
                onTripClick = { id -> navController.navigate(Screen.TripDetails.createRoute(id)) },
                onSignInClick = { navController.navigate(Screen.Login.route) }
            )
        }

        // Trip Details
        composable(
            route = Screen.TripDetails.route,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType })
        ) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
            val tripsEntry = remember(backStackEntry) {
                navController.getBackStackEntry(Screen.MyTrips.route)
            }
            val viewModel: MyTripsViewModel = hiltViewModel(tripsEntry)
            TripDetailsScreen(
                viewModel = viewModel,
                bookingId = bookingId,
                onQRCheckIn = { id -> navController.navigate(Screen.QRCheckIn.createRoute(id)) },
                onBack = { navController.popBackStack() }
            )
        }

        // QR Check-In
        composable(
            route = Screen.QRCheckIn.route,
            arguments = listOf(navArgument("bookingId") { type = NavType.StringType })
        ) { backStackEntry ->
            val bookingId = backStackEntry.arguments?.getString("bookingId") ?: ""
            val tripsEntry = remember(backStackEntry) {
                navController.getBackStackEntry(Screen.MyTrips.route)
            }
            val viewModel: MyTripsViewModel = hiltViewModel(tripsEntry)
            QRCheckInScreen(
                viewModel = viewModel,
                bookingId = bookingId,
                onBack = { navController.popBackStack() }
            )
        }

        // Profile
        composable(Screen.Profile.route) {
            ProfileSettingsScreen(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // Notifications
        composable(Screen.Notifications.route) {
            val viewModel: NotificationsViewModel = hiltViewModel()
            NotificationsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
