package com.example.travelhub.domain.model

import java.time.LocalDate

data class CheckinResult(
    val id: String,
    val bookingId: String,
    val roomNumber: String,
    val checkinDate: LocalDate,
    val checkinTime: String = "3:00 PM",
    val status: String = "CHECKED_IN"
)
