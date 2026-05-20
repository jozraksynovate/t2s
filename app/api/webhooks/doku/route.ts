import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { verifyDokuWebhook } from "@/lib/doku"
import * as admin from "firebase-admin"

const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY

export async function POST(request: Request) {
  const requestId = request.headers.get("request-id") || "unknown"
  
  try {
    if (!DOKU_SECRET_KEY) {
      console.error("[DOKU Webhook] CRITICAL: DOKU_SECRET_KEY is not configured.")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const rawBody = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    // 1. Verify DOKU Signature
    // The targetPath must match the endpoint configured in DOKU Dashboard exactly.
    const targetPath = "/api/webhooks/doku" 
    const isValid = verifyDokuWebhook(headers, rawBody, DOKU_SECRET_KEY, targetPath)

    if (!isValid) {
      console.warn(`[DOKU Webhook] Invalid signature. Request-Id: ${requestId}`)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const transactionId = payload.order?.invoice_number
    const transactionStatus = payload.transaction?.status

    if (!transactionId) {
      console.error(`[DOKU Webhook] Missing invoice number. Request-Id: ${requestId}`)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    console.log(`[DOKU Webhook] Received notification for INV: ${transactionId}, Status: ${transactionStatus}`)

    if (transactionStatus !== "SUCCESS") {
      return NextResponse.json({ message: "Acknowledged" }, { status: 200 })
    }

    // 2. Atomic Update: Mark transaction as success and add credits to user
    const transactionRef = adminDb.collection("transactions").doc(transactionId)
    
    try {
      const result = await adminDb.runTransaction(async (dbTransaction) => {
        const transDoc = await dbTransaction.get(transactionRef)
        
        if (!transDoc.exists) {
          throw new Error("TRANSACTION_NOT_FOUND")
        }

        const transData = transDoc.data()
        if (transData?.status === "success") {
          return "ALREADY_PROCESSED"
        }

        const userId = transData?.userId
        const creditAmount = transData?.amount
        const userRef = adminDb.collection("users").doc(userId)

        // Update User Balance
        dbTransaction.update(userRef, {
          credits: admin.firestore.FieldValue.increment(creditAmount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        // Mark Transaction as Success
        dbTransaction.update(transactionRef, {
          status: "success",
          dokuPayload: payload,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        })
        
        return "SUCCESS"
      })

      if (result === "ALREADY_PROCESSED") {
        console.log(`[DOKU Webhook] Transaction ${transactionId} was already processed.`)
      } else {
        console.log(`[DOKU Webhook] Successfully processed credits for INV: ${transactionId}`)
      }
      
      return NextResponse.json({ message: "Success" }, { status: 200 })

    } catch (err: any) {
      if (err.message === "TRANSACTION_NOT_FOUND") {
        console.error(`[DOKU Webhook] Payment for unknown invoice: ${transactionId}`)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }
      throw err
    }

  } catch (error) {
    console.error(`[DOKU Webhook Error] Request-Id: ${requestId}`, error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
