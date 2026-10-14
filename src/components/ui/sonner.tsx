"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={4000}
      closeButton
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          "--duration": "4000ms",
        } as React.CSSProperties,
        classNames: {
          toast:
            "group toast bg-card text-card-foreground border border-border/60 shadow-xl rounded-xl p-3.5 sm:p-4 font-sans font-medium text-xs sm:text-sm",
          title: "text-foreground font-semibold text-xs sm:text-sm tracking-normal",
          description: "text-muted-foreground text-xs mt-0.5 leading-relaxed",
          actionButton:
            "bg-primary text-primary-foreground font-bold rounded-lg px-3 py-1.5 text-xs tracking-normal shadow-2xs",
          cancelButton:
            "bg-muted text-muted-foreground font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-muted/80",
          icon: "p-0.5",
          closeButton: "bg-background border-border/60 text-muted-foreground hover:text-foreground",
        },
      }}
      {...props}
    />

  )
}

export { Toaster }
