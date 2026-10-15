"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, Share, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface Window {
        __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
    }
}

// Early capture beforeinstallprompt in case it fires prior to component hydration
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e: Event) => {
        e.preventDefault();
        window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
    });
}

export function PwaPrompt({
    siteName = "ABCD Exam Hub",
    logoUrl
}: {
    siteName?: string;
    logoUrl?: string;
}) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    // Comprehensive standalone / PWA check
    const checkIsStandalone = useCallback(() => {
        if (typeof window === "undefined") return false;
        return Boolean(
            window.matchMedia("(display-mode: standalone)").matches ||
            window.matchMedia("(display-mode: fullscreen)").matches ||
            window.matchMedia("(display-mode: minimal-ui)").matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes("android-app://")
        );
    }, []);

    useEffect(() => {
        // 1. If already running in standalone PWA mode, suppress completely
        if (checkIsStandalone()) {
            setIsInstalled(true);
            setShowPrompt(false);
            return;
        }

        // 2. Register Service Worker if supported and on secure context or localhost
        if (
            "serviceWorker" in navigator &&
            (window.location.protocol === "https:" ||
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1")
        ) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    reg.update().catch(() => {});
                })
                .catch((err) => {
                    console.debug("[PWA] Service worker registration:", err);
                });
        }

        // 3. Check dismissal state and cooldown (7-day cooldown on dismiss, permanent if installed)
        const dismissedUntil = localStorage.getItem("pwa-prompt-dismissed-until");
        const dismissedPerm = localStorage.getItem("pwa-prompt-dismissed");
        const alreadyInstalled = localStorage.getItem("pwa-installed");

        if (alreadyInstalled === "true") {
            setIsInstalled(true);
            return;
        }

        if (dismissedPerm === "true") {
            return;
        }

        if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
            return;
        }

        // 4. Check native getInstalledRelatedApps API if supported
        if ("getInstalledRelatedApps" in navigator) {
            (navigator as any)
                .getInstalledRelatedApps()
                .then((apps: any[]) => {
                    if (apps && apps.length > 0) {
                        setIsInstalled(true);
                        localStorage.setItem("pwa-installed", "true");
                        setShowPrompt(false);
                    }
                })
                .catch(() => {});
        }

        // 5. Detect iOS Safari (which doesn't support beforeinstallprompt)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        const isSafari =
            /safari/.test(userAgent) &&
            !/chrome|crios|fxios|optios|edgios/.test(userAgent);

        if (isIosDevice && isSafari && !(window.navigator as any).standalone) {
            setIsIos(true);
            setShowPrompt(true);
        }

        // 6. Check if beforeinstallprompt was already captured globally
        if (window.__deferredPwaPrompt) {
            setDeferredPrompt(window.__deferredPwaPrompt);
            setShowPrompt(true);
        }

        // 7. Event handler for new beforeinstallprompt events
        const promptHandler = (e: Event) => {
            e.preventDefault();
            const pEvent = e as BeforeInstallPromptEvent;
            window.__deferredPwaPrompt = pEvent;
            setDeferredPrompt(pEvent);
            setShowPrompt(true);
        };
        window.addEventListener("beforeinstallprompt", promptHandler);

        // 8. Event handler for successful app installation
        const installHandler = () => {
            setShowPrompt(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
            window.__deferredPwaPrompt = null;
            localStorage.setItem("pwa-installed", "true");
            localStorage.setItem("pwa-prompt-dismissed", "true");
        };
        window.addEventListener("appinstalled", installHandler);

        // 9. Listen for standalone display-mode changes
        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const displayModeHandler = (e: MediaQueryListEvent) => {
            if (e.matches) {
                setShowPrompt(false);
                setIsInstalled(true);
            }
        };
        mediaQuery.addEventListener?.("change", displayModeHandler);

        return () => {
            window.removeEventListener("beforeinstallprompt", promptHandler);
            window.removeEventListener("appinstalled", installHandler);
            mediaQuery.removeEventListener?.("change", displayModeHandler);
        };
    }, [checkIsStandalone]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        try {
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;
            if (choiceResult.outcome === "accepted") {
                localStorage.setItem("pwa-installed", "true");
                localStorage.setItem("pwa-prompt-dismissed", "true");
                setShowPrompt(false);
            }
        } catch (error) {
            console.error("[PWA] Installation failed:", error);
        } finally {
            setDeferredPrompt(null);
            window.__deferredPwaPrompt = null;
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Set a 3-day cooldown so it doesn't repeatedly popup
        const cooldownMs = 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem("pwa-prompt-dismissed-until", String(Date.now() + cooldownMs));
    };

    if (!showPrompt || isInstalled) return null;

    return (
        <aside
            aria-label="Install Application"
            className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-[101] w-auto sm:w-[380px] max-w-[calc(100vw-1.5rem)] animate-in slide-in-from-bottom-5 fade-in duration-300 select-none"
        >
            <div className="relative overflow-hidden rounded-2xl bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/90 text-white shadow-2xl shadow-black/60 p-4 ring-1 ring-white/10 transition-all">
                {/* Decorative Subtle Ambient Glow */}
                <div className="absolute -top-12 -right-12 size-28 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

                {/* Header Row: Logo, Title/Badge, and Dedicated Top-Right Close Button */}
                <div className="flex items-start gap-3 relative z-10">
                    {/* App Brand Icon */}
                    <div className="size-11 sm:size-12 rounded-xl bg-zinc-900 border border-zinc-800/90 flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-1.5">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={siteName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <Download className="size-5 text-primary" />
                        )}
                    </div>

                    {/* Title & Tagline */}
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm tracking-tight text-zinc-100 truncate">
                                {siteName}
                            </h4>
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                                PWA App
                            </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {isIos && !deferredPrompt
                                ? "Install for lightning-fast test prep & offline access."
                                : "Install on your home screen for quick exams and instant updates."}
                        </p>
                    </div>

                    {/* Dedicated Top-Right Cross (Close Button) */}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        aria-label="Close install prompt"
                        className="size-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 active:scale-90 text-zinc-400 hover:text-white transition-all flex items-center justify-center shrink-0 border border-zinc-700/50 shadow-xs cursor-pointer"
                    >
                        <X className="size-3.5 stroke-[2.5]" />
                    </button>
                </div>

                {/* iOS Share Guidance Banner */}
                {isIos && !deferredPrompt && (
                    <div className="mt-3 text-[11px] text-zinc-300 bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 flex items-center gap-2">
                        <Share className="size-4 text-primary shrink-0" />
                        <span className="leading-snug">
                            Tap <strong className="text-white font-semibold">Share</strong> in Safari, then select <strong className="text-white font-semibold">"Add to Home Screen"</strong>.
                        </span>
                    </div>
                )}

                {/* Action Buttons Row */}
                <div className="mt-3.5 flex items-center gap-2 relative z-10">
                    {!isIos && deferredPrompt && (
                        <button
                            type="button"
                            onClick={handleInstall}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                            <Download className="size-3.5" />
                            <span>Install App</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className={cn(
                            "inline-flex items-center justify-center text-xs font-semibold py-2 px-3.5 rounded-xl transition-all cursor-pointer active:scale-[0.98]",
                            isIos || !deferredPrompt
                                ? "w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                        )}
                    >
                        {isIos || !deferredPrompt ? "Got it" : "Maybe Later"}
                    </button>
                </div>
            </div>
        </aside>
    );
}
