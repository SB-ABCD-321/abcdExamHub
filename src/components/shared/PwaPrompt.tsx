"use client"

import { useState, useEffect } from "react"
import { Download, Share } from "lucide-react"
import { cn } from "@/lib/utils"

export function PwaPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [mounted, setMounted] = useState(false)

    const [isIos, setIsIos] = useState(false)

    useEffect(() => {
        setMounted(true)

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');

        if (isStandalone || dismissed === 'true') {
            return;
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        
        if (isIosDevice) {
            setIsIos(true);
            setShowPrompt(true);
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        const installHandler = () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
        }
        window.addEventListener('appinstalled', installHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installHandler);
        }
    }, [])

    if (!mounted || !showPrompt) return null;

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    }

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    }

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 text-white shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-sm">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-sm truncate">Add to Home Screen</h4>
                    {isIos && !deferredPrompt ? (
                        <p className="text-[10px] text-zinc-400 leading-tight mt-1">
                            Tap the <span className="inline-block align-middle"><Share className="w-3 h-3 text-white" /></span> Share button, then <b className="text-white">"Add to Home Screen"</b>.
                        </p>
                    ) : (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-tight mt-0.5">Install ExamHub for a faster, app-like experience.</p>
                    )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                    {!isIos && deferredPrompt && (
                        <button onClick={handleInstall} className="bg-white text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-sm">Install</button>
                    )}
                    <button onClick={handleDismiss} className={cn("text-zinc-500 hover:text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors", (isIos || !deferredPrompt) && "bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700")}>Dismiss</button>
                </div>
            </div>
        </div>
    )
}
