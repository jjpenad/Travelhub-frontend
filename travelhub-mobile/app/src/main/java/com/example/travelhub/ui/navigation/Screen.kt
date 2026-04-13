package com.example.travelhub.ui.navigation

sealed class Screen(val route: String) {
    // Auth
    object Login : Screen("login")
    object SignUp : Screen("signup")

    // Main tabs
    object Home : Screen("home")
    object Search : Screen("search?city={city}") {
        fun createRoute(city: String = "") = "search?city=$city"
    }
    object MyTrips : Screen("my_trips")
    object Profile : Screen("profile")

    // Detail screens
    object Results : Screen("results")

    object PropertyDetail : Screen("property/{propertyId}?checkIn={checkIn}&checkOut={checkOut}") {
        fun createRoute(propertyId: String, checkIn: String = "", checkOut: String = "") =
            "property/$propertyId?checkIn=$checkIn&checkOut=$checkOut"
    }

    object BookingPayment : Screen("booking_payment/{propertyId}/{roomId}?checkIn={checkIn}&checkOut={checkOut}") {
        fun createRoute(propertyId: String, roomId: String, checkIn: String, checkOut: String) =
            "booking_payment/$propertyId/$roomId?checkIn=$checkIn&checkOut=$checkOut"
    }

    object BookingConfirmation : Screen("booking_confirmation/{bookingId}?ref={ref}&hotel={hotel}&city={city}&total={total}") {
        fun createRoute(bookingId: String, ref: String, hotel: String, city: String, total: String) =
            "booking_confirmation/$bookingId?ref=$ref&hotel=$hotel&city=$city&total=$total"
    }

    object TripDetails : Screen("trip_details/{bookingId}") {
        fun createRoute(bookingId: String) = "trip_details/$bookingId"
    }

    object QRCheckIn : Screen("qr_checkin/{bookingId}") {
        fun createRoute(bookingId: String) = "qr_checkin/$bookingId"
    }

    object Notifications : Screen("notifications")
}
