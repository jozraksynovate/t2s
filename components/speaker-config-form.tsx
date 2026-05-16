"use client"

import { useTranslations } from "next-intl"
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { VOICE_OPTIONS, type Speaker } from "@/lib/studio"

interface SpeakerConfigFormProps {
  speaker: Speaker
  onUpdate?: (updates: Partial<Speaker>) => void
}

export function SpeakerConfigForm({ speaker, onUpdate }: SpeakerConfigFormProps) {
  const t = useTranslations("Studio")

  const handleChange = (key: keyof Speaker, value: string) => {
    onUpdate?.({ [key]: value })
  }

  const handleVoiceChange = (voice: string) => {
    onUpdate?.({ voice })
  }

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{t("speakerConfigTitle")}</DrawerTitle>
        <DrawerDescription>
          {t("speakerConfigDescription")}
        </DrawerDescription>
      </DrawerHeader>

      <div className="no-scrollbar overflow-y-auto p-4">
        <FieldGroup>
          {/* Audio Profile Section */}
          <FieldSet>
            <FieldLegend>{t("audioProfileLabel")}</FieldLegend>
            <FieldDescription>
              {t("audioProfileDescription")}
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`role-${speaker.id}`}>
                  {t("roleLabel")}
                </FieldLabel>
                <Input
                  id={`role-${speaker.id}`}
                  placeholder={t("audioProfilePlaceholder")}
                  value={speaker.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          {/* Director's Notes Section */}
          <FieldSet>
            <FieldLegend>{t("directorsNotesLabel")}</FieldLegend>
            <FieldDescription>
              {t("directorsNotesDescription")}
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`style-${speaker.id}`}>
                  {t("styleLabel")}
                </FieldLabel>
                <Input
                  id={`style-${speaker.id}`}
                  placeholder={t("stylePlaceholder")}
                  value={speaker.style}
                  onChange={(e) => handleChange("style", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`pace-${speaker.id}`}>
                  {t("paceLabel")}
                </FieldLabel>
                <Input
                  id={`pace-${speaker.id}`}
                  placeholder={t("pacePlaceholder")}
                  value={speaker.pace}
                  onChange={(e) => handleChange("pace", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`accent-${speaker.id}`}>
                  {t("accentLabel")}
                </FieldLabel>
                <Input
                  id={`accent-${speaker.id}`}
                  placeholder={t("accentPlaceholder")}
                  value={speaker.accent}
                  onChange={(e) => handleChange("accent", e.target.value)}
                />
              </Field>

            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          {/* Voice Selection Section */}
          <FieldSet>
            <FieldLegend>{t("voiceLabel")}</FieldLegend>
            <FieldDescription>
              {t("voiceDescription")}
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`voice-${speaker.id}`}>
                  {t("voiceLabel")}
                </FieldLabel>
                <Select value={speaker.voice} onValueChange={handleVoiceChange}>
                  <SelectTrigger id={`voice-${speaker.id}`} className="w-full">
                    <SelectValue placeholder={t("voicePlaceholder")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {VOICE_OPTIONS.map((voice) => (
                        <SelectItem key={voice} value={voice}>
                          {voice}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </div>

      <DrawerFooter>

        <DrawerClose asChild>
          <Button variant="outline" className="w-full">
            {t("close")}
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  )
}
