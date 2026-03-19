"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, Save, FileText, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface BulkQuestionFormProps {
    topics: { id: string; name: string; workspaceId: string | null; isGlobal?: boolean }[];
    workspaces: { id: string; name: string }[];
}

export function BulkQuestionForm({ topics, workspaces }: BulkQuestionFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [topicId, setTopicId] = useState(topics[0]?.id || "")
    const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id || "")
    const [isPublic, setIsPublic] = useState(false)

    const [questions, setQuestions] = useState([
        { text: "", options: ["", "", "", ""], correctAnswerIndex: 0 }
    ])

    const updateQuestionText = (index: number, text: string) => {
        const newQs = [...questions]
        newQs[index].text = text
        setQuestions(newQs)
    }

    const updateOption = (qIndex: number, oIndex: number, val: string) => {
        const newQs = [...questions]
        newQs[qIndex].options[oIndex] = val
        setQuestions(newQs)
    }

    const setCorrectAnswer = (qIndex: number, oIndex: number) => {
        const newQs = [...questions]
        newQs[qIndex].correctAnswerIndex = oIndex
        setQuestions(newQs)
    }

    const addQuestion = () => {
        setQuestions([...questions, { text: "", options: ["", "", "", ""], correctAnswerIndex: 0 }])
    }

    const removeQuestion = (index: number) => {
        if (questions.length <= 1) return
        setQuestions(questions.filter((_, i) => i !== index))
    }

    const addOption = (qIndex: number) => {
        const newQs = [...questions]
        newQs[qIndex].options.push("")
        setQuestions(newQs)
    }

    const removeOption = (qIndex: number, oIndex: number) => {
        if (questions[qIndex].options.length <= 2) return
        const newQs = [...questions]
        newQs[qIndex].options = newQs[qIndex].options.filter((_, i) => i !== oIndex)
        if (newQs[qIndex].correctAnswerIndex >= oIndex) {
            newQs[qIndex].correctAnswerIndex = Math.max(0, newQs[qIndex].correctAnswerIndex - 1)
        }
        setQuestions(newQs)
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Validation
        const invalid = questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))
        if (invalid) {
            toast.error("Please fill in all questions and options.")
            setLoading(false)
            return
        }

        try {
            const response = await fetch("/api/teacher/questions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questions: questions.map(q => ({
                        text: q.text,
                        options: q.options,
                        correctAnswer: q.options[q.correctAnswerIndex],
                        topicId,
                        workspaceId,
                        isPublic
                    }))
                }),
            })

            if (!response.ok) {
                const txt = await response.text()
                throw new Error(txt || "Failed to create questions")
            }

            toast.success(`${questions.length} questions created successfully`)
            router.push("/teacher/questions")
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8 pb-20">
            <Card className="border-none shadow-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold">Bulk Question Entry</CardTitle>
                            <CardDescription>Rapidly add multiple questions to your bank.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Common Metadata */}
                    <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Apply Topic to All</Label>
                            <Select value={topicId} onValueChange={setTopicId} required {...({ modal: false } as any)}>
                                <SelectTrigger className="h-11 rounded-xl focus:ring-primary bg-white dark:bg-zinc-900 shadow-sm border-slate-200 dark:border-zinc-800">
                                    <SelectValue placeholder="Select topic" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {Array.from(new Map(topics.map(t => [t.name, t])).values())
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((t: any) => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Target Workspace</Label>
                            <Select value={workspaceId} onValueChange={setWorkspaceId} required disabled={workspaces.length === 1} {...({ modal: false } as any)}>
                                <SelectTrigger className="h-11 rounded-xl focus:ring-primary bg-white dark:bg-zinc-900 shadow-sm border-slate-200 dark:border-zinc-800">
                                    <SelectValue placeholder="Select workspace" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {workspaces.map((w: any) => (
                                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-3 pt-2 sm:col-span-2 bg-white/50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800">
                            <Checkbox id="bulkPublic" checked={isPublic} onCheckedChange={(c) => setIsPublic(c as boolean)} className="w-5 h-5" />
                            <div className="grid gap-0.5 leading-none">
                                <Label htmlFor="bulkPublic" className="text-sm font-black uppercase tracking-tight cursor-pointer">Make all these questions Public</Label>
                                <p className="text-[10px] text-slate-500 font-medium tracking-tight">Public questions can be shared across all workspaces via the Global Bank.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {questions.map((q, qIndex) => (
                            <div key={qIndex} className="relative p-8 rounded-[2rem] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group transition-all hover:shadow-2xl hover:shadow-primary/5">
                                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold shadow-lg">
                                    {qIndex + 1}
                                </div>

                                {questions.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeQuestion(qIndex)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 rounded-full"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-tight text-slate-400">Question Content</Label>
                                        <Textarea
                                            placeholder="The main question statement..."
                                            value={q.text}
                                            onChange={e => updateQuestionText(qIndex, e.target.value)}
                                            className="min-h-[100px] rounded-2xl border-slate-200 dark:border-zinc-800 text-base"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-bold uppercase tracking-tight text-slate-400">Options & Correct Answer</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={() => addOption(qIndex)} className="h-8 rounded-lg gap-1 px-3">
                                                <PlusCircle className="w-3 h-3" /> Add Option
                                            </Button>
                                        </div>
                                        <div className="grid gap-3">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-3 group/opt">
                                                    <Checkbox
                                                        id={`q${qIndex}-o${oIndex}`}
                                                        checked={q.correctAnswerIndex === oIndex}
                                                        onCheckedChange={() => setCorrectAnswer(qIndex, oIndex)}
                                                        className="w-5 h-5 rounded-full shrink-0"
                                                    />
                                                    <Input
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        value={opt}
                                                        onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                                        className="h-10 rounded-xl border-slate-100 dark:border-zinc-800"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={q.options.length <= 2}
                                                        onClick={() => removeOption(qIndex, oIndex)}
                                                        className="opacity-0 group-hover/opt:opacity-100 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={addQuestion}
                        className="w-full h-20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-primary/50 hover:bg-primary/5 group"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-zinc-400 group-hover:text-primary">
                                <PlusCircle className="w-5 h-5" /> Append Another Question
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Current Count: {questions.length}</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-16 md:bottom-0 left-0 md:left-72 right-0 z-40 px-4 pb-3 pt-1 md:pb-2 pointer-events-none">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    <Card className="w-full bg-zinc-950/95 dark:bg-zinc-100/95 backdrop-blur-xl border border-white/10 dark:border-zinc-300/30 shadow-2xl shadow-black/30 rounded-2xl overflow-hidden">
                        <div className="flex flex-row items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3">
                            {/* Info */}
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-100 dark:text-zinc-900 leading-tight">
                                        {questions.length} Q{questions.length !== 1 ? "s" : ""} Ready
                                    </p>
                                    <p className="hidden sm:block text-[9px] font-semibold text-primary/80 uppercase tracking-tight">
                                        Review before importing
                                    </p>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.push("/teacher/questions")}
                                    className="text-zinc-400 hover:text-white dark:text-zinc-500 dark:hover:text-zinc-950 font-bold text-[10px] h-8 px-3 rounded-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-8 px-4 sm:px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/30"
                                >
                                    {loading ? "..." : "Import Batch"}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </form>
    )
}
