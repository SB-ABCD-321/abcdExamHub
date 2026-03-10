"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { QuickCreateTopicModal } from "@/components/workspace/QuickCreateTopicModal"

interface QuestionFormProps {
    topics: { id: string; name: string; workspaceId: string | null; isGlobal?: boolean }[];
    workspaces: { id: string; name: string }[];
    initialData?: any;
}

export function QuestionForm({ topics: initialTopics, workspaces, initialData }: QuestionFormProps) {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [topics, setTopics] = useState(initialTopics)
    const [text, setText] = useState(initialData?.text || "")
    const [topicId, setTopicId] = useState(initialData?.topicId || (topics[0]?.id || ""))
    const [workspaceId, setWorkspaceId] = useState(initialData?.workspaceId || (workspaces[0]?.id || ""))
    const [isPublic, setIsPublic] = useState(initialData?.isPublic || false)

    const [options, setOptions] = useState<string[]>(initialData?.options || ["", "", "", ""]) // Start with 4 empty options

    // Find index of correctAnswer if we are editing
    const defaultIndex = initialData && initialData.options ? initialData.options.indexOf(initialData.correctAnswer) : 0;
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0)

    const updateOption = (index: number, val: string) => {
        const newOps = [...options]
        newOps[index] = val
        setOptions(newOps)
    }

    const addOption = () => setOptions([...options, ""])
    const removeOption = (index: number) => {
        if (options.length <= 2) return; // Min 2 options
        const newOps = options.filter((_, i) => i !== index)
        setOptions(newOps)
        if (correctAnswerIndex >= index) {
            setCorrectAnswerIndex(Math.max(0, correctAnswerIndex - 1))
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (options.some(o => !o.trim())) {
            setError("All options must contain text.")
            setLoading(false)
            return
        }

        try {
            const url = initialData ? `/api/teacher/questions/${initialData.id}` : "/api/teacher/questions"
            const method = initialData ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    topicId,
                    workspaceId,
                    isPublic,
                    options,
                    correctAnswer: options[correctAnswerIndex]
                }),
            })

            if (!response.ok) {
                const txt = await response.text()
                throw new Error(txt || (initialData ? "Failed to update question" : "Failed to create question"))
            }

            if (initialData) {
                toast.success("Question updated successfully")
            } else {
                toast.success("Question created successfully")
            }

            router.push("/teacher/questions")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6 space-y-6">

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Question Topic</Label>
                            <div className="flex gap-2">
                                <Select value={topicId} onValueChange={setTopicId} required>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a topic" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {topics.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} {t.isGlobal ? '(Global)' : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <QuickCreateTopicModal
                                    workspaceId={workspaceId}
                                    onTopicCreated={(newTopic: any) => {
                                        setTopics(prev => [...prev, { ...newTopic, workspaceId, isGlobal: false }])
                                        setTopicId(newTopic.id)
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Owning Workspace</Label>
                            <Select value={workspaceId} onValueChange={setWorkspaceId} required disabled={workspaces.length === 1}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select workspace" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workspaces.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                            placeholder="Type the main question here..."
                            className="min-h-[100px] text-base"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label>Multiple Choice Options</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-8 gap-1">
                                <PlusCircle className="w-3.5 h-3.5" /> Add Option
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex items-center space-x-2 w-12 justify-center">
                                        <Checkbox
                                            id={`correct-${i}`}
                                            checked={correctAnswerIndex === i}
                                            onCheckedChange={() => setCorrectAnswerIndex(i)}
                                        />
                                        <Label htmlFor={`correct-${i}`} className="sr-only">Correct</Label>
                                    </div>
                                    <Input
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={e => updateOption(i, e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={options.length <= 2}
                                        onClick={() => removeOption(i)}
                                    >
                                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground ml-14">Check the box next to the correct answer.</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t">
                        <Checkbox
                            id="isPublic"
                            checked={isPublic}
                            onCheckedChange={(c) => setIsPublic(c as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="isPublic">Make this question Public</Label>
                            <p className="text-xs text-muted-foreground">
                                Public questions can be viewed by other teachers across the entire platform.
                            </p>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <div className="flex justify-end gap-4 items-center">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : (initialData ? "Update Question" : "Save Question")}
                </Button>
            </div>
        </form>
    )
}
