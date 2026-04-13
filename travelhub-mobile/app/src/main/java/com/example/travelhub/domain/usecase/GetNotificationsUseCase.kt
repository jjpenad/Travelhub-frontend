package com.example.travelhub.domain.usecase

import com.example.travelhub.domain.model.Notification
import com.example.travelhub.domain.repository.NotificationRepository
import javax.inject.Inject

class GetNotificationsUseCase @Inject constructor(
    private val notificationRepository: NotificationRepository
) {
    suspend operator fun invoke(): List<Notification> {
        return notificationRepository.getAll()
    }
}
