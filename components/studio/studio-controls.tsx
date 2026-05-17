"use client"

import { useEffect } from "react"
import { Play, Pause } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
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
  isGenerating: boolean
  isPlaying: boolean
  onPlayPauseToggle: () => void
  progress: number
  onSeek: (value: number) => void
  currentTimeStr: string
  durationStr: string
  onGenerate: () => void
  hasAudio: boolean
  isGenerateDisabled?: boolean
}

export function StudioControls({
  generateText,
  generateTooltip,
  isGenerating,
  isPlaying,
  onPlayPauseToggle,
  progress,
  onSeek,
  currentTimeStr,
  durationStr,
  onGenerate,
  hasAudio,
  isGenerateDisabled = false,
}: StudioControlsProps) {
  const t = useTranslations("Studio")

  // Unified keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      
      // Spacebar toggles Play/Pause (only if audio is loaded and NOT typing)
      if (e.code === "Space" && hasAudio && !isTyping) {
        e.preventDefault()
        onPlayPauseToggle()
      }

      // Ctrl/Cmd + Enter triggers Generate (allowed even when typing)
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key === "Enter") {
        e.preventDefault()
        if (!isGenerating && !isGenerateDisabled) {
          onGenerate()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onPlayPauseToggle, onGenerate, isGenerating, hasAudio])

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
              onClick={onPlayPauseToggle}
              className="shrink-0"
              disabled={!hasAudio}
              aria-label={t("playTooltip") || "Play/Pause"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            {t("playTooltip") || "Play/Pause"}
            <Kbd>Space</Kbd>
          </TooltipContent>
        </Tooltip>
        
        <div className="text-sm text-muted-foreground tabular-nums shrink-0 select-none min-w-[40px] text-center">
          {currentTimeStr}
        </div>
        
        <Slider
          value={[progress]}
          max={100}
          step={0.1}
          onValueChange={(val) => onSeek(val[0])}
          className="flex-1"
          disabled={!hasAudio}
          aria-label="Progress"
        />
        
        <div className="text-sm text-muted-foreground tabular-nums shrink-0 select-none min-w-[40px] text-center">
          {durationStr}
        </div>
      </div>

      {/* Action panel (Right) */}
      <div className="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onGenerate} 
              disabled={isGenerating || isGenerateDisabled} 
              className="shrink-0 font-medium"
            >
              {isGenerating ? (
                <>
                  <Spinner />
                  <span>{t("generating")}</span>
                </>
              ) : (
                <span>{generateText}</span>
              )}
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
    </div>
  )
}

