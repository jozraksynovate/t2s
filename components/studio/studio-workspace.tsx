"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Settings, Sparkles } from "lucide-react"
import { StudioEditor } from "./studio-editor"
import { StudioComposer } from "./studio-composer"
import { StudioControls } from "./studio-controls"
import { StudioSettings } from "./studio-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DEFAULT_SPEAKERS, type Speaker, type SpeechBlock } from "@/lib/studio"
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
  const [activeTab, setActiveTab] = useState("text")
  const [activeSpeakerId, setActiveSpeakerId] = useState<number | null>(null)

  const [speakers, setSpeakers] = useState<Speaker[]>(DEFAULT_SPEAKERS)
  const [globalConfig, setGlobalConfig] = useState({
    scene: "",
    sampleContext: ""
  })
  const [blocks, setBlocks] = useState<SpeechBlock[]>([
    { id: crypto.randomUUID(), speakerId: 1, text: "" },
  ])
  const [isSettingsOpen, setIsSettingsOpen] = useState(defaultSettingsOpen)
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false)

  const toggleSettings = (open: boolean) => {
    setIsSettingsOpen(open)
    document.cookie = `studio_settings_open=${open}; path=/; max-age=${60 * 60 * 24 * 7}; path=/`
  }

  const updateSpeaker = (id: number, updates: Partial<Speaker>) => {
    setSpeakers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const updateGlobalConfig = (updates: Partial<typeof globalConfig>) => {
    setGlobalConfig(prev => ({ ...prev, ...updates }))
  }

  const addBlock = () => {
    const lastBlock = blocks[blocks.length - 1]
    const nextSpeakerId = lastBlock.speakerId === 1 ? 2 : 1

    setBlocks(prev => [
      ...prev,
      { id: crypto.randomUUID(), speakerId: nextSpeakerId, text: "" },
    ])
  }

  const removeBlock = (id: string) => {
    if (blocks.length === 1) return
    setBlocks(prev => prev.filter((block) => block.id !== id))
  }

  const updateBlock = (id: string, text: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, text } : b))
  }

  // Only show speakers that are currently used in the blocks
  const activeSpeakers = speakers.filter(speaker =>
    blocks.some(block => block.speakerId === speaker.id)
  )

  const settingsScrollRef = useRef<HTMLDivElement>(null)
  const prevActiveSpeakersLengthRef = useRef(activeSpeakers.length)

  useEffect(() => {
    if (activeSpeakers.length > prevActiveSpeakersLengthRef.current) {
      // Small timeout to allow React to mount the new speaker configuration card in the DOM
      setTimeout(() => {
        settingsScrollRef.current?.scrollTo({
          top: settingsScrollRef.current.scrollHeight,
          behavior: "smooth"
        })
      }, 100)
    }
    prevActiveSpeakersLengthRef.current = activeSpeakers.length
  }, [activeSpeakers.length])

  return (
    <main className="flex flex-1 overflow-hidden h-full w-full">
      <section className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
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
              <StudioEditor />
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
                  toggleSettings(true)
                  setIsMobileSettingsOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="border-t p-4 flex items-center gap-4">
          <StudioControls
            generateText={t("generate")}
            generateTooltip={t("generateTooltip")}
          />
        </div>
      </section>

      <aside
        className={`hidden md:block h-full shrink-0 border-l bg-background overflow-hidden transition-[width,border-color] duration-200 ease-linear ${
          isSettingsOpen ? "w-80 border-border" : "w-0 border-transparent"
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
    </main>
  )
}
