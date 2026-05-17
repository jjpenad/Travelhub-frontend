package com.example.travelhub.domain.model

/**
 * Relative-time descriptor for a notification's timestamp.
 *
 * The mobile app receives a typed value (rather than a pre-formatted string) so
 * the UI layer can render it in the user's current locale. Until the backend
 * starts sending real Instants, the mock layer constructs these cases directly;
 * once Instants are available, an extension function on Instant can compute the
 * appropriate case from `now - issuedAt`.
 *
 * [Raw] is the escape hatch for backend-supplied free-form strings (e.g. an
 * absolute date) that the client cannot interpret — we display them verbatim
 * and accept the locale leak. This is documented as a follow-up: localising
 * backend-sourced strings is a backend concern.
 */
sealed class NotificationTimestamp {
    object JustNow : NotificationTimestamp()
    data class HoursAgo(val hours: Int) : NotificationTimestamp()
    object Yesterday : NotificationTimestamp()
    data class DaysAgo(val days: Int) : NotificationTimestamp()
    data class Raw(val value: String) : NotificationTimestamp()
}

data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val timestamp: NotificationTimestamp,
    val isRead: Boolean = false
)

enum class NotificationType {
    BOOKING_CONFIRMED,
    CHECKIN_REMINDER,
    ROOM_UPGRADE,
    PAYMENT_SUCCESS
}
