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

interface SpeechBlock {
  id: string
  speakerId: number
  text: string
}

export function StudioComposer() {
  const t = useTranslations("Studio")
  const [blocks, setBlocks] = useState<SpeechBlock[]>([
    { id: crypto.randomUUID(), speakerId: 1, text: "" },
  ])
  const lastBlockRef = useRef<HTMLDivElement>(null)

  const addBlock = () => {
    const lastBlock = blocks[blocks.length - 1]
    const nextSpeakerId = lastBlock.speakerId === 1 ? 2 : 1
    
    setBlocks([
      ...blocks,
      { id: crypto.randomUUID(), speakerId: nextSpeakerId, text: "" },
    ])
  }

  const removeBlock = (id: string) => {
    if (blocks.length === 1) return // Keep at least one block
    setBlocks(blocks.filter((block) => block.id !== id))
  }

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
                defaultValue={block.text}
                aria-label={`${t("tabComposer")} ${index + 1}`}
              />
              <InputGroupAddon align="block-start" className="border-b">
                <InputGroupButton 
                  size="sm" 
                  variant="outline"
                >
                  <User data-icon="inline-start" aria-hidden="true" />
                  {block.speakerId === 1 ? "Speaker 1 - Zephyr" : "Speaker 2 - Puck"}
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
                      onClick={() => removeBlock(block.id)}
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
                <Button variant="ghost" onClick={addBlock}>
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
