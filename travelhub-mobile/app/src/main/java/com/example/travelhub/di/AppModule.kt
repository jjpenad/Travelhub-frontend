package com.example.travelhub.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.example.travelhub.data.local.TravelHubDatabase
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.remote.api.AccommodationApi
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
    private const val BASE_URL = "http://k8s-travelhubdev-3d982ad1bb-1861797429.us-east-2.elb.amazonaws.com/"

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(logging)
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
        ).build()
    }

    @Provides
    @Singleton
    fun provideBookingDao(database: TravelHubDatabase): BookingDao {
        return database.bookingDao()
    }
}
