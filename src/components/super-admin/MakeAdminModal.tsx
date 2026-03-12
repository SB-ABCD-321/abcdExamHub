"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MakeAdminModalProps {
    userId: string
    userName: string
    userEmail: string
    variant?: "button" | "menuItem"
}

export function MakeAdminModal({ userId, userName, userEmail, variant = "button" }: MakeAdminModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [workspaceName, setWorkspaceName] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (workspaceName.length < 3) {
                throw new Error("Workspace name must be at least 3 characters")
            }

            const response = await fetch("/api/super-admin/create-workspace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, workspaceName }),
            })

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(txt || "Something went wrong")
            }

            // Refresh the server page to show the role change
            router.refresh()
            setOpen(false)

        } catch (err: any) {
            setError(err.message || "Failed to make admin")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) {
                setWorkspaceName("")
                setError("")
            }
        }}>
            <DialogTrigger asChild>
                {variant === "menuItem" ? (
                    <div className="flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Create Workspace
                    </div>
                ) : (
                    <Button variant="outline" size="sm" className="hidden sm:flex ml-auto gap-1">
                        <ShieldAlert className="w-4 h-4" />
                        Make Admin
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>Assign Workspace Admin</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to promote {userName || userEmail} to an Institute Admin? This will generate a new Workspace for them to manage.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workspaceName">New Workspace Name</Label>
                            <Input
                                id="workspaceName"
                                placeholder="e.g. Apex Institute of Sciences"
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                disabled={loading}
                                required
                            />
                            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !workspaceName}>
                            {loading ? "Assigning..." : "Confirm && Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
