package com.example.travelhub.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.example.travelhub.data.local.entity.BookingEntity

@Dao
interface BookingDao {

    @Query("SELECT * FROM bookings WHERE userId = :userId ORDER BY checkIn DESC")
    suspend fun getByUserId(userId: String): List<BookingEntity>

    @Query("SELECT * FROM bookings WHERE id = :bookingId")
    suspend fun getById(bookingId: String): BookingEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(booking: BookingEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(bookings: List<BookingEntity>)

    @Update
    suspend fun update(booking: BookingEntity)

    @Query("UPDATE bookings SET status = :status WHERE id = :bookingId")
    suspend fun updateStatus(bookingId: String, status: String)

    @Query("SELECT COUNT(*) FROM bookings WHERE bookingRef = :bookingRef")
    suspend fun countByRef(bookingRef: String): Int

    /** Drop every row whose userId is not the active guest session id. */
    @Query("DELETE FROM bookings WHERE userId != :userId")
    suspend fun deleteByUserIdNot(userId: String)
}
