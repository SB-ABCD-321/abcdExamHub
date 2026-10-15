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
      position="bottom-right"
      duration={3500}
      closeButton
      icons={{
        success: (
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CircleCheckIcon className="w-4 h-4" />
          </div>
        ),
        info: (
          <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <InfoIcon className="w-4 h-4" />
          </div>
        ),
        warning: (
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
            <TriangleAlertIcon className="w-4 h-4" />
          </div>
        ),
        error: (
          <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
            <OctagonXIcon className="w-4 h-4" />
          </div>
        ),
        loading: (
          <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Loader2Icon className="w-4 h-4 animate-spin" />
          </div>
        ),
      }}
      toastOptions={{
        style: {
          fontFamily: 'var(--font-sans)',
          "--duration": "3500ms",
        } as React.CSSProperties,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-card-foreground group-[.toaster]:border-border/70 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl p-4 font-sans font-medium text-xs sm:text-sm border flex items-center gap-3",
          title: "text-foreground font-semibold text-xs sm:text-sm tracking-tight",
          description: "text-muted-foreground text-xs mt-0.5 leading-relaxed",
          actionButton:
            "bg-primary text-primary-foreground font-bold rounded-xl px-3 py-1.5 text-xs tracking-normal shadow-xs",
          cancelButton:
            "bg-muted text-muted-foreground font-semibold rounded-xl px-3 py-1.5 text-xs hover:bg-muted/80",
          icon: "shrink-0",
          closeButton: "top-3 right-3 left-auto transform-none bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 rounded-lg",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-emerald-500/[0.04] dark:group-[.toaster]:bg-emerald-950/20",
          error: "group-[.toaster]:border-rose-500/30 group-[.toaster]:bg-rose-500/[0.04] dark:group-[.toaster]:bg-rose-950/20",
          warning: "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-amber-500/[0.04] dark:group-[.toaster]:bg-amber-950/20",
          info: "group-[.toaster]:border-primary/30 group-[.toaster]:bg-primary/[0.04] dark:group-[.toaster]:bg-primary/10",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
