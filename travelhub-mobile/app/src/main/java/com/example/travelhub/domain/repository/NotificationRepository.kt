package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.Notification

interface NotificationRepository {
    suspend fun getAll(): List<Notification>
}
