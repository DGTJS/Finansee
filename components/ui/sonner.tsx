"use client"

import { useTheme } from "@/components/theme/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleAlert, CircleCheck, CircleHelp, Settings2, X } from "@/components/icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { mode } = useTheme()
  const sonnerTheme = mode

  return (
    <Sonner
      theme={sonnerTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheck className="size-4" />
        ),
        info: (
          <CircleHelp className="size-4" />
        ),
        warning: (
          <CircleAlert className="size-4" />
        ),
        error: (
          <X className="size-4" />
        ),
        loading: (
          <Settings2 className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
