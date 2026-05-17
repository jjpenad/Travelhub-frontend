package com.example.travelhub.domain.model

import androidx.annotation.StringRes
import com.example.travelhub.R

/**
 * Sort options for the search Results screen.
 *
 * Each option carries a `labelRes` instead of a hard-coded label so the UI can
 * resolve it via `stringResource(option.labelRes)` and stay localised. Domain
 * enums normally don't reference UI resources, but the alternative (mapping the
 * enum to a String in every screen) would scatter the same `when` everywhere
 * and is the pattern that bit us during the i18n migration. Keeping the
 * mapping next to the enum is pragmatic and self-contained.
 */
enum class SortOption(@StringRes val labelRes: Int) {
    PRICE_ASC(R.string.sort_price_asc),
    PRICE_DESC(R.string.sort_price_desc),
    RATING(R.string.sort_rating),
    POPULARITY(R.string.sort_popularity)
}

fun List<Property>.applySort(sort: SortOption): List<Property> = when (sort) {
    SortOption.PRICE_ASC -> sortedBy { it.pricePerNight }
    SortOption.PRICE_DESC -> sortedByDescending { it.pricePerNight }
    SortOption.RATING -> sortedByDescending { it.rating }
    SortOption.POPULARITY -> sortedByDescending { it.reviewCount }
}
