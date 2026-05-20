import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ButtonGroup({ className, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center -space-x-px",
        "[&>*:first-child:not(:last-child)]:rounded-r-none",
        "[&>*:last-child:not(:first-child)]:rounded-l-none",
        "[&>*:not(:first-child):not(:last-child)]:rounded-none",
        className
      )}
      {...props}
    />
  )
}
