"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function StudioGenerateFooter({ generateText, generateTooltip }: { generateText: string, generateTooltip: string }) {
  const handleGenerate = () => {
    // Action implementation will go here
    console.log("Generating...")
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={handleGenerate} className="shrink-0">
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
  )
}
