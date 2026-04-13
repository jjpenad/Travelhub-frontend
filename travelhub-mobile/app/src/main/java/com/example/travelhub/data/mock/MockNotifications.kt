package com.example.travelhub.data.mock

import com.example.travelhub.domain.model.Notification
import com.example.travelhub.domain.model.NotificationType

object MockNotifications {

    private val notifications = listOf(
        Notification(
            id = "notif_001",
            title = "Booking Confirmed!",
            message = "Mystique Hotel, Mar 15-22 is confirmed. Check your itinerary.",
            type = NotificationType.BOOKING_CONFIRMED,
            timestamp = "Just now"
        ),
        Notification(
            id = "notif_002",
            title = "Check-In Tomorrow!",
            message = "Your QR code is ready. Tap to view and skip the queue.",
            type = NotificationType.CHECKIN_REMINDER,
            timestamp = "2 hours ago"
        ),
        Notification(
            id = "notif_003",
            title = "Room Upgrade Available",
            message = "Upgrade to Caldera View Suite for only +\$80/night.",
            type = NotificationType.ROOM_UPGRADE,
            timestamp = "Yesterday"
        ),
        Notification(
            id = "notif_004",
            title = "Payment Successful",
            message = "\$2,376 charged to Visa ••4242. Receipt sent to email.",
            type = NotificationType.PAYMENT_SUCCESS,
            timestamp = "2 days ago"
        )
    )

    fun getAll(): List<Notification> = notifications
}
