package com.example.travelhub.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.travelhub.data.local.dao.BookingDao
import com.example.travelhub.data.local.entity.BookingEntity

@Database(
    entities = [BookingEntity::class],
    version = 1,
    exportSchema = false
)
abstract class TravelHubDatabase : RoomDatabase() {
    abstract fun bookingDao(): BookingDao
}
