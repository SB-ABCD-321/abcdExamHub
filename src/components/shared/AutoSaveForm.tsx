"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { RotateCcw } from "lucide-react"

export function AutoSaveForm({ storageKey }: { storageKey: string }) {
    useEffect(() => {
        const form = document.querySelector('form')
        if (!form) return

        const draftStr = localStorage.getItem(storageKey)
        if (draftStr) {
            try {
                const data = JSON.parse(draftStr)
                Object.keys(data).forEach(key => {
                    const inputs = form.querySelectorAll(`[name="${key}"]`)
                    inputs.forEach(input => {
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
                
                // Dispatch a custom event so child React components (like QuestionSelector) can sync if they want
                window.dispatchEvent(new CustomEvent(`restore-draft-${storageKey}`, { detail: data }))
                toast.success("Draft automatically restored!")
            } catch(e) {
                console.error("Failed to restore draft", e)
            }
        }

        const interval = setInterval(() => {
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
        }, 3000)

        const handleSubmit = () => {
            localStorage.removeItem(storageKey)
        }
        form.addEventListener("submit", handleSubmit)

        return () => {
            clearInterval(interval)
            form.removeEventListener("submit", handleSubmit)
        }
    }, [storageKey])

    return null
}
