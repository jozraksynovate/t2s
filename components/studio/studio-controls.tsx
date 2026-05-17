"use client"

import { useState, useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "next-intl"

interface StudioControlsProps {
  generateText: string
  generateTooltip: string
}

export function StudioControls({ generateText, generateTooltip }: StudioControlsProps) {
  const t = useTranslations("Studio")
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState([0])

  const handleGenerate = () => {
    // Action implementation will go here
    console.log("Generating...")
  }

  // Unified keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Spacebar toggles Play/Pause
      if (e.code === "Space") {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      }

      // Ctrl/Cmd + Enter triggers Generate
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key === "Enter") {
        e.preventDefault()
        handleGenerate()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      {/* Playback controls (Left & Center) */}
      <div className="flex flex-1 items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsPlaying(!isPlaying)}
              className="shrink-0"
              aria-label={t("playTooltip")}
            >
              {isPlaying ? (
                <Pause fill="currentColor" aria-hidden="true" />
              ) : (
                <Play fill="currentColor" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            {t("playTooltip")}
            <Kbd>Space</Kbd>
          </TooltipContent>
        </Tooltip>
        
        <div className="text-sm text-muted-foreground tabular-nums shrink-0 select-none min-w-[40px] text-center">
          0:00
        </div>
        
        <Slider
          value={progress}
          max={100}
          step={1}
          onValueChange={setProgress}
          className="flex-1"
          aria-label="Progress"
        />
        
        <div className="text-sm text-muted-foreground tabular-nums shrink-0 select-none min-w-[40px] text-center">
          0:00
        </div>
      </div>

      {/* Generation action (Right) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={handleGenerate} className="shrink-0 font-medium">
            {generateText}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-2">
          {generateTooltip}
          <div className="flex items-center gap-1">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>Enter</Kbd>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
