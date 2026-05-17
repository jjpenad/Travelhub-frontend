package com.example.travelhub.data.local

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Centralised entry point for applying and reading the active app locale.
 *
 * - "es" / "en" → force the app into that locale (overrides the system).
 * - empty / null → follow the system locale (default behaviour at first launch).
 *
 * Apply vs persist:
 *  - [apply] is synchronous and only touches AppCompatDelegate. Callers that
 *    need to immediately recreate the activity (so the new resources are read)
 *    rely on this returning before they trigger the recreate.
 *  - [persist] is suspend (DataStore write). The user's choice survives a
 *    process restart only after this finishes; we kick it off in the
 *    background and let it run while the activity recreates.
 *  - [setAndPersist] is the convenience that does both in order, kept for the
 *    rare caller that doesn't need apply/persist ordering control.
 *
 * Why this split: ProfileViewModel needs to call `apply` synchronously so the
 * screen can then call `activity.recreate()` with the new locale already in
 * effect. Persisting first would still work, but persisting *after* the apply
 * keeps the user-perceived latency to zero — the UI flips before DataStore
 * acks.
 */
@Singleton
class LocaleManager @Inject constructor(
    private val userPreferences: UserPreferences
) {

    /** Apply the persisted locale (if any) to the AppCompat delegate. Safe to
     *  call from Application.onCreate; reads the persisted value synchronously
     *  via [UserPreferences.currentAuthLocale]. */
    fun applyPersisted() {
        apply(userPreferences.currentAuthLocale())
    }

    /** Apply a locale tag synchronously via AppCompatDelegate. Pass empty
     *  string to clear the override and fall back to the system locale.
     *  Does NOT persist — pair with [persist] for that. */
    fun apply(tag: String) {
        val locales = if (tag.isBlank()) LocaleListCompat.getEmptyLocaleList()
        else LocaleListCompat.forLanguageTags(tag)
        AppCompatDelegate.setApplicationLocales(locales)
    }

    /** Persist the user-chosen locale tag. Pass empty string to reset to
     *  "follow system". Suspend because DataStore writes are. */
    suspend fun persist(tag: String) {
        userPreferences.saveAuthLocale(tag)
    }

    /** Convenience: persist then apply. Most callers should prefer calling
     *  [apply] synchronously and [persist] in the background so the UI flips
     *  before the disk write completes. */
    suspend fun setAndPersist(tag: String) {
        persist(tag)
        apply(tag)
    }

    /** Current effective locale tag according to AppCompat. Empty string when
     *  no override is active (i.e. the app is following the system locale). */
    fun currentTag(): String =
        AppCompatDelegate.getApplicationLocales().toLanguageTags()

    /** Convenience for places that need a [Locale] object (e.g. date formatters
     *  inside a ViewModel). Falls back to the JVM default when no override is
     *  active — the JVM default is updated by the system after AppCompat
     *  re-applies the locale, so this stays in sync without extra plumbing. */
    fun currentLocale(): Locale {
        val tag = currentTag()
        return if (tag.isNotBlank()) Locale.forLanguageTag(tag) else Locale.getDefault()
    }
}
