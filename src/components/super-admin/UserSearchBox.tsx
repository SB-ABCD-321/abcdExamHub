"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"

export function UserSearchBox() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [query, setQuery] = useState(searchParams.get("q") || "")

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            startTransition(() => {
                if (query) {
                    router.push(`?q=${encodeURIComponent(query)}`)
                } else {
                    router.push(`?`)
                }
            })
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query, router])

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by name or email..."
                className="pl-8 bg-background"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    )
}
