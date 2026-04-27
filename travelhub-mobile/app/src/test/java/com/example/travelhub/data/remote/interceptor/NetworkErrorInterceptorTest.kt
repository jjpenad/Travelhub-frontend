package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.network.ConnectivityObserver
import com.example.travelhub.data.network.NetworkErrorBus
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertThrows
import org.junit.Test
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class NetworkErrorInterceptorTest {

    private fun makeRequest() = Request.Builder().url("http://test/").build()

    private fun chainReturning(response: Response): Interceptor.Chain {
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns makeRequest()
        every { chain.proceed(any()) } returns response
        return chain
    }

    private fun chainThrowing(error: Throwable): Interceptor.Chain {
        val chain = mockk<Interceptor.Chain>()
        every { chain.request() } returns makeRequest()
        every { chain.proceed(any()) } throws error
        return chain
    }

    private fun successResponse(): Response = Response.Builder()
        .request(makeRequest())
        .protocol(Protocol.HTTP_1_1)
        .code(200).message("OK")
        .body("{}".toResponseBody("application/json".toMediaType()))
        .build()

    private fun errorResponse(code: Int): Response = Response.Builder()
        .request(makeRequest())
        .protocol(Protocol.HTTP_1_1)
        .code(code).message("Error")
        .body("err".toResponseBody("application/json".toMediaType()))
        .build()

    @Test
    fun `does not emit on 2xx responses`() {
        val bus = mockk<NetworkErrorBus>(relaxed = true)
        val connectivity = mockk<ConnectivityObserver>().also { every { it.isOnline() } returns true }
        val interceptor = NetworkErrorInterceptor(bus, connectivity)

        interceptor.intercept(chainReturning(successResponse()))

        verify(exactly = 0) { bus.emit(any()) }
    }

    @Test
    fun `emits a server-error message on non-2xx responses`() {
        val bus = mockk<NetworkErrorBus>(relaxed = true)
        val connectivity = mockk<ConnectivityObserver>().also { every { it.isOnline() } returns true }
        val interceptor = NetworkErrorInterceptor(bus, connectivity)

        interceptor.intercept(chainReturning(errorResponse(500)))

        verify { bus.emit(match { it.contains("500") }) }
    }

    @Test
    fun `emits on SocketTimeoutException and re-throws`() {
        val bus = mockk<NetworkErrorBus>(relaxed = true)
        val connectivity = mockk<ConnectivityObserver>().also { every { it.isOnline() } returns true }
        val interceptor = NetworkErrorInterceptor(bus, connectivity)
        val chain = chainThrowing(SocketTimeoutException("boom"))

        assertThrows(SocketTimeoutException::class.java) {
            interceptor.intercept(chain)
        }
        verify { bus.emit(match { it.contains("timed out", ignoreCase = true) }) }
    }

    @Test
    fun `does not emit on UnknownHostException when device is offline`() {
        val bus = mockk<NetworkErrorBus>(relaxed = true)
        val connectivity = mockk<ConnectivityObserver>().also { every { it.isOnline() } returns false }
        val interceptor = NetworkErrorInterceptor(bus, connectivity)
        val chain = chainThrowing(UnknownHostException("no host"))

        assertThrows(UnknownHostException::class.java) {
            interceptor.intercept(chain)
        }
        // The OfflineBanner already covers offline state — the bus must stay quiet.
        verify(exactly = 0) { bus.emit(any()) }
    }

    @Test
    fun `emits on UnknownHostException when device is online`() {
        val bus = mockk<NetworkErrorBus>(relaxed = true)
        val connectivity = mockk<ConnectivityObserver>().also { every { it.isOnline() } returns true }
        val interceptor = NetworkErrorInterceptor(bus, connectivity)
        val chain = chainThrowing(UnknownHostException("no host"))

        assertThrows(UnknownHostException::class.java) {
            interceptor.intercept(chain)
        }
        verify { bus.emit(match { it.contains("server", ignoreCase = true) }) }
    }

    @Test
    fun `emits on generic IOException only when online`() {
        val busOnline = mockk<NetworkErrorBus>(relaxed = true)
        val onlineConnectivity = mockk<ConnectivityObserver>()
            .also { every { it.isOnline() } returns true }
        val online = NetworkErrorInterceptor(busOnline, onlineConnectivity)

        assertThrows(IOException::class.java) {
            online.intercept(chainThrowing(IOException("kaboom")))
        }
        verify { busOnline.emit(match { it.contains("Network error") }) }

        val busOffline = mockk<NetworkErrorBus>(relaxed = true)
        val offlineConnectivity = mockk<ConnectivityObserver>()
            .also { every { it.isOnline() } returns false }
        val offline = NetworkErrorInterceptor(busOffline, offlineConnectivity)

        assertThrows(IOException::class.java) {
            offline.intercept(chainThrowing(IOException("kaboom")))
        }
        verify(exactly = 0) { busOffline.emit(any()) }
    }
}
