package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.UserPreferences
import io.mockk.capture
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AuthInterceptorTest {

    private fun chainWithCapture(captured: io.mockk.CapturingSlot<Request>): Interceptor.Chain {
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns Request.Builder().url("http://x/api/me").build()
        every { chain.proceed(capture(captured)) } answers {
            Response.Builder()
                .request(captured.captured)
                .protocol(Protocol.HTTP_1_1)
                .code(200).message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }
        return chain
    }

    @Test
    fun `attaches Authorization header when token present`() {
        val prefs = mockk<UserPreferences>().also { every { it.currentToken() } returns "abc.def.ghi" }
        val captured = slot<Request>()

        AuthInterceptor(prefs).intercept(chainWithCapture(captured))

        assertEquals("Bearer abc.def.ghi", captured.captured.header("Authorization"))
    }

    @Test
    fun `omits Authorization when no token`() {
        val prefs = mockk<UserPreferences>().also { every { it.currentToken() } returns null }
        val captured = slot<Request>()

        AuthInterceptor(prefs).intercept(chainWithCapture(captured))

        assertNull(captured.captured.header("Authorization"))
    }

    @Test
    fun `skips auth endpoints to avoid sending stale token while logging in`() {
        val prefs = mockk<UserPreferences>().also { every { it.currentToken() } returns "stale-token" }
        val chain = mockk<Interceptor.Chain>()
        val captured = slot<Request>()
        every { chain.request() } returns Request.Builder().url("http://x/service-core/auth/login").build()
        every { chain.proceed(capture(captured)) } answers {
            Response.Builder()
                .request(captured.captured)
                .protocol(Protocol.HTTP_1_1)
                .code(200).message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }

        AuthInterceptor(prefs).intercept(chain)

        assertNull(captured.captured.header("Authorization"))
    }
}
