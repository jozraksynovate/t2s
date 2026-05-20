import { NextResponse } from "next/server"
import crypto from "crypto"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { generateDokuSignature } from "@/lib/doku"
import * as admin from "firebase-admin"

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY
const DOKU_BASE_URL = process.env.DOKU_API_BASE_URL || "https://api-sandbox.doku.com"
const DOKU_NOTIF_URL = process.env.DOKU_NOTIFICATION_URL

export async function POST(request: Request) {
  try {
    // Check for required configuration
    if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
      console.error("[Payment Checkout] Missing DOKU configuration.")
      return NextResponse.json(
        { error: "CONFIG_ERROR", message: "Pembayaran belum dikonfigurasi (DOKU_CLIENT_ID/SECRET missing)." },
        { status: 500 }
      )
    }

    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const idToken = authHeader.substring(7)
    let uid: string
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      uid = decodedToken.uid
    } catch (authError) {
      console.error("[Payment Checkout] Auth verification failed:", authError)
      return NextResponse.json({ error: "Unauthorized", message: "Sesi telah berakhir, silakan login kembali." }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { amount, credits } = body

    if (!amount || amount < 10000 || !credits) {
      return NextResponse.json({ error: "Invalid amount or credits", message: "Jumlah pembelian tidak valid." }, { status: 400 })
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const requestId = crypto.randomUUID()
    const timestamp = new Date().toISOString().split(".")[0] + "Z"

    const requestBody = {
      order: {
        amount: amount,
        invoice_number: invoiceNumber,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/billing`,
        line_items: [
          {
            name: `${credits.toLocaleString()} Credits`,
            price: amount,
            quantity: 1
          }
        ]
      },
      payment: {
        payment_due_date: 60 // 60 minutes
      }
    }

    const targetPath = "/checkout/v1/payment-url"
    const signature = generateDokuSignature({
      clientId: DOKU_CLIENT_ID,
      requestId,
      timestamp,
      targetPath,
      requestBody,
      secretKey: DOKU_SECRET_KEY
    })

    const response = await fetch(`${DOKU_BASE_URL}${targetPath}`, {
      method: "POST",
      headers: {
        "Client-Id": DOKU_CLIENT_ID,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        "Signature": signature,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[DOKU API Error]", errorData)
      return NextResponse.json(
        { error: "DOKU_API_FAILURE", message: "Gagal terhubung ke provider pembayaran." },
        { status: 502 }
      )
    }

    const data = await response.json()
    const paymentUrl = data?.response?.payment?.url

    if (!paymentUrl) {
      console.error("[DOKU API Error] Payment URL missing in response", data)
      return NextResponse.json(
        { error: "DOKU_RESPONSE_INVALID", message: "Respon pembayaran tidak valid." },
        { status: 502 }
      )
    }

    // Create a pending transaction record in Firestore
    await adminDb.collection("transactions").doc(invoiceNumber).set({
      userId: uid,
      type: "purchase",
      status: "pending",
      amount: credits,
      priceInIdr: amount,
      invoiceNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return NextResponse.json({ paymentUrl })

  } catch (error) {
    console.error("[Payment Checkout Error]", error)
    return NextResponse.json({ error: "Internal Error", message: "Terjadi kesalahan sistem." }, { status: 500 })
  }
}
