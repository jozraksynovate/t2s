"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/routing"
import { Settings, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useParams } from "next/navigation"
import { getProject, updateProject } from "@/lib/firestore-service"
import { projects as mockProjects } from "@/lib/data"
import { Spinner } from "@/components/ui/spinner"
import { StudioEditor } from "./studio-editor"
import { StudioComposer } from "./studio-composer"
import { StudioControls } from "./studio-controls"
import { StudioSettings } from "./studio-settings"
import { SpeakerConfigForm } from "./speaker-config-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DEFAULT_SPEAKERS, type Speaker, type SpeechBlock } from "@/lib/studio"
import { generateUUID } from "@/lib/utils"
import { TopupDialog } from "@/components/topup-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer"

export function StudioWorkspace({
  defaultSettingsOpen = true
}: {
  defaultSettingsOpen?: boolean
}) {
  const t = useTranslations("Studio")
  const tBilling = useTranslations("Billing")
  const router = useRouter()
  const { getFreshToken, user } = useAuth()
  const params = useParams()
  const projectId = params?.id as string

  const [activeTab, setActiveTab] = useState("text")
  const [activeSpeakerId, setActiveSpeakerId] = useState<number | null>(null)
  const [speakers, setSpeakers] = useState<Speaker[]>(DEFAULT_SPEAKERS)
  const [cachedSpeaker, setCachedSpeaker] = useState<Speaker>(DEFAULT_SPEAKERS[0])

  const activeSpeaker = activeSpeakerId !== null ? speakers.find((s) => s.id === activeSpeakerId) : null
  if (activeSpeaker && cachedSpeaker !== activeSpeaker) {
    setCachedSpeaker(activeSpeaker)
  }
  const [globalConfig, setGlobalConfig] = useState({
    scene: "",
    sampleContext: ""
  })
  const [blocks, setBlocks] = useState<SpeechBlock[]>([
    { id: generateUUID(), speakerId: 1, text: "" },
  ])
  const [isSettingsOpen, setIsSettingsOpen] = useState(defaultSettingsOpen)
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false)

  // Cloud Firestore Persistence States
  const [loadingProject, setLoadingProject] = useState(true)
  const hasLoaded = useRef(false)
  const isDirtyRef = useRef(false)
  const lastSavedJsonRef = useRef<string>("")

  // Audio Generation & Playback States
  const [singleText, setSingleText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Helper to compile blocks list to single text representation
  const compileBlocksToText = (blocksList: SpeechBlock[], currentSpeakers: Speaker[]) => {
    if (blocksList.length === 1 && !blocksList[0].text.trim()) {
      return ""
    }
    return blocksList
      .map(b => {
        const sp = currentSpeakers.find(s => s.id === b.speakerId)
        const name = sp ? sp.name : `Speaker ${b.speakerId}`
        return `${name}: ${b.text}`
      })
      .join("\n")
  }

  // 1. Fetch project from Firestore or fallback to mock data
  useEffect(() => {
    if (!user || !projectId) return

    let active = true
    const fetchProject = async () => {
      try {
        setLoadingProject(true)
        const data = await getProject(projectId, user.uid)

        if (!active) return

        if (data) {
          if (data.title) {
            document.title = `${data.title} | T2S`;
            window.dispatchEvent(new CustomEvent("project-loaded", { detail: { title: data.title } }));
          }
          if (data.speakers) setSpeakers(data.speakers)
          if (data.globalConfig) setGlobalConfig(data.globalConfig)
          if (data.blocks) {
            setBlocks(data.blocks)
            const compiled = compileBlocksToText(data.blocks, data.speakers || DEFAULT_SPEAKERS)
            setSingleText(compiled)
          }
          // Initialize lastSavedJsonRef to match loaded state
          lastSavedJsonRef.current = JSON.stringify({
            speakers: data.speakers || [],
            blocks: data.blocks || [],
            globalConfig: data.globalConfig || { scene: "", sampleContext: "" }
          })
        } else {
          // Fallback to static mock projects if not found in Firestore
          const mockProj = mockProjects.find(p => p.id === projectId)
          if (mockProj) {
            setSpeakers(DEFAULT_SPEAKERS)
            setBlocks([{ id: generateUUID(), speakerId: 1, text: mockProj.description }])
            setSingleText(`Speaker 1: ${mockProj.description}`)
            document.title = `${mockProj.title} | T2S`;
            window.dispatchEvent(new CustomEvent("project-loaded", { detail: { title: mockProj.title } }));
          }
        }
        hasLoaded.current = true
      } catch (err) {
        console.error("Failed to load project from Firestore:", err)
        toast.error("Gagal memuat proyek dari cloud.")
      } finally {
        if (active) {
          setLoadingProject(false)
        }
      }
    }

    fetchProject()

    return () => {
      active = false
    }
  }, [user, projectId])

  // 2. Debounced Autosave to Firestore with warning on close and instant save on page change
  useEffect(() => {
    if (!hasLoaded.current || !user || !projectId || projectId.startsWith("project-")) return

    // Deep check to prevent redundant saves if contents haven't actually changed
    const currentJson = JSON.stringify({ speakers, blocks, globalConfig })
    if (currentJson === lastSavedJsonRef.current) {
      isDirtyRef.current = false
      return
    }

    // Mark as dirty since actual data changed
    isDirtyRef.current = true

    const saveChanges = async () => {
      try {
        await updateProject(projectId, user.uid, {
          speakers,
          blocks,
          globalConfig,
        })
        lastSavedJsonRef.current = currentJson
        isDirtyRef.current = false
      } catch (err) {
        console.error("Failed to autosave project to Firestore:", err)
      }
    }

    const delayDebounceFn = setTimeout(saveChanges, 1000) // 1 second debounce for incredibly fast response

    return () => {
      clearTimeout(delayDebounceFn)
      // Save immediately on page change / unmount if there are unsaved changes
      if (isDirtyRef.current) {
        updateProject(projectId, user.uid, {
          speakers,
          blocks,
          globalConfig,
        }).then(() => {
          lastSavedJsonRef.current = currentJson
          isDirtyRef.current = false
        }).catch((err) => {
          console.error("Failed to save changes during cleanup:", err)
        })
      }
    }
  }, [speakers, blocks, globalConfig, user, projectId])

  // Warn user on browser close/reload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault()
        e.returnValue = "" // Standard browser prompt
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Automatically clean up object URLs to prevent browser memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  // Sync HTML5 Audio element events with React state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / (audio.duration || 1)) * 100)
    }

    const handleDurationChange = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      setProgress(0)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])


  // Pause audio when switching browser tabs (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isPlaying])

  const toggleSettings = (open: boolean) => {
    setIsSettingsOpen(open)
    document.cookie = `studio_settings_open=${open}; path=/; max-age=${60 * 60 * 24 * 7}; path=/`
  }

  const updateSpeaker = (id: number, updates: Partial<Speaker>) => {
    setSpeakers(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s)
      const compiled = compileBlocksToText(blocks, updated)
      setSingleText(compiled)
      return updated
    })
  }

  const updateGlobalConfig = (updates: Partial<typeof globalConfig>) => {
    setGlobalConfig(prev => ({ ...prev, ...updates }))
  }

  const addBlock = () => {
    const lastBlock = blocks[blocks.length - 1]
    const nextSpeakerId = lastBlock.speakerId === 1 ? 2 : 1
    const newBlock = { id: generateUUID(), speakerId: nextSpeakerId, text: "" }

    setBlocks(prev => {
      const updated = [...prev, newBlock]
      const compiled = compileBlocksToText(updated, speakers)
      setSingleText(compiled)
      return updated
    })
  }

  const removeBlock = (id: string) => {
    if (blocks.length === 1) return
    setBlocks(prev => {
      const updated = prev.filter((block) => block.id !== id)
      const compiled = compileBlocksToText(updated, speakers)
      setSingleText(compiled)
      return updated
    })
  }

  const updateBlock = (id: string, text: string) => {
    setBlocks(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, text } : b)
      const compiled = compileBlocksToText(updated, speakers)
      setSingleText(compiled)
      return updated
    })
  }

  // Parse unified single text editor lines back into structured dialogue blocks
  const handleTextChange = (newText: string) => {
    setSingleText(newText)

    const lines = newText.split("\n")
    const newBlocks: SpeechBlock[] = []
    let currentBlock: SpeechBlock | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() === "") {
        continue
      }

      // Match "SpeakerName: Text" or custom names (case-insensitive)
      const matchedSpeaker = speakers.find(sp => {
        const escapedName = sp.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(`^\\s*${escapedName}\\s*:\\s*(.*)$`, "i")
        return regex.test(line)
      })

      if (matchedSpeaker) {
        // Line starts with a speaker prefix! Extract the text after the colon
        const colonIndex = line.indexOf(":")
        const blockText = line.substring(colonIndex + 1).trim()

        currentBlock = {
          id: generateUUID(),
          speakerId: matchedSpeaker.id,
          text: blockText
        }
        newBlocks.push(currentBlock)
      } else {
        // If there's no speaker prefix, append line to the active block
        if (currentBlock) {
          // Keep newlines if it's within the block
          currentBlock.text += (currentBlock.text ? "\n" : "") + line.trim()
        } else {
          // If we have no active block, create one for Speaker 1
          currentBlock = {
            id: generateUUID(),
            speakerId: 1,
            text: line.trim()
          }
          newBlocks.push(currentBlock)
        }
      }
    }

    // Filter out blocks that are completely empty if there are multiple,
    // but ensure we keep at least one block.
    const filteredBlocks = newBlocks.filter(b => b.text.trim().length > 0 || newBlocks.length === 1)

    if (filteredBlocks.length > 0) {
      setBlocks(filteredBlocks)
    } else {
      setBlocks([{ id: generateUUID(), speakerId: 1, text: "" }])
    }
  }

  // Only show speakers that are currently used in the blocks
  const activeSpeakers = speakers.filter(speaker =>
    blocks.some(block => block.speakerId === speaker.id)
  )

  const settingsScrollRef = useRef<HTMLDivElement>(null)
  const prevActiveSpeakersLengthRef = useRef(activeSpeakers.length)

  useEffect(() => {
    if (activeSpeakers.length > prevActiveSpeakersLengthRef.current) {
      setTimeout(() => {
        settingsScrollRef.current?.scrollTo({
          top: settingsScrollRef.current.scrollHeight,
          behavior: "smooth"
        })
      }, 100)
    }
    prevActiveSpeakersLengthRef.current = activeSpeakers.length
  }, [activeSpeakers.length])

  // Audio Actions
  const handleGenerate = async () => {
    if (isGenerating) return

    // Validation
    if (activeTab === "text" && !singleText.trim()) {
      toast.error(t("emptyTextError") || "Silakan masukkan teks terlebih dahulu.")
      return
    }

    if (activeTab === "composer") {
      const hasContent = blocks.some(b => b.text.trim().length > 0)
      if (!hasContent) {
        toast.error(t("emptyBlocksError") || "Silakan ketik teks di setidaknya satu blok dialog terlebih dahulu.")
        return
      }
    }

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    setIsGenerating(true)

    try {
      const token = await getFreshToken()
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          activeTab,
          text: singleText,
          speakers,
          blocks,
          globalConfig,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Gagal memproduksi suara."
        let errorCode = ""
        const contentType = response.headers.get("Content-Type") || ""
        
        if (contentType.includes("application/json")) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
            errorCode = errorData.error || ""
          } catch { }
        }

        // Special handling for insufficient credits (402)
        if (response.status === 402 || errorCode === "INSUFFICIENT_CREDITS") {
          toast(errorMessage, {
            action: (
              <TopupDialog>
                <Button size="sm" variant="outline" className="h-8">
                  Top Up
                </Button>
              </TopupDialog>
            ),
          })
          return
        }

        throw new Error(errorMessage)
      }

      const blob = await response.blob()

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }

      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setCurrentTime(0)
      setProgress(0)

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      audioRef.current.src = url
      audioRef.current.load()

      // Automatically play the generated audio
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn("[Workspace] Autoplay prevented or interrupted:", err)
        })

    } catch (error: unknown) {
      console.error("[Workspace] Generation failed:", error)
      const message = error instanceof Error ? error.message : "Gagal melakukan generate audio."
      toast.error(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPauseToggle = () => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Playback failed:", err)
          toast.error("Gagal memutar audio.")
        })
    }
  }

  const handleSeek = (newProgress: number) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return

    const newTime = (newProgress / 100) * audio.duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(newProgress)
  }

  const handleExport = useCallback(() => {
    if (!audioUrl) {
      toast.error(t("noAudioToExport") || "Silakan lakukan generate audio terlebih dahulu sebelum mengekspor.")
      return
    }

    const link = document.createElement("a")
    link.href = audioUrl

    // Clean, formatted timestamp
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")
    link.download = `t2s-${activeTab === "text" ? "narrator" : "podcast"}-${timestamp}.wav`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("File audio WAV berhasil diexport!")
  }, [audioUrl, activeTab, t])

  // Listen to export trigger from global layout header
  useEffect(() => {
    const handleTriggerExport = () => {
      handleExport()
    }
    window.addEventListener("trigger-export", handleTriggerExport)
    return () => {
      window.removeEventListener("trigger-export", handleTriggerExport)
    }
  }, [handleExport])

  // Time format utility (e.g. 1.25s -> "0:01", 62s -> "1:02")
  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00"
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentTimeStr = formatTime(currentTime)
  const durationStr = formatTime(duration)

  const isGenerateDisabled = activeTab === "text"
    ? !singleText.trim()
    : !blocks.some(b => b.text.trim().length > 0)

  if (loadingProject) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background animate-in fade-in duration-300">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  return (
    <main className="flex flex-1 overflow-hidden h-full w-full">
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val)
            }}
            className="flex flex-1 flex-col"
          >
            <div className="flex items-center justify-between">
              <TabsList className="w-fit">
                <TabsTrigger value="text">{t("tabText")}</TabsTrigger>
                <TabsTrigger value="composer">{t("tabComposer")}</TabsTrigger>
              </TabsList>
              <div className="hidden md:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("aiTooltip")}
                >
                  <Sparkles aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSettings(!isSettingsOpen)}
                  aria-label={t("toggleSettings")}
                >
                  <Settings aria-hidden="true" />
                </Button>
              </div>
              <div className="flex md:hidden items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("aiTooltip")}
                >
                  <Sparkles aria-hidden="true" />
                </Button>
                <Drawer direction="right" open={isMobileSettingsOpen} onOpenChange={setIsMobileSettingsOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("toggleSettings")}
                    >
                      <Settings aria-hidden="true" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>{t("config")}</DrawerTitle>
                      <DrawerDescription>
                        {t("configDescription")}
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="no-scrollbar overflow-y-auto px-4 pb-4 flex-1">
                      <StudioSettings
                        mode={activeTab}
                        speakers={activeSpeakers}
                        onUpdateSpeaker={updateSpeaker}
                        globalConfig={globalConfig}
                        onUpdateGlobalConfig={updateGlobalConfig}
                        activeSpeakerId={activeSpeakerId}
                        onConfigureSpeaker={setActiveSpeakerId}
                      />
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline" className="w-full">
                          {t("close")}
                        </Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
            <TabsContent value="text" className="flex flex-1 flex-col">
              <StudioEditor value={singleText} onChange={handleTextChange} />
            </TabsContent>
            <TabsContent value="composer" className="">
              <StudioComposer
                speakers={speakers}
                blocks={blocks}
                onAddBlock={addBlock}
                onRemoveBlock={removeBlock}
                onUpdateBlock={updateBlock}
                onConfigureSpeaker={(id) => {
                  setActiveSpeakerId(id)
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="border-t p-4 flex items-center gap-4">
          <StudioControls
            generateText={t("generate")}
            generateTooltip={t("generateTooltip")}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            onPlayPauseToggle={handlePlayPauseToggle}
            progress={progress}
            onSeek={handleSeek}
            currentTimeStr={currentTimeStr}
            durationStr={durationStr}
            onGenerate={handleGenerate}
            hasAudio={!!audioUrl}
            isGenerateDisabled={isGenerateDisabled}
          />
        </div>
      </section>

      <aside
        className={`hidden md:block h-full shrink-0 border-l bg-background overflow-hidden transition-[width,border-color] duration-200 ease-linear ${isSettingsOpen ? "w-80 border-border" : "w-0 border-transparent"
          }`}
      >
        <div ref={settingsScrollRef} className="w-80 p-4 h-full overflow-y-auto">
          <StudioSettings
            mode={activeTab}
            speakers={activeSpeakers}
            onUpdateSpeaker={updateSpeaker}
            globalConfig={globalConfig}
            onUpdateGlobalConfig={updateGlobalConfig}
            activeSpeakerId={activeSpeakerId}
            onConfigureSpeaker={setActiveSpeakerId}
          />
        </div>
      </aside>

      <Drawer
        direction="right"
        open={activeSpeakerId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSpeakerId(null)
          }
        }}
      >
        <SpeakerConfigForm
          speaker={speakers.find((s) => s.id === activeSpeakerId) || cachedSpeaker}
          onUpdate={(updates) => {
            const currentId = activeSpeakerId || cachedSpeaker.id
            updateSpeaker(currentId, updates)
          }}
        />
      </Drawer>
    </main>
  )
}

