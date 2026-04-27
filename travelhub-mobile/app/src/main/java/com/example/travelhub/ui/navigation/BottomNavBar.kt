package com.example.travelhub.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Luggage
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.Luggage
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import com.example.travelhub.ui.theme.Purple
import com.example.travelhub.ui.theme.TextSecondary
import com.example.travelhub.ui.theme.White

data class BottomNavItem(
    val label: String,
    /** Route URI to navigate to (may include resolved query args). */
    val navigateTo: String,
    /** Registered route pattern used to detect the selected tab. */
    val routePattern: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem(
        label = "Explore",
        navigateTo = Screen.Home.route,
        routePattern = Screen.Home.route,
        selectedIcon = Icons.Filled.Explore,
        unselectedIcon = Icons.Outlined.Explore
    ),
    BottomNavItem(
        label = "Search",
        navigateTo = Screen.Search.createRoute(),
        routePattern = Screen.Search.route, // "search?city={city}"
        selectedIcon = Icons.Filled.Search,
        unselectedIcon = Icons.Outlined.Search
    ),
    BottomNavItem(
        label = "Trips",
        navigateTo = Screen.MyTrips.route,
        routePattern = Screen.MyTrips.route,
        selectedIcon = Icons.Filled.Luggage,
        unselectedIcon = Icons.Outlined.Luggage
    ),
    BottomNavItem(
        label = "Profile",
        navigateTo = Screen.Profile.route,
        routePattern = Screen.Profile.route,
        selectedIcon = Icons.Filled.Person,
        unselectedIcon = Icons.Outlined.Person
    )
)

@Composable
fun BottomNavBar(navController: NavController) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination

    NavigationBar(
        containerColor = White
    ) {
        bottomNavItems.forEach { item ->
            // Use the destination hierarchy to detect the selected tab — handles
            // nested graphs and matches the registered route pattern, not the URI.
            val isSelected = currentDestination?.hierarchy?.any {
                it.route == item.routePattern
            } == true

            NavigationBarItem(
                selected = isSelected,
                onClick = {
                    if (isSelected) return@NavigationBarItem // already there, no-op

                    navController.navigate(item.navigateTo) {
                        // Pop up to the graph's start destination by ID. Using the
                        // start ID (not a route string) is the canonical pattern
                        // that plays well with saveState / restoreState across tabs.
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(
                        imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label
                    )
                },
                label = { Text(item.label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Purple,
                    selectedTextColor = Purple,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary,
                    indicatorColor = White
                )
            )
        }
    }
}
