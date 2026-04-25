package com.example.travelhub

import android.app.Application
import com.example.travelhub.data.local.GuestSessionStore
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class TravelHubApp : Application() {

    @Inject lateinit var guestSessionStore: GuestSessionStore

    override fun onCreate() {
        super.onCreate()
        // Hydrate the in-memory mirror used by GuestSessionInterceptor so the very
        // first network request already carries any persisted X-Guest-Id.
        guestSessionStore.preload()
    }
}
