import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { VOICE_DESCRIPTORS, type VoiceName } from "@/lib/studio"
import { z } from "zod"
import { adminAuth } from "@/lib/firebase-admin"
import * as admin from "firebase-admin"
import { CREDIT_CONSTANTS } from "@/lib/data"

interface SpeechConfig {
  voiceConfig?: {
    prebuiltVoiceConfig: {
      voiceName: string
    }
  }
  multiSpeakerVoiceConfig?: {
    speakerVoiceConfigs: Array<{
      speaker: string
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: string
        }
      }
    }>
  }
}

interface ConfigPayload {
  responseModalities: string[]
  speechConfig?: SpeechConfig
}

interface GenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string
          mimeType?: string
        }
      }>
    }
  }>
}

const generateSchema = z.object({
  activeTab: z.enum(["text", "composer"]),
  text: z.string().optional(),
  speakers: z.array(z.object({
    id: z.number(),
    name: z.string(),
    voice: z.string(),
    role: z.string().optional().default(""),
    style: z.string().optional().default(""),
    pace: z.string().optional().default(""),
    accent: z.string().optional().default("")
  })).min(1, "Minimal 1 speaker dibutuhkan"),
  blocks: z.array(z.object({
    id: z.string(),
    speakerId: z.number(),
    text: z.string()
  })).optional().default([]),
  globalConfig: z.object({
    scene: z.string().optional().default(""),
    sampleContext: z.string().optional().default("")
  })
})

/**
 * Creates a standard 44-byte RIFF/WAV header for 16-bit Mono PCM audio.
 * Gemini-TTS outputs raw Linear PCM (L16) mono @ 24,000 Hz.
 */
function createWavHeader(dataLength: number, sampleRate: number = 24000): Buffer {
  const header = Buffer.alloc(44)
  
  // 1. "RIFF" chunk descriptor
  header.write("RIFF", 0)                     // ChunkID
  header.writeUInt32LE(36 + dataLength, 4)   // ChunkSize (36 + Subchunk2Size)
  header.write("WAVE", 8)                     // Format
  
  // 2. "fmt " sub-chunk
  header.write("fmt ", 12)                    // Subchunk1ID
  header.writeUInt32LE(16, 16)                // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20)                 // AudioFormat (1 for LPCM)
  header.writeUInt16LE(1, 22)                 // NumChannels (1 for Mono)
  header.writeUInt32LE(sampleRate, 24)        // SampleRate (24000)
  header.writeUInt32LE(sampleRate * 2, 28)    // ByteRate (SampleRate * NumChannels * BitsPerSample/8) -> 24000 * 2 = 48000
  header.writeUInt16LE(2, 32)                 // BlockAlign (NumChannels * BitsPerSample/8) -> 2
  header.writeUInt16LE(16, 34)                // BitsPerSample (16-bit)
  
  // 3. "data" sub-chunk
  header.write("data", 36)                    // Subchunk2ID
  header.writeUInt32LE(dataLength, 40)        // Subchunk2Size
  
  return header
}

export async function POST(request: Request) {
  try {
    // 1. Secure Endpoint Guard: Verify the client-side Firebase Auth ID token using Google ADC
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Akses ditolak. Token autentikasi tidak ditemukan."
        },
        { status: 401 }
      )
    }

    const idToken = authHeader.substring(7)
    let uid: string
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      uid = decodedToken.uid
    } catch (err) {
      console.error("[T2S API] JWT Token verification failed:", err)
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Akses ditolak. Token autentikasi tidak valid atau sudah kedaluwarsa."
        },
        { status: 401 }
      )
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json(
        {
          error: "Malformed JSON",
          message: "Format data permintaan tidak valid (JSON rusak)."
        },
        { status: 400 }
      )
    }

    const parseResult = generateSchema.safeParse(rawBody)
    
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          message: "Data permintaan tidak valid atau tidak lengkap.",
          details: parseResult.error.format()
        },
        { status: 400 }
      )
    }
    
    const { activeTab, text, speakers, blocks, globalConfig } = parseResult.data

    // Calculate characters to be deducted
    let textLength = 0
    if (activeTab === "composer") {
      textLength = blocks.reduce((acc, block) => acc + block.text.trim().length, 0)
    } else {
      textLength = (text || "").trim().length
    }
    
    const charCount = textLength * CREDIT_CONSTANTS.CREDITS_PER_CHARACTER

    if (charCount === 0) {
      return NextResponse.json(
        { error: "Empty content", message: "Silakan ketik beberapa kata di naskah sebelum melakukan generate." },
        { status: 400 }
      )
    }

    // --- Secure Credit Check & Deduction ---
    const { adminDb } = await import("@/lib/firebase-admin")
    const userRef = adminDb.collection("users").doc(uid)
    const transactionRef = adminDb.collection("transactions").doc()
    
    try {
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef)
        
        if (!userDoc.exists) {
          transaction.set(userRef, {
            credits: CREDIT_CONSTANTS.INITIAL_BALANCE - charCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          })
          
          transaction.set(transactionRef, {
            userId: uid,
            type: "usage",
            amount: -charCount,
            initialGift: CREDIT_CONSTANTS.INITIAL_BALANCE,
            metadata: { type: activeTab, charCount },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
          return
        }
        
        const currentCredits = userDoc.data()?.credits ?? 0
        if (currentCredits < charCount) {
          throw new Error("INSUFFICIENT_CREDITS")
        }
        
        transaction.update(userRef, {
          credits: currentCredits - charCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        transaction.set(transactionRef, {
          userId: uid,
          type: "usage",
          amount: -charCount,
          metadata: { type: activeTab, charCount },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
      })
    } catch (err: any) {
      if (err.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: "INSUFFICIENT_CREDITS", message: "Saldo tidak mencukupi." },
          { status: 402 }
        )
      }
      console.error("[T2S API] Credit transaction failed:", err)
      return NextResponse.json(
        { error: "Internal Error", message: "Gagal memproses saldo." },
        { status: 500 }
      )
    }

    try {
      const isVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true" || !!process.env.GOOGLE_CLOUD_PROJECT
      const apiKey = process.env.GEMINI_API_KEY
      if (!isVertex && !apiKey) throw new Error("CREDENTIALS_MISSING")

      let ai: GoogleGenAI
      if (isVertex) {
        ai = new GoogleGenAI({
          vertexai: true,
          project: process.env.GOOGLE_CLOUD_PROJECT,
          location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
        })
      } else {
        ai = new GoogleGenAI({ apiKey })
      }

      let promptContent = ""
      const configPayload: ConfigPayload = { responseModalities: ["AUDIO"] }

      const hasSpeakerPrefixes = text ? speakers.some(sp => {
        const escapedName = sp.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(`^\\s*${escapedName}\\s*:`, "mi")
        return regex.test(text)
      }) : false

      const isMultiSpeaker = activeTab === "composer" || hasSpeakerPrefixes

      if (!isMultiSpeaker) {
        const narrator = speakers.find(s => s.id === 1) || speakers[0]
        const sections: string[] = []
        sections.push("# INSTRUCTIONS\nProfessional TTS engine. Only synthesize TRANSCRIPT section.")
        if (narrator) {
          sections.push(`# AUDIO PROFILE: ${narrator.name}`)
          const voiceDesc = VOICE_DESCRIPTORS[narrator.voice as VoiceName]
          if (voiceDesc) sections.push(`## VOICE: ${narrator.voice}. ${voiceDesc}`)
        }
        sections.push(`#### TRANSCRIPT\n${text || ""}`)
        promptContent = sections.join("\n\n")
        if (narrator) configPayload.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: narrator.voice } } }
      } else {
        const dialogueBlocks = activeTab === "composer"
          ? blocks.filter(b => b.text.trim().length > 0).map(b => {
              const sp = speakers.find(s => s.id === b.speakerId)
              return `${sp ? sp.name : `Speaker ${b.speakerId}`}: ${b.text}`
            }).join("\n")
          : (text || "")

        promptContent = `# INSTRUCTIONS\nMulti-speaker TTS. Do not read names.\n#### TRANSCRIPT\n${dialogueBlocks}`
        const activeVoiceConfigs = speakers.slice(0, 2).map(sp => ({
          speaker: sp.name,
          voiceConfig: { prebuiltVoiceConfig: { voiceName: sp.voice } }
        }))
        configPayload.speechConfig = { multiSpeakerVoiceConfig: { speakerVoiceConfigs: activeVoiceConfigs } }
      }

      const modelName = "gemini-3.1-flash-tts-preview"
      let base64Audio = ""
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const rawResponse = await ai.models.generateContent({ model: modelName, contents: promptContent, config: configPayload })
          const response = rawResponse as unknown as GenerateResponse
          base64Audio = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)?.inlineData?.data || ""
          if (base64Audio) break
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        } catch {
          if (attempt === 3) throw new Error("GENERATION_FAILED")
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        }
      }

      if (!base64Audio) throw new Error("EMPTY_AUDIO_DATA")
      const pcmBuffer = Buffer.from(base64Audio, "base64")
      const wavHeader = createWavHeader(pcmBuffer.length, 24000)
      const finalWavBuffer = Buffer.concat([wavHeader, pcmBuffer])

      return new Response(finalWavBuffer, {
        status: 200,
        headers: { "Content-Type": "audio/wav", "Content-Length": finalWavBuffer.length.toString() }
      })

    } catch (error: any) {
      console.error("[T2S API] Error during generation, refunding...", error)
      try {
        const refundTransactionRef = adminDb.collection("transactions").doc()
        await adminDb.runTransaction(async (transaction) => {
          transaction.update(userRef, {
            credits: admin.firestore.FieldValue.increment(charCount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          })
          transaction.set(refundTransactionRef, {
            userId: uid,
            type: "refund",
            amount: charCount,
            reason: "generation_failed",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          })
        })
      } catch (refundErr) {
        console.error("[T2S API] CRITICAL: Refund failed", refundErr)
      }
      return NextResponse.json({ error: "Internal Error", message: "Gagal memproses suara." }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Error", message: "Terjadi kesalahan sistem." }, { status: 500 })
  }
}
