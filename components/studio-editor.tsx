"use client"

import {
  Sparkles,
  Trash2,
  User,
} from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function StudioEditor() {
  return (
    <div className="flex h-full w-full flex-col">
      <InputGroup className="flex-1">
        <InputGroupTextarea
          id="textarea-code-32"
          placeholder="[excitedly] Hey there, I'm a new text to speech model, and I can say things in many different ways. How can I help you today?"
          className="flex-1 font-mono"
        />
        <InputGroupAddon align="block-start" className="border-b">
          <InputGroupButton size="sm" variant="outline">
            <User />
            Speaker 1 - Zephyr
          </InputGroupButton>
          <InputGroupButton className="ml-auto" size="icon-sm">
            <Sparkles />
          </InputGroupButton>
          <InputGroupButton variant="destructive" size="icon-sm">
            <Trash2 />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
