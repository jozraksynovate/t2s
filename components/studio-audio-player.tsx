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

export function StudioAudioPlayer() {
  const t = useTranslations("Studio")
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState([0])

  // Spacebar shortcut for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.code === "Space") {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
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
  )
}
