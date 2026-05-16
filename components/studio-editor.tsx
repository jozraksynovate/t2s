"use client"

import {
  Sparkles,
  X,
  User,
} from "lucide-react"
import { useTranslations } from "next-intl"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
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
          <InputGroupButton 
            size="sm" 
            variant="outline"
            aria-label={t("speaker")}
          >
            <User data-icon="inline-start" aria-hidden="true" />
            {t("speaker")}
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
              >
                <X aria-hidden="true" />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>{t("deleteTooltip")}</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
