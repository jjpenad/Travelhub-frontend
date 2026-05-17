package com.example.travelhub.ui.util

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.example.travelhub.R

/**
 * Maps the raw amenity label coming from the backend (or mock fixtures) to a
 * localised display label. Comparison is case-insensitive and tolerant of the
 * minor variations the backend has historically returned ("Wi-Fi" / "WiFi",
 * "Pool" / "pool").
 *
 * If the raw value doesn't match any known amenity, the original string is
 * returned unchanged so we never hide content from the user — that's also the
 * signal we use to spot new amenity codes worth adding to this map.
 *
 * Long-term, the backend should return canonical codes (e.g. `pool`,
 * `infinity_pool`) plus its own localised label, and this client mapping
 * shrinks to nothing.
 */
@Composable
fun amenityLabel(raw: String): String {
    return when (raw.trim().lowercase()) {
        "pool" -> stringResource(R.string.amenity_pool)
        "infinity pool", "infinitypool" -> stringResource(R.string.amenity_infinity_pool)
        "breakfast" -> stringResource(R.string.amenity_breakfast)
        "parking" -> stringResource(R.string.amenity_parking)
        "wifi", "wi-fi", "wi fi" -> stringResource(R.string.amenity_wifi)
        "spa" -> stringResource(R.string.amenity_spa)
        "wine bar", "winebar" -> stringResource(R.string.amenity_wine_bar)
        "sea view", "seaview" -> stringResource(R.string.amenity_sea_view)
        "sunset view", "sunsetview" -> stringResource(R.string.amenity_sunset_view)
        "butler service", "butlerservice" -> stringResource(R.string.amenity_butler_service)
        "restaurant" -> stringResource(R.string.amenity_restaurant)
        "bar" -> stringResource(R.string.amenity_bar)
        "laundry" -> stringResource(R.string.amenity_laundry)
        "concierge" -> stringResource(R.string.amenity_concierge)
        "gym" -> stringResource(R.string.amenity_gym)
        "room service", "roomservice" -> stringResource(R.string.amenity_room_service)
        "yoga" -> stringResource(R.string.amenity_yoga)
        else -> raw
    }
}
