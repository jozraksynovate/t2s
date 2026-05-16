"use client"

import {
  Sparkles,
  Trash2,
  User,
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

export function StudioComposer() {
  const t = useTranslations("Studio")

  return (
    <div className="flex w-full flex-col">
      <InputGroup 
        className="h-auto! min-h-0!" 
        role="group" 
        aria-labelledby="composer-title"
      >
        <TextareaAutosize
          data-slot="input-group-control"
          minRows={3}
          className="flex field-sizing-content min-h-16 w-full resize-none rounded-none bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-sm"
          placeholder={t("placeholder")}
          aria-label={t("tabComposer")}
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
                variant="destructive" 
                size="icon-sm"
                aria-label={t("deleteTooltip")}
              >
                <Trash2 aria-hidden="true" />
              </InputGroupButton>
            </TooltipTrigger>
            <TooltipContent>{t("deleteTooltip")}</TooltipContent>
          </Tooltip>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
