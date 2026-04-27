package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.GuestSessionStore
import com.example.travelhub.data.local.UserPreferences
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Test

class GuestSessionInterceptorTest {

    private fun chainFor(request: Request): Interceptor.Chain {
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns request
        every { chain.proceed(any()) } answers {
            // Echo the (modified) request back as a fake successful response so the
            // interceptor flow completes naturally.
            val proceeded = firstArg<Request>()
            Response.Builder()
                .request(proceeded)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }
        return chain
    }

    @Test
    fun `adds X-Guest-Id header with stored value`() {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returns "session-123"
        // Anonymous path: no JWT in store. The interceptor reads `currentToken()`
// (not currentUserId) to decide whether to defer to Bearer; stub that.
val userPreferences = mockk<UserPreferences>().also { every { it.currentToken() } returns null }
        val interceptor = GuestSessionInterceptor(store, userPreferences)

        val request = Request.Builder().url("http://test/").build()
        val captured = slot<Request>()
        val chain = chainFor(request)
        every { chain.proceed(capture(captured)) } answers {
            Response.Builder()
                .request(captured.captured)
                .protocol(Protocol.HTTP_1_1)
                .code(200).message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }

        interceptor.intercept(chain)

        assertEquals("session-123", captured.captured.header("X-Guest-Id"))
    }

    @Test
    fun `adds empty X-Guest-Id header when store has no id yet`() {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returns null
        // Anonymous path: no JWT in store. The interceptor reads `currentToken()`
// (not currentUserId) to decide whether to defer to Bearer; stub that.
val userPreferences = mockk<UserPreferences>().also { every { it.currentToken() } returns null }
        val interceptor = GuestSessionInterceptor(store, userPreferences)

        val request = Request.Builder().url("http://test/").build()
        val captured = slot<Request>()
        val chain = chainFor(request)
        every { chain.proceed(capture(captured)) } answers {
            Response.Builder()
                .request(captured.captured)
                .protocol(Protocol.HTTP_1_1)
                .code(200).message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }

        interceptor.intercept(chain)

        // Per HU: the header must always be present, even when empty, so the backend
        // can issue a brand new session id.
        assertEquals("", captured.captured.header("X-Guest-Id"))
    }

    @Test
    fun `preserves other headers and url on the request`() {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returns "abc"
        // Anonymous path: no JWT in store. The interceptor reads `currentToken()`
// (not currentUserId) to decide whether to defer to Bearer; stub that.
val userPreferences = mockk<UserPreferences>().also { every { it.currentToken() } returns null }
        val interceptor = GuestSessionInterceptor(store, userPreferences)

        val request = Request.Builder()
            .url("http://test/path")
            .header("Accept", "application/json")
            .build()
        val captured = slot<Request>()
        val chain = chainFor(request)
        every { chain.proceed(capture(captured)) } answers {
            Response.Builder()
                .request(captured.captured)
                .protocol(Protocol.HTTP_1_1)
                .code(200).message("OK")
                .body("{}".toResponseBody("application/json".toMediaType()))
                .build()
        }

        interceptor.intercept(chain)

        assertEquals("application/json", captured.captured.header("Accept"))
        assertEquals("http://test/path", captured.captured.url.toString())
    }

    @Test
    fun `reads the id from the store on every intercept`() {
        val store = mockk<GuestSessionStore>()
        every { store.currentId() } returnsMany listOf("first", "second")
        // Anonymous path: no JWT in store. The interceptor reads `currentToken()`
// (not currentUserId) to decide whether to defer to Bearer; stub that.
val userPreferences = mockk<UserPreferences>().also { every { it.currentToken() } returns null }
        val interceptor = GuestSessionInterceptor(store, userPreferences)

        val req = Request.Builder().url("http://test/").build()

        interceptor.intercept(chainFor(req))
        interceptor.intercept(chainFor(req))

        verify(exactly = 2) { store.currentId() }
    }
}
