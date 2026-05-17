import { NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { VOICE_DESCRIPTORS, type VoiceName } from "@/lib/studio"
import { z } from "zod"

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
    const rawBody = await request.json()
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

    // 1. Determine Authentication and Platform Mode
    const isVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true" || !!process.env.GOOGLE_CLOUD_PROJECT
    const apiKey = process.env.GEMINI_API_KEY
    
    // Check if configuration is missing
    if (!isVertex && !apiKey) {
      return NextResponse.json(
        { 
          error: "Credentials missing", 
          message: "Kredensial tidak ditemukan. Silakan konfigurasikan Google Cloud Project (ADC) atau isi GEMINI_API_KEY di file .env.local Anda terlebih dahulu." 
        },
        { status: 400 }
      )
    }

    // 2. Initialize the unified Google Gen AI Client
    let ai: GoogleGenAI
    if (isVertex) {
      console.log(`[T2S API] Initializing with Gemini Enterprise Agent Platform (Vertex AI). Project: ${process.env.GOOGLE_CLOUD_PROJECT}, Location: ${process.env.GOOGLE_CLOUD_LOCATION || "us-central1"}`)
      ai = new GoogleGenAI({
        vertexai: true,
        project: process.env.GOOGLE_CLOUD_PROJECT,
        location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1"
      })
    } else {
      console.log("[T2S API] Initializing with Google AI Studio (Developer Mode)")
      ai = new GoogleGenAI({ apiKey })
    }

    // 3. Build Model Settings, Prompts & System Guidance (following the official Gemini TTS prompting guide)
    let promptContent = ""
    const configPayload: ConfigPayload = {
      responseModalities: ["AUDIO"]
    }

    // Smart Mode Detection: Determine if multi-speaker dialogue synthesis should be triggered.
    // If activeTab is "composer", or if the activeTab is "text" but contains speaker name prefixes (e.g. "Speaker 1:").
    const hasSpeakerPrefixes = text ? speakers.some(sp => {
      const escapedName = sp.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
      const regex = new RegExp(`^\\s*${escapedName}\\s*:`, "mi")
      return regex.test(text)
    }) : false

    const isMultiSpeaker = activeTab === "composer" || hasSpeakerPrefixes

    if (!isMultiSpeaker) {
      // Single speaker narration mode
      const narrator = speakers.find(s => s.id === 1) || speakers[0]
      const sections: string[] = []

      // Add structured markdown instructions to isolate operational metadata from text synthesis
      sections.push(
        `# INSTRUCTIONS\n` +
        `You are a professional text-to-speech engine. Please synthesize the script in the TRANSCRIPT section.\n` +
        `- **DO NOT** read the instructions, audio profiles, scene description, or director's notes aloud.\n` +
        `- **DO NOT** read inline emotional tags (e.g. \`[excitedly]\`, \`[whispers]\`, \`[shouting]\`, \`[laughs]\`) literally. Instead, interpret and perform the emotion or tone dynamically.\n` +
        `- Only synthesize the text inside the \`#### TRANSCRIPT\` section.\n` +
        `- Keep the speech natural, clean, and perfectly aligned with the character profile.`
      )

      if (narrator) {
        sections.push(`# AUDIO PROFILE: ${narrator.name}`)
        if (narrator.role) {
          sections.push(`## ROLE: ${narrator.role}`)
        }

        // Align the model's textual understanding with the prebuilt voice native qualities
        const voiceDesc = VOICE_DESCRIPTORS[narrator.voice as VoiceName]
        if (voiceDesc) {
          sections.push(`## VOICE CHARACTERISTICS: The voice you must synthesize is named "${narrator.voice}". It has a distinctive native tone described as: "${voiceDesc}". You must adopt this exact tone, pitch, gender, and timbre. Your speech generation must match this persona perfectly.`)
        }

        const directorNotes: string[] = []
        if (narrator.style) directorNotes.push(`Style: ${narrator.style}`)
        if (narrator.pace) directorNotes.push(`Pacing: ${narrator.pace}`)
        if (narrator.accent) directorNotes.push(`Accent: ${narrator.accent}`)

        if (directorNotes.length > 0) {
          sections.push(`### DIRECTOR'S NOTES\n${directorNotes.join("\n")}`)
        }
      }

      if (globalConfig.scene) {
        sections.push(`## THE SCENE: ${globalConfig.scene}`)
      }

      if (globalConfig.sampleContext) {
        sections.push(`### SAMPLE CONTEXT\n${globalConfig.sampleContext}`)
      }

      sections.push(`#### TRANSCRIPT\n${text || ""}`)
      promptContent = sections.join("\n\n")

      // Apply prebuilt voice
      if (narrator) {
        configPayload.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: narrator.voice
            }
          }
        }
      }
    } else {
      // Multi-speaker Dialogue Composer mode
      // Compile blocks or use text value directly if dialogue text is provided
      const dialogueBlocks = activeTab === "composer"
        ? blocks
            .filter(b => b.text.trim().length > 0)
            .map(b => {
              const sp = speakers.find(s => s.id === b.speakerId)
              const name = sp ? sp.name : `Speaker ${b.speakerId}`
              return `${name}: ${b.text}`
            })
            .join("\n")
        : (text || "")

      if (!dialogueBlocks.trim()) {
        return NextResponse.json(
          { error: "Empty content", message: "Silakan ketik beberapa kata di naskah sebelum melakukan generate." },
          { status: 400 }
        )
      }

      const sections: string[] = []

      // Add structured markdown instructions to isolate operational metadata from text synthesis
      sections.push(
        `# INSTRUCTIONS\n` +
        `You are a professional text-to-speech engine. Please synthesize the multi-speaker script in the TRANSCRIPT section.\n` +
        `- **DO NOT** read the instructions, audio profiles, scene description, or director's notes aloud.\n` +
        `- **DO NOT** read any of the speaker names (e.g. \`Speaker Name:\`) prefixed in the transcript aloud; use them only to map the voice config.\n` +
        `- **DO NOT** read inline emotional tags (e.g. \`[excitedly]\`, \`[whispers]\`, \`[shouting]\`, \`[laughs]\`) literally. Instead, interpret and perform the emotion or tone dynamically.\n` +
        `- Only synthesize the text inside the \`#### TRANSCRIPT\` section.\n` +
        `- Keep the speech natural, clean, and beautifully timed between characters.`
      )

      speakers.forEach(sp => {
        sections.push(`# AUDIO PROFILE: ${sp.name}`)
        if (sp.role) {
          sections.push(`## ROLE: ${sp.role}`)
        }

        // Align the model's textual understanding with the prebuilt voice native qualities
        const voiceDesc = VOICE_DESCRIPTORS[sp.voice as VoiceName]
        if (voiceDesc) {
          sections.push(`## VOICE CHARACTERISTICS: The voice you must synthesize is named "${sp.voice}". It has a distinctive native tone described as: "${voiceDesc}". You must adopt this exact tone, pitch, gender, and timbre. Your speech generation must match this persona perfectly.`)
        }

        const directorNotes: string[] = []
        if (sp.style) directorNotes.push(`Style: ${sp.style}`)
        if (sp.pace) directorNotes.push(`Pacing: ${sp.pace}`)
        if (sp.accent) directorNotes.push(`Accent: ${sp.accent}`)

        if (directorNotes.length > 0) {
          sections.push(`### DIRECTOR'S NOTES\n${directorNotes.join("\n")}`)
        }
      })

      if (globalConfig.scene) {
        sections.push(`## THE SCENE: ${globalConfig.scene}`)
      }

      if (globalConfig.sampleContext) {
        sections.push(`### SAMPLE CONTEXT\n${globalConfig.sampleContext}`)
      }

      sections.push(`#### TRANSCRIPT\n${dialogueBlocks}`)
      promptContent = sections.join("\n\n")

      // Setup multi-speaker voice mappings (Max 2 speakers supported in current preview mode)
      const activeVoiceConfigs = speakers.slice(0, 2).map(sp => ({
        speaker: sp.name,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: sp.voice
          }
        }
      }))

      configPayload.speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: activeVoiceConfigs
        }
      }
    }

    // 4. Generate Content from Gemini TTS Model with automated retry logic (Exponential Backoff)
    const modelName = "gemini-3.1-flash-tts-preview"
    let response: GenerateResponse | null = null
    let base64Audio = ""
    const maxRetries = 3

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[T2S API] Generating speech using ${modelName} model... (Attempt ${attempt}/${maxRetries})`)
        const rawResponse = await ai.models.generateContent({
          model: modelName,
          contents: promptContent,
          config: configPayload
        })
        response = rawResponse as unknown as GenerateResponse

        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
              base64Audio = part.inlineData.data
              break
            }
          }
        }

        if (base64Audio) {
          break
        } else {
          console.warn(`[T2S API] Attempt ${attempt} did not return audio data in response. Candidate detail:`, JSON.stringify(response?.candidates?.[0]))
          if (attempt === maxRetries) {
            throw new Error("Model failed to return audio data after multiple attempts.")
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`[T2S API] Attempt ${attempt} failed with exception:`, errorMessage)
        if (attempt === maxRetries) {
          throw err
        }
        // Exponential backoff delay: 1s, 2s, 4s
        const delayMs = 1000 * Math.pow(2, attempt - 1)
        console.log(`[T2S API] Waiting ${delayMs}ms before retrying...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    // 5. Extract raw PCM and synthesize WAV response

    if (!base64Audio) {
      console.error("[T2S API] Model response did not contain inline audio data. Candidate detail:", JSON.stringify(response?.candidates?.[0]))
      return NextResponse.json(
        { 
          error: "Generation failed", 
          message: "Gagal memproduksi suara. Model tidak mengembalikan data audio. Pastikan teks yang diinput valid dan tidak melanggar kebijakan konten." 
        },
        { status: 500 }
      )
    }

    // Decode base64 raw PCM and combine with WAV header
    const pcmBuffer = Buffer.from(base64Audio, "base64")
    const wavHeader = createWavHeader(pcmBuffer.length, 24000)
    const finalWavBuffer = Buffer.concat([wavHeader, pcmBuffer])

    console.log(`[T2S API] Speech generation successful. Audio size: ${finalWavBuffer.length} bytes (PCM: ${pcmBuffer.length} bytes).`)

    // Return the compliant audio/wav binary stream
    return new Response(finalWavBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": finalWavBuffer.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache"
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[T2S API] Unhandled generation exception:", error)
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: `Terjadi kesalahan saat memproses permintaan: ${errorMessage}` 
      },
      { status: 500 }
    )
  }
}
