package com.example.travelhub.ui.util

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.example.travelhub.R
import com.example.travelhub.domain.model.NotificationTimestamp

/**
 * Renders a [NotificationTimestamp] in the user's current locale.
 *
 * Plural support is currently single-form for simplicity (e.g. "1 horas" reads
 * a bit wrong in Spanish for a single hour). A follow-up can move the
 * `HoursAgo` / `DaysAgo` resources to `plurals.xml` and use
 * `pluralStringResource` here — that's the proper Android pattern but adds a
 * `<plurals>` resource file. Since the mock currently only emits values of 2,
 * the visible behaviour is correct today.
 */
@Composable
fun NotificationTimestamp.label(): String = when (this) {
    NotificationTimestamp.JustNow ->
        stringResource(R.string.notification_time_just_now)
    is NotificationTimestamp.HoursAgo ->
        stringResource(R.string.notification_time_hours_ago, hours)
    NotificationTimestamp.Yesterday ->
        stringResource(R.string.notification_time_yesterday)
    is NotificationTimestamp.DaysAgo ->
        stringResource(R.string.notification_time_days_ago, days)
    is NotificationTimestamp.Raw -> value
}
