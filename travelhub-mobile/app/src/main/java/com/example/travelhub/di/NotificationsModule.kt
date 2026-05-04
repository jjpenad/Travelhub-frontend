package com.example.travelhub.di

import com.example.travelhub.notifications.AndroidNotificationDispatcher
import com.example.travelhub.notifications.AndroidPostNotificationsPermissionGate
import com.example.travelhub.notifications.NotificationDispatcher
import com.example.travelhub.notifications.PostNotificationsPermissionGate
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Bindings para las dos interfaces del paquete `notifications`. Las dejamos
 * en un módulo separado para que `AppModule` siga ocupándose sólo de
 * Retrofit/Room/DataStore y no se mezcle con plumbing de UI.
 *
 * Nota: usamos `@Binds` en lugar de `@Provides` porque las impls Android
 * tienen `@Inject constructor` — Hilt resuelve sus dependencias
 * automáticamente.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class NotificationsModule {

    @Binds
    @Singleton
    abstract fun bindPermissionGate(
        impl: AndroidPostNotificationsPermissionGate,
    ): PostNotificationsPermissionGate

    @Binds
    @Singleton
    abstract fun bindDispatcher(
        impl: AndroidNotificationDispatcher,
    ): NotificationDispatcher
}
