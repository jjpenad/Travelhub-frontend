package com.example.travelhub.data.remote.interceptor

import com.example.travelhub.data.local.GuestSessionStore
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * Adds the X-Guest-Id header to every outgoing request.
 *
 * Per HU: the header must always be present, even when empty (first call), so the
 * backend can issue and return a `user_session` value that we then persist via
 * [GuestSessionStore.update] from the repository layer.
 */
class GuestSessionInterceptor @Inject constructor(
    private val store: GuestSessionStore
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .header(HEADER, store.currentId().orEmpty())
            .build()
        return chain.proceed(request)
    }

    companion object {
        const val HEADER = "X-Guest-Id"
    }
}
