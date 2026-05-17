"use client"

import { useState, useEffect, useRef } from "react"
import {
  Sparkles,
  X,
  User,
  Plus,
} from "lucide-react"
import TextareaAutosize from "react-textarea-autosize"
import { useTranslations } from "next-intl"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

import { type Speaker, type SpeechBlock } from "@/lib/studio"


interface StudioComposerProps {
  speakers: Speaker[]
  blocks: SpeechBlock[]
  onAddBlock: () => void
  onRemoveBlock: (id: string) => void
  onUpdateBlock: (id: string, text: string) => void
  onConfigureSpeaker?: (id: number) => void
}

export function StudioComposer({ 
  speakers, 
  blocks, 
  onAddBlock, 
  onRemoveBlock, 
  onUpdateBlock,
  onConfigureSpeaker
}: StudioComposerProps) {
  const t = useTranslations("Studio")
  const lastBlockRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the new block when it's added
  useEffect(() => {
    if (blocks.length > 1) {
      lastBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [blocks.length])


  return (
    <div className="flex w-full flex-col gap-4">
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1
        return (
          <div 
            key={block.id} 
            className="flex flex-col gap-4"
            ref={isLast ? lastBlockRef : null}
          >
            <InputGroup 
              className="h-auto! min-h-0!" 
              role="group" 
            >
              <TextareaAutosize
                data-slot="input-group-control"
                minRows={3}
                className="flex field-sizing-content min-h-16 w-full resize-none rounded-none bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-sm"
                placeholder={t("placeholder")}
                value={block.text}
                onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                aria-label={`${t("tabComposer")} ${index + 1}`}
              />
              <InputGroupAddon align="block-start" className="border-b">
                <InputGroupButton 
                  size="sm" 
                  variant="outline"
                  onClick={() => onConfigureSpeaker?.(block.speakerId)}
                >
                  <User data-icon="inline-start" aria-hidden="true" />
                  {t("speakerName", { number: block.speakerId })}
                  {" - "}
                  {speakers.find(s => s.id === block.speakerId)?.voice || "Zephyr"}
                </InputGroupButton>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <InputGroupButton 
                      className="ml-auto" 
                      size="icon-sm"
                      aria-label={t("aiTooltip")}
                    >
                      <Sparkles aria-hidden="true" />
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>{t("aiTooltip")}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <InputGroupButton 
                      variant="ghost" 
                      size="icon-sm"
                      aria-label={t("deleteTooltip")}
                      onClick={() => onRemoveBlock(block.id)}
                    >
                      <X aria-hidden="true" />
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>{t("deleteTooltip")}</TooltipContent>
                </Tooltip>
              </InputGroupAddon>
            </InputGroup>

            {isLast && (
              <div className="flex justify-center">
                <Button variant="ghost" onClick={onAddBlock}>
                  <Plus aria-hidden="true" />
                  {t("addBlock")}
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
