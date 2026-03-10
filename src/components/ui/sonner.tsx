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
            "group toast bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] rounded-2xl p-4 font-sans font-medium",
          title: "text-slate-900 dark:text-white font-black text-sm uppercase tracking-wide",
          description: "text-slate-500 dark:text-zinc-400 text-xs mt-1 leading-relaxed",
          actionButton:
            "bg-primary text-primary-foreground font-bold rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest",
          cancelButton:
            "bg-muted text-muted-foreground font-bold rounded-lg px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-muted/80",
          icon: "group-data-[type=error]:text-destructive group-data-[type=success]:text-emerald-500 group-data-[type=warning]:text-amber-500 group-data-[type=info]:text-blue-500 p-1",
        },
      }}
      {...props}
    />

  )
}

export { Toaster }
