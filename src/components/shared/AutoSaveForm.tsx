"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { Cloud, Trash2, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AutoSaveForm({ storageKey }: { storageKey: string }) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasDraft, setHasDraft] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const hasRestored = useRef(false);

    useEffect(() => {
        const form = document.querySelector('form')
        if (!form) return

        // 1. Initial Load & Restore
        const draftStr = localStorage.getItem(storageKey)
        if (draftStr && !hasRestored.current) {
            setHasDraft(true)
            hasRestored.current = true;
            try {
                const data = JSON.parse(draftStr)
                Object.keys(data).forEach(key => {
                    const inputs = form.querySelectorAll(`[name="${key}"]`)
                    inputs.forEach(input => {
                        // Skip if it is the creationMode hidden input to preserve accurate split UI
                        if (key === 'creationMode') return;
                        
                        if (input instanceof HTMLInputElement) {
                            if (input.type === 'checkbox' || input.type === 'radio') {
                                const values = Array.isArray(data[key]) ? data[key] : [data[key]]
                                input.checked = values.includes(input.value)
                            } else if (input.type !== 'hidden') {
                                input.value = data[key]
                            }
                        } else if (input instanceof HTMLTextAreaElement) {
                            input.value = data[key]
                        }
                    })
                })
                
                // Dispatch a custom event so child React components (like QuestionSelector) can sync
                window.dispatchEvent(new CustomEvent(`restore-draft-${storageKey}`, { detail: data }))
                toast.success("Previous draft recovered successfully!")
            } catch(e) {
                console.error("Failed to restore draft", e)
            }
        }

        // 2. Background Saving Logic
        const performSave = () => {
            setIsSaving(true)
            const formData = new FormData(form)
            const data: Record<string, any> = {}
            formData.forEach((value, key) => {
                if (!data[key]) {
                    data[key] = value
                } else {
                    if (!Array.isArray(data[key])) data[key] = [data[key]]
                    data[key].push(value)
                }
            })
            localStorage.setItem(storageKey, JSON.stringify(data))
            setLastSaved(new Date())
            setHasDraft(true)
            
            setTimeout(() => setIsSaving(false), 500)
        }

        const interval = setInterval(performSave, 15000) // Changed to 15s to be less aggressive

        const handleSubmit = () => {
            localStorage.removeItem(storageKey)
            setHasDraft(false)
        }

        form.addEventListener("submit", handleSubmit)

        return () => {
            clearInterval(interval)
            form.removeEventListener("submit", handleSubmit)
        }
    }, [storageKey])

    const clearDraft = () => {
        if (!confirm("Are you sure you want to discard your saved draft? All inputs will be cleared.")) return;
        localStorage.removeItem(storageKey);
        setHasDraft(false);
        setLastSaved(null);
        
        const form = document.querySelector('form');
        if (form) form.reset();
        
        window.dispatchEvent(new CustomEvent(`clear-draft-${storageKey}`));
    }

    if (!hasDraft && !lastSaved) return null;

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        Draft Auto-Save Active
                        {isSaving ? (
                            <span className="text-[10px] uppercase font-bold text-blue-500 animate-pulse bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-sm">Saving...</span>
                        ) : lastSaved ? (
                            <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Saved</span>
                        ) : null}
                    </h4>
                    {lastSaved && <p className="text-xs text-slate-500 font-medium">Last captured at {lastSaved.toLocaleTimeString()}</p>}
                </div>
            </div>

            <Button 
                type="button" 
                variant="outline" 
                onClick={clearDraft}
                className="w-full sm:w-auto text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Draft
            </Button>
        </div>
    )
}
