package com.example.travelhub.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.TravelHubDatabase
import com.example.travelhub.data.local.UserPreferences
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.network.ConnectivityObserver
import com.example.travelhub.data.network.NetworkErrorBus
import com.example.travelhub.data.remote.api.AccommodationApi
import com.example.travelhub.data.remote.api.AuthApi
import com.example.travelhub.data.remote.interceptor.AuthInterceptor
import com.example.travelhub.data.remote.interceptor.GuestSessionInterceptor
import com.example.travelhub.data.remote.interceptor.NetworkErrorInterceptor
import com.example.travelhub.data.remote.interceptor.TokenAuthenticator
import javax.inject.Provider
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "travelhub_prefs")

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // TODO(backend): Move this to BuildConfig or a config file so it can differ per build variant
    private const val BASE_URL = "http://k8s-travelhubdev-3d982ad1bb-1106876598.us-east-2.elb.amazonaws.com/"

    @Provides
    @Singleton
    fun provideGuestSessionInterceptor(
        store: GuestSessionStore,
        userPreferences: UserPreferences
    ): GuestSessionInterceptor = GuestSessionInterceptor(store, userPreferences)

    @Provides
    @Singleton
    fun provideAuthInterceptor(userPreferences: UserPreferences): AuthInterceptor =
        AuthInterceptor(userPreferences)

    @Provides
    @Singleton
    fun provideNetworkErrorInterceptor(
        bus: NetworkErrorBus,
        connectivity: ConnectivityObserver
    ): NetworkErrorInterceptor = NetworkErrorInterceptor(bus, connectivity)

    @Provides
    @Singleton
    fun provideTokenAuthenticator(
        userPreferences: UserPreferences,
        authApiProvider: Provider<com.example.travelhub.data.remote.api.AuthApi>
    ): TokenAuthenticator = TokenAuthenticator(userPreferences, authApiProvider)

    @Provides
    @Singleton
    fun provideOkHttpClient(
        guestSessionInterceptor: GuestSessionInterceptor,
        authInterceptor: AuthInterceptor,
        networkErrorInterceptor: NetworkErrorInterceptor,
        tokenAuthenticator: TokenAuthenticator
    ): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            // Auth header first so it shows up in the body printed by the logger.
            .addInterceptor(authInterceptor)
            // Guest session interceptor next; carries X-Guest-Id (which mirrors
            // the authenticated user id when signed in).
            .addInterceptor(guestSessionInterceptor)
            // Error interceptor wraps the call: catches IOExceptions and non-2xx so it
            // can publish to NetworkErrorBus before the failure bubbles up to the VM.
            .addInterceptor(networkErrorInterceptor)
            .addInterceptor(logging)
            // Authenticator handles 401 — runs OUTSIDE the interceptor chain by design.
            .authenticator(tokenAuthenticator)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideAccommodationApi(retrofit: Retrofit): AccommodationApi {
        return retrofit.create(AccommodationApi::class.java)
    }

    @Provides
    @Singleton
    fun provideAuthApi(retrofit: Retrofit): AuthApi {
        return retrofit.create(AuthApi::class.java)
    }

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): TravelHubDatabase {
        return Room.databaseBuilder(
            context,
            TravelHubDatabase::class.java,
            "travelhub_db"
        )
            // Schema is dev-only; on version bumps just nuke the DB. The next sync
            // pulls everything back from the backend, so no permanent data loss.
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideBookingDao(database: TravelHubDatabase): BookingDao {
        return database.bookingDao()
    }
}
