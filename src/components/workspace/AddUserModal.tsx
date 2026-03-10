"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { UserPlus } from "lucide-react"

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

const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
})

interface AddUserModalProps {
    roleType: "TEACHER" | "STUDENT"
}

export function AddUserModal({ roleType }: AddUserModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true);
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            // Validate email format
            formSchema.parse({ email })

            const response = await fetch("/api/workspaces/add-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, roleType }),
            })

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(txt || "Something went wrong")
            }

            setSuccess(true)
            setEmail("")

            // Refresh the server page to load the new user into the list
            router.refresh()

            // Close the modal after a short delay
            setTimeout(() => setOpen(false), 1500)

        } catch (err: any) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0]?.message || "Invalid email")
            } else {
                setError(err.message || "Failed to add user")
            }
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {roleType === "TEACHER" ? "Add Teacher" : "Enroll Student"}
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(v: boolean) => {
            setOpen(v)
            if (!v) {
                setEmail("")
                setError("")
                setSuccess(false)
            }
        }}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    {roleType === "TEACHER" ? "Add Teacher" : "Enroll Student"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={onSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {roleType === "TEACHER" ? "Invite Teacher" : "Enroll Student"}
                        </DialogTitle>
                        <DialogDescription>
                            Enter their email address to give them access to this workspace. If they do not have an account yet, one will be reserved for them.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || success}
                                required
                            />
                            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                            {success && <p className="text-sm text-green-500 font-medium">Successfully added {roleType.toLowerCase()} to workspace!</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || success || !email}>
                            {loading ? "Adding..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
