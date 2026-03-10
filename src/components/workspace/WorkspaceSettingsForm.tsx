"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface WorkspaceProps {
    id: string
    name: string
    logoUrl: string | null
    contactEmail: string | null
    contactPhone: string | null
    address: string | null
    // Add bannerUrl if we extend schema later, for now omit or optionally pass via metadata
}

export function WorkspaceSettingsForm({ workspace }: { workspace: WorkspaceProps }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        logoUrl: workspace.logoUrl || "",
        contactEmail: workspace.contactEmail || "",
        contactPhone: workspace.contactPhone || "",
        address: workspace.address || "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            const response = await fetch("/api/workspaces/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: workspace.id, ...formData }),
            })

            if (!response.ok) {
                const txt = await response.text()
                throw new Error(txt || "Failed to save settings")
            }

            setSuccess(true)
            router.refresh()

            // Reset success message
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardHeader>
                    <CardTitle>Branding & Display</CardTitle>
                    <CardDescription>Custom banners and logos will be visible to students during mock tests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col gap-3">
                        <Label htmlFor="logoUrl">Institute Logo URL</Label>
                        <Input
                            id="logoUrl"
                            name="logoUrl"
                            value={formData.logoUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/logo.png"
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>How should students reach your faculty?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="contactEmail">Support Email</Label>
                            <Input
                                id="contactEmail"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                placeholder="support@institute.edu"
                                type="email"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="contactPhone">Support Phone Number</Label>
                            <Input
                                id="contactPhone"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                placeholder="+1 (555) 000-0000"
                                type="tel"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Label htmlFor="address">Physical Address</Label>
                        <Textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="123 Education Lane..."
                            className="min-h-[100px]"
                            disabled={loading}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                {success && <p className="text-sm text-green-500 font-medium">Settings saved successfully!</p>}

                <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </form>
    )
}
