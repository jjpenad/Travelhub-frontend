package com.example.travelhub.ui.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.format.FormatStyle
import java.util.Locale

/**
 * Single source for locale-aware date formatting across the app. The runtime
 * default locale is kept in sync with the user's selected app language by
 * AppCompatDelegate, so reading [Locale.getDefault] here gives the right
 * formatter without having to thread the Locale through every caller.
 *
 * Style choice: [FormatStyle.MEDIUM] matches the i18n user story's requirement
 * (e.g. "May 1, 2026" in English, "1 may 2026" in Spanish) and avoids the
 * issues of fully-locale-specific shorthand like "MMM dd" that don't make
 * sense for non-English locales.
 */
fun LocalDate.formatLocalized(locale: Locale = Locale.getDefault()): String =
    format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(locale))

/**
 * Parses an ISO-8601 date string ("2026-05-01") and renders it in the current
 * locale's medium format.
 *
 * Used by screens that receive dates as raw ISO strings from navigation args
 * or from ViewModels that haven't yet been refactored to expose LocalDate
 * (BookingPaymentScreen, PropertyDetailScreen). Defensive about malformed
 * input — if the string isn't a valid ISO date, we return the original value
 * so we never show "null" to the user. The next iteration should push
 * LocalDate up to those VMs and drop this helper.
 */
fun formatIsoDateLocalized(
    iso: String,
    locale: Locale = Locale.getDefault()
): String = try {
    LocalDate.parse(iso).formatLocalized(locale)
} catch (_: DateTimeParseException) {
    iso
}
