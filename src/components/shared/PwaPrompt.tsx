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
        // Set a 7-day cooldown so it doesn't annoy the user on every visit
        const cooldownMs = 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem("pwa-prompt-dismissed-until", String(Date.now() + cooldownMs));
        localStorage.setItem("pwa-prompt-dismissed", "true");
    };

    if (!showPrompt || isInstalled) return null;

    return (
        <aside
            aria-label="Install Application"
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[101] max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-300 select-none"
        >
            <div className="relative bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/80 text-white shadow-2xl shadow-black/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5">
                {/* Dismiss Icon in top right */}
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss banner"
                    className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-800/60"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                {/* App Brand Icon */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800/90 overflow-hidden shadow-inner">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={siteName}
                            className="w-full h-full object-contain p-1"
                        />
                    ) : (
                        <Download className="w-5 h-5 text-indigo-400" />
                    )}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-4 sm:pr-2">
                    <h4 className="font-semibold text-sm tracking-tight text-zinc-100 truncate">
                        Add {siteName}
                    </h4>
                    {isIos && !deferredPrompt ? (
                        <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                            Tap <Share className="inline-block w-3 h-3 text-zinc-200 mx-0.5 align-baseline" /> then select <b className="text-zinc-200 font-semibold">"Add to Home Screen"</b>.
                        </p>
                    ) : (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-tight mt-0.5">
                            Install {siteName} for a faster, app-like experience.
                        </p>
                    )}
                </div>

                {/* Action Buttons: Proper Word Case (Install / Dismiss) */}
                <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                    {!isIos && deferredPrompt && (
                        <button
                            type="button"
                            onClick={handleInstall}
                            className="bg-white hover:bg-zinc-100 active:scale-95 text-zinc-950 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-normal transition-all shadow-sm cursor-pointer"
                        >
                            Install
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className={cn(
                            "text-xs font-medium tracking-normal text-zinc-400 hover:text-zinc-200 px-3 py-1 transition-all active:scale-95 cursor-pointer text-center",
                            (isIos || !deferredPrompt) &&
                                "bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-200 px-3.5 py-1.5 rounded-xl font-semibold"
                        )}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </aside>
    );
}
