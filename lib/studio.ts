export interface Speaker {
  id: number
  name: string
  voice: string
  // Advanced Prompting
  role: string
  style: string
  pace: string
  accent: string
}






export interface SpeechBlock {
  id: string
  speakerId: number
  text: string
}


export const VOICE_OPTIONS = [
  "Achernar", "Achird", "Algenib", "Algieba", "Alnilam",
  "Aoede", "Autonoe", "Callirrhoe", "Charon", "Despina",
  "Enceladus", "Erinome", "Fenrir", "Gacrux", "Iapetus",
  "Kore", "Laomedeia", "Leda", "Orus", "Puck",
  "Pulcherrima", "Rasalgethi", "Sadachbia", "Sadaltager", "Schedar",
  "Sulafat", "Umbriel", "Vindemiatrix", "Zephyr", "Zubenelgenubi"
] as const

export type VoiceName = (typeof VOICE_OPTIONS)[number]

export const VOICE_DESCRIPTORS: Record<VoiceName, string> = {
  Zephyr: "Bright",
  Puck: "Upbeat",
  Charon: "Informative",
  Kore: "Firm",
  Fenrir: "Excitable",
  Leda: "Youthful",
  Orus: "Firm",
  Aoede: "Breezy",
  Callirrhoe: "Easy-going",
  Autonoe: "Bright",
  Enceladus: "Breathy",
  Iapetus: "Clear",
  Umbriel: "Easy-going",
  Algieba: "Smooth",
  Despina: "Smooth",
  Erinome: "Clear",
  Algenib: "Gravelly",
  Rasalgethi: "Informative",
  Laomedeia: "Upbeat",
  Achernar: "Soft",
  Alnilam: "Firm",
  Schedar: "Even",
  Gacrux: "Mature",
  Pulcherrima: "Forward",
  Achird: "Friendly",
  Zubenelgenubi: "Casual",
  Vindemiatrix: "Gentle",
  Sadachbia: "Lively",
  Sadaltager: "Knowledgeable",
  Sulafat: "Warm",
}

export const TTS_MODELS = [
  {
    id: "gemini-3.1-flash-tts-preview",
    name: "Gemini 3.1 Flash TTS Preview",
    provider: "Google Gemini"
  }
] as const

export const DEFAULT_SPEAKERS: Speaker[] = [
  { 
    id: 1, 
    name: "Speaker 1", 
    voice: "Zephyr",
    role: "",
    style: "",
    pace: "",
    accent: "",
  },
  { 
    id: 2, 
    name: "Speaker 2", 
    voice: "Puck",
    role: "",
    style: "",
    pace: "",
    accent: "",
  },
]








