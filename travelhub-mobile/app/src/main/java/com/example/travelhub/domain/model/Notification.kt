package com.example.travelhub.domain.model

data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val timestamp: String,
    val isRead: Boolean = false
)

enum class NotificationType {
    BOOKING_CONFIRMED,
    CHECKIN_REMINDER,
    ROOM_UPGRADE,
    PAYMENT_SUCCESS
}
