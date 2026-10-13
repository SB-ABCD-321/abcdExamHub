"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "outline" | "pill";
}

export function ThemeToggle({ className, variant = "outline" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        disabled
        className={cn(
          "relative inline-flex items-center justify-center size-9 rounded-full border border-border/60 bg-background/50 text-muted-foreground opacity-60 transition-colors",
          className
        )}
      >
        <Sun className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "relative inline-flex items-center justify-center size-9 rounded-full border border-border/70 bg-card/60 backdrop-blur-md text-foreground transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className
      )}
    >
      {/* Sun icon for light mode */}
      <Sun
        className={cn(
          "size-4 transition-all duration-300",
          isDark
            ? "scale-0 -rotate-90 opacity-0 absolute"
            : "scale-100 rotate-0 opacity-100 text-amber-500"
        )}
      />
      {/* Moon icon for dark mode */}
      <Moon
        className={cn(
          "size-4 transition-all duration-300",
          isDark
            ? "scale-100 rotate-0 opacity-100 text-primary"
            : "scale-0 rotate-90 opacity-0 absolute"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
