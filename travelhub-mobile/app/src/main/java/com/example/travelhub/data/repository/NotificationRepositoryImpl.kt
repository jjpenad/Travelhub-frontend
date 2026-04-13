package com.example.travelhub.data.repository

import com.example.travelhub.data.mock.MockNotifications
import com.example.travelhub.domain.model.Notification
import com.example.travelhub.domain.repository.NotificationRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    // TODO(backend): Inject NotificationApi and local DAO:
    //   private val notificationApi: NotificationApi,
    //   private val notificationDao: NotificationDao
) : NotificationRepository {

    override suspend fun getAll(): List<Notification> {
        // TODO(backend): Fetch from API and cache locally:
        //   return try {
        //       val remote = notificationApi.getAll()
        //       notificationDao.insertAll(remote.map { it.toEntity() })
        //       remote.map { it.toDomain() }
        //   } catch (e: IOException) {
        //       notificationDao.getAll().map { it.toDomain() }
        //   }
        //
        // TODO(backend): Also integrate Firebase Cloud Messaging (FCM) for real-time
        //   push notifications. See AndroidManifest.xml for the service declaration.
        return MockNotifications.getAll()
    }
}
