package com.example.travelhub.domain.repository

import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.QrToken

/**
 * Strategy for producing the QR payload + signature for a given [Booking].
 *
 * Today the implementation is client-side ([com.example.travelhub.data.local.HmacQrTokenProvider]);
 * when the backend exposes its own QR endpoint we'll add a remote impl and just
 * rebind this interface — the use case, VM and screen don't change.
 */
interface QrTokenProvider {
    fun generate(booking: Booking): QrToken
}
