package com.example.travelhub.data.local

import android.util.Base64
import com.example.travelhub.domain.model.Booking
import com.example.travelhub.domain.model.QrPayload
import com.example.travelhub.domain.model.QrToken
import com.example.travelhub.domain.model.availabilityFor
import java.time.Clock
import java.time.LocalDate
import java.time.ZoneId
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import javax.inject.Inject
import javax.inject.Singleton
import com.example.travelhub.domain.repository.QrTokenProvider

/**
 * Client-side QR generator.
 *
 * Builds a canonical payload string (`v1|reservationId|userId|hotelId|code|iat|exp`),
 * signs it with HMAC-SHA256 using a shared secret, and concatenates the two as
 * `payloadBase64.signatureBase64` — that's the string embedded in the QR.
 *
 * Caveats (acknowledged design tradeoff):
 *  - The shared secret lives in the APK so a determined attacker can extract it
 *    and forge tokens. This impl is intentional for the current sprint; the next
 *    iteration is to swap this for a `RemoteQrTokenProvider` once the backend
 *    exposes `GET /reservations/{id}/qr`. Same interface, no UI changes required.
 */
@Singleton
class HmacQrTokenProvider @Inject constructor() : QrTokenProvider {

    /** Visible to tests so they can override "now" deterministically. */
    @Suppress("MemberVisibilityCanBePrivate")
    internal var clock: Clock = Clock.systemDefaultZone()

    override fun generate(booking: Booking): QrToken {
        val now = clock.instant()
        val expiresAt = booking.checkOut
            .plusDays(1) // grace day after checkout
            .atStartOfDay(ZoneId.systemDefault())
            .toInstant()

        val payload = QrPayload(
            reservationId = booking.id,
            userId = booking.userId,
            hotelId = booking.propertyId,
            confirmationCode = booking.bookingRef.ifBlank { "N/A" },
            issuedAtEpochSeconds = now.epochSecond,
            expEpochSeconds = expiresAt.epochSecond
        )

        val canonical = payload.canonical()
        val signature = sign(canonical)
        val token = "${base64(canonical.toByteArray(Charsets.UTF_8))}.${base64(signature)}"

        return QrToken(
            token = token,
            payload = payload,
            signature = base64(signature),
            availability = availabilityFor(booking, LocalDate.ofInstant(now, ZoneId.systemDefault()))
        )
    }

    private fun sign(data: String): ByteArray {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(SECRET.toByteArray(Charsets.UTF_8), "HmacSHA256"))
        return mac.doFinal(data.toByteArray(Charsets.UTF_8))
    }

    private fun base64(bytes: ByteArray): String =
        Base64.encodeToString(bytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)

    companion object {
        // TODO(security): rotate this when the project moves out of academic scope, and
        //   ideally replace this whole class with a server-issued token (Option D).
        private const val SECRET = "travelhub-mobile-qr-v1-do-not-trust-this-secret"
    }
}
