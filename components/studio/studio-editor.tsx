"use client"

import { Mic } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function StudioEditor() {
  const t = useTranslations("Studio")

  return (
    <div className="flex h-full w-full flex-col">
      <InputGroup className="flex-1" role="group" aria-labelledby="editor-title">
        <InputGroupTextarea
          id="textarea-text"
          placeholder={t("placeholder")}
          className="flex-1"
          aria-label={t("tabText")}
        />
        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupText>
            {t("tabTextLabel")}
          </InputGroupText>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <InputGroupButton 
                className="ml-auto opacity-0 group-hover/input-group:opacity-100 focus-visible:opacity-100 transition-opacity" 
                variant="outline"
                size="icon-sm"
                aria-label={t("speechToTextTooltip")}
              >
                <Mic aria-hidden="true" />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>{t("speechToTextTooltip")}</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
