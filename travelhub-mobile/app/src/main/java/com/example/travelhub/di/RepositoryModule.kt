package com.example.travelhub.di

import com.example.travelhub.data.local.HmacQrTokenProvider
import com.example.travelhub.data.repository.AuthRepositoryImpl
import com.example.travelhub.data.repository.BookingRepositoryImpl
import com.example.travelhub.data.repository.CheckinRepositoryImpl
import com.example.travelhub.data.repository.NotificationRepositoryImpl
import com.example.travelhub.data.repository.PaymentRepositoryImpl
import com.example.travelhub.data.repository.PropertyRepositoryImpl
import com.example.travelhub.domain.repository.AuthRepository
import com.example.travelhub.domain.repository.BookingRepository
import com.example.travelhub.domain.repository.CheckinRepository
import com.example.travelhub.domain.repository.NotificationRepository
import com.example.travelhub.domain.repository.PaymentRepository
import com.example.travelhub.domain.repository.PropertyRepository
import com.example.travelhub.domain.repository.QrTokenProvider
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindPropertyRepository(impl: PropertyRepositoryImpl): PropertyRepository

    @Binds
    @Singleton
    abstract fun bindBookingRepository(impl: BookingRepositoryImpl): BookingRepository

    @Binds
    @Singleton
    abstract fun bindPaymentRepository(impl: PaymentRepositoryImpl): PaymentRepository

    @Binds
    @Singleton
    abstract fun bindCheckinRepository(impl: CheckinRepositoryImpl): CheckinRepository

    @Binds
    @Singleton
    abstract fun bindNotificationRepository(impl: NotificationRepositoryImpl): NotificationRepository

    /**
     * QR token provider — currently the client-side HMAC implementation.
     * Replace with a `RemoteQrTokenProvider` once the backend exposes a real
     * `/reservations/{id}/qr` endpoint; the use case + UI don't change.
     */
    @Binds
    @Singleton
    abstract fun bindQrTokenProvider(impl: HmacQrTokenProvider): QrTokenProvider
}
