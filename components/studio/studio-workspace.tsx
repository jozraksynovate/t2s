"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Copy } from "lucide-react"
import { StudioEditor } from "./studio-editor"
import { StudioComposer } from "./studio-composer"
import { StudioControls } from "./studio-controls"
import { StudioSettings } from "./studio-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DEFAULT_SPEAKERS, type Speaker, type SpeechBlock } from "@/lib/studio"

export function StudioWorkspace() {
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

  return (
    <main className="flex flex-1 overflow-hidden h-full">
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
              <Button variant="ghost" size="icon" aria-label={t("copy")}>
                <Copy aria-hidden="true" />
              </Button>
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
                onConfigureSpeaker={setActiveSpeakerId}
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
      
      <aside className="hidden md:block w-80 border-l overflow-y-auto p-4">
        <StudioSettings 
          mode={activeTab} 
          speakers={activeSpeakers} 
          onUpdateSpeaker={updateSpeaker}
          globalConfig={globalConfig}
          onUpdateGlobalConfig={updateGlobalConfig}
          activeSpeakerId={activeSpeakerId}
          onConfigureSpeaker={setActiveSpeakerId}
        />
      </aside>
    </main>
  )
}
