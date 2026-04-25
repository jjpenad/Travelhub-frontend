package com.example.travelhub.data.repository

import com.example.travelhub.domain.model.PaymentStatus
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PaymentRepositoryImplTest {

    private val repo = PaymentRepositoryImpl()

    @Test
    fun `processPayment returns a successful receipt for the given booking`() = runTest {
        val result = repo.processPayment(bookingId = "bk-1", amount = 250.0)

        assertTrue(result.isSuccess)
        val receipt = result.getOrNull()!!
        assertEquals("bk-1", receipt.bookingId)
        assertEquals(250.0, receipt.amount, 0.0)
        assertEquals(PaymentStatus.SUCCESS, receipt.status)
        assertEquals("4242", receipt.cardLast4)
        assertEquals("Visa", receipt.cardBrand)
        assertTrue(receipt.id.isNotBlank())
    }

    @Test
    fun `processPayment generates a unique receipt id per call`() = runTest {
        val r1 = repo.processPayment("bk-1", 100.0).getOrNull()!!
        val r2 = repo.processPayment("bk-2", 200.0).getOrNull()!!

        assert(r1.id != r2.id)
    }
}
