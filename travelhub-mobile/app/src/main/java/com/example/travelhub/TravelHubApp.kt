package com.example.travelhub

import android.app.Application
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.UserPreferences
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class TravelHubApp : Application() {

    @Inject lateinit var guestSessionStore: GuestSessionStore
    @Inject lateinit var userPreferences: UserPreferences

    override fun onCreate() {
        super.onCreate()
        // Hydrate the in-memory mirrors used by the OkHttp interceptors so the very
        // first network request already carries the X-Guest-Id and Bearer token
        // (when applicable).
        guestSessionStore.preload()
        userPreferences.preload()
    }
}
