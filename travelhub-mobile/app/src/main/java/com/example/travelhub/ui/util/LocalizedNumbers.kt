package com.example.travelhub.ui.util

import java.text.NumberFormat
import java.util.Locale

/**
 * Formats a number using the current locale's grouping separators.
 *
 *   formatNumber(1234, en-US)   → "1,234"
 *   formatNumber(1234, es-CO)   → "1.234"
 *   formatNumber(1234.5, es-ES) → "1.234,5"
 *
 * Use this for any user-visible numeric quantity that can exceed three digits
 * (review counts, ratings shown as "578 reseñas", item counts, etc.). For
 * monetary amounts use a currency-specific formatter instead; for small
 * counts (1-99 nights, guests) the plain integer is fine since the visible
 * shape doesn't change across locales below the thousands separator.
 */
fun formatNumber(
    value: Number,
    locale: Locale = Locale.getDefault()
): String = NumberFormat.getNumberInstance(locale).format(value)
