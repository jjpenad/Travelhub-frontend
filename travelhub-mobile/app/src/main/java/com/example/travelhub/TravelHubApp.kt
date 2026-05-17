package com.example.travelhub

import android.app.Application
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.LocaleManager
import com.example.travelhub.data.local.UserPreferences
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class TravelHubApp : Application() {

    @Inject lateinit var guestSessionStore: GuestSessionStore
    @Inject lateinit var userPreferences: UserPreferences
    @Inject lateinit var localeManager: LocaleManager

    override fun onCreate() {
        super.onCreate()
        // Hydrate the in-memory mirrors used by the OkHttp interceptors so the very
        // first network request already carries the X-Guest-Id and Bearer token
        // (when applicable).
        guestSessionStore.preload()
        userPreferences.preload()
        // Apply the persisted user-chosen locale BEFORE any activity inflates
        // resources. Empty / unset → AppCompat keeps following the system locale.
        // This pairs with the selector in ProfileSettingsScreen.
        localeManager.applyPersisted()
    }
}
