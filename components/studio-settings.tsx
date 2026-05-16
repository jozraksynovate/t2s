"use client"

import { useTranslations } from "next-intl"
import { Settings2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldGroup,
  Field,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import {
  Drawer,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

import { TTS_MODELS, type Speaker } from "@/lib/studio"
import { SpeakerConfigForm } from "@/components/speaker-config-form"


interface StudioSettingsProps {
  mode: string
  speakers: Speaker[]
  onUpdateSpeaker: (id: number, updates: Partial<Speaker>) => void
  globalConfig: {
    scene: string
    sampleContext: string
  }
  onUpdateGlobalConfig: (updates: Partial<{ scene: string, sampleContext: string }>) => void
}

export function StudioSettings({
  mode,
  speakers: allSpeakers,
  onUpdateSpeaker,
  globalConfig,
  onUpdateGlobalConfig
}: StudioSettingsProps) {
  const t = useTranslations("Studio")

  const isComposer = mode === "composer"
  const speakers = isComposer ? allSpeakers : allSpeakers.slice(0, 1)

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>{t("config")}</FieldLegend>
        <FieldDescription>
          {t("modelDescription")}
        </FieldDescription>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="model-select">{t("modelLabel")}</FieldLabel>
            <Select defaultValue={TTS_MODELS[0].id}>
              <SelectTrigger id="model-select" className="w-full">
                <SelectValue placeholder={t("modelPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Google Gemini</SelectLabel>
                  {TTS_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

        </FieldGroup>
      </FieldSet>


      <FieldSeparator />

      <FieldSet>
        <FieldLegend>{t("sceneLabel")}</FieldLegend>
        <FieldDescription>
          {t("sceneDescription")}
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="scene">{t("locationLabel")}</FieldLabel>
            <Input
              id="scene"
              placeholder={t("scenePlaceholder")}
              value={globalConfig.scene}
              onChange={(e) => onUpdateGlobalConfig({ scene: e.target.value })}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="sample-context">{t("contextualLabel")}</FieldLabel>
            <Input
              id="sample-context"
              placeholder={t("sampleContextPlaceholder")}
              value={globalConfig.sampleContext}
              onChange={(e) => onUpdateGlobalConfig({ sampleContext: e.target.value })}
            />
          </Field>

        </FieldGroup>
      </FieldSet>



      <FieldSeparator />

      <FieldSet>
        <FieldLegend>{t("speakerSettings")}</FieldLegend>
        <FieldDescription>
          {t("speakerSettingsDescription")}
        </FieldDescription>
        <FieldGroup>
          <ItemGroup>
            {speakers.map((speaker) => (
              <Item key={speaker.id} variant="outline">
                <ItemContent>
                  <ItemTitle>{speaker.name} - {speaker.voice}</ItemTitle>
                  <ItemDescription className="line-clamp-2">
                    {speaker.role || t("configureSpeaker", { name: speaker.name })}
                  </ItemDescription>

                </ItemContent>
                <ItemActions>
                  <Drawer direction="right">
                    <DrawerTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        className="rounded-full"
                        aria-label={t("configureSpeaker", { name: speaker.name })}
                      >
                        <Settings2 className="size-4" />
                      </Button>
                    </DrawerTrigger>
                    <SpeakerConfigForm
                      speaker={speaker}
                      onUpdate={(updates) => onUpdateSpeaker(speaker.id, updates)}
                    />
                  </Drawer>
                </ItemActions>

              </Item>
            ))}
          </ItemGroup>
        </FieldGroup>
      </FieldSet>

    </FieldGroup>
  )
}
