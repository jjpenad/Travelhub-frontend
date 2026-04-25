package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.network.ConnectivityObserver
import com.example.travelhub.data.network.NetworkErrorBus
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.inject.Inject

/**
 * Catches transport-level failures and non-2xx responses and pushes a human-readable
 * message onto [NetworkErrorBus] so the app shell can show a Snackbar.
 *
 * - Skips emitting "no connection" errors when the device is already offline,
 *   because the persistent OfflineBanner is already informing the user.
 * - Re-throws / passes the response through unchanged so calling code keeps its
 *   existing error handling.
 */
class NetworkErrorInterceptor @Inject constructor(
    private val errorBus: NetworkErrorBus,
    private val connectivity: ConnectivityObserver
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val response = try {
            chain.proceed(chain.request())
        } catch (e: SocketTimeoutException) {
            errorBus.emit("Connection timed out. Please try again.")
            throw e
        } catch (e: UnknownHostException) {
            // Device probably offline — banner already covers it; only emit if we are online.
            if (connectivity.isOnline()) errorBus.emit("Could not reach the server.")
            throw e
        } catch (e: IOException) {
            if (connectivity.isOnline()) errorBus.emit("Network error: ${e.message ?: "unknown"}")
            throw e
        }

        if (!response.isSuccessful) {
            errorBus.emit("Server error (${response.code}). Please try again.")
        }
        return response
    }
}
