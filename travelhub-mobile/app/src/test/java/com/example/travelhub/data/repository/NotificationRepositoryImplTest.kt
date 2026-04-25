package com.example.travelhub.data.repository

import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertNotNull
import org.junit.Test

class NotificationRepositoryImplTest {

    @Test
    fun `getAll returns the seeded notifications list`() = runTest {
        val repo = NotificationRepositoryImpl()

        val list = repo.getAll()

        assertNotNull(list)
        // Mock fixture is non-empty; tests are intentionally tolerant about size to
        // avoid breaking on every fixture update.
        assert(list.isNotEmpty()) { "Expected MockNotifications to ship at least one entry" }
    }
}
