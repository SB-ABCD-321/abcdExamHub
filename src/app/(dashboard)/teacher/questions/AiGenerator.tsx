"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateAiQuestionsAction } from "@/actions/gemini";
import { QuickCreateTopicModal } from "@/components/workspace/QuickCreateTopicModal";

interface AiGeneratorProps {
    topics: { id: string; name: string }[];
    workspaceId: string;
    aiGenerationsCount: number;
    aiLimit: number;
    aiUnlimited: boolean;
}

export function AiQuestionGenerator({ topics: initialTopics, workspaceId, aiGenerationsCount, aiLimit, aiUnlimited }: AiGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Form state
    const [topics, setTopics] = useState(initialTopics);
    const [topicId, setTopicId] = useState("");
    const [prompt, setPrompt] = useState("");
    const [count, setCount] = useState("5");
    const [base64Pdf, setBase64Pdf] = useState<string | undefined>(undefined);
    const [fileName, setFileName] = useState("");

    const handleTopicCreated = (newTopic: { id: string; name: string }) => {
        setTopics(prev => [...prev, newTopic]);
        setTopicId(newTopic.id);
    };

    const handleGenerate = async () => {
        if (!topicId) {
            toast.error("Please select a topic or create a new one first.");
            return;
        }
        if (!prompt.trim() && !base64Pdf) {
            toast.error("Please provide either a prompt or upload a document.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await generateAiQuestionsAction(
                topicId,
                prompt.trim() || `Generate questions from the attached document.`,
                parseInt(count),
                base64Pdf
            );

            if (result.success) {
                toast.success(`Successfully generated ${result.count} questions!`);
                setOpen(false);
                setPrompt("");
                // Reload the page to show new questions
                window.location.reload();
            } else {
                toast.error(result.error || "Failed to generate questions.");
            }
        } catch (error: any) {
            console.error(error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a valid PDF document.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("File is too large. Max 5MB allowed.");
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setBase64Pdf(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    if (!mounted) {
        return (
            <Button className="gap-2 h-11 px-5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
                <Sparkles className="h-4 w-4" />
                Generate with AI
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 h-11 px-5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0">
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        AI Question Generator
                    </DialogTitle>
                    <DialogDescription>
                        Describe the topic and level of difficulty. Our AI will draft questions with options for you.
                    </DialogDescription>
                    {!aiUnlimited && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                            <strong>AI Quota:</strong> You have used {aiGenerationsCount} / {aiLimit} generations.
                            Contact your administrator to increase this limit.
                        </div>
                    )}
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>1. Select Categorized Topic</Label>
                        <div className="flex gap-2">
                            <Select value={topicId} onValueChange={setTopicId}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Choose a topic..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {topics.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <QuickCreateTopicModal
                                workspaceId={workspaceId}
                                onTopicCreated={handleTopicCreated}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>2. Question Count</Label>
                        <Select value={count} onValueChange={setCount}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3 Questions</SelectItem>
                                <SelectItem value="5">5 Questions</SelectItem>
                                <SelectItem value="10">10 Questions</SelectItem>
                                <SelectItem value="25">25 Questions</SelectItem>
                                <SelectItem value="50">50 Questions</SelectItem>
                                <SelectItem value="100">100 Questions</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="prompt">3. What should the questions be about? (Or Upload PDF)</Label>
                        <Textarea
                            id="prompt"
                            placeholder="e.g. Introduction to photosynthesis, focus on light-dependent reactions. Medium difficulty."
                            className="h-32 mb-2"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <div className="flex items-center gap-4 mt-2">
                            <Label htmlFor="file-upload" className="cursor-pointer border border-dashed border-slate-300 dark:border-zinc-700 p-4 rounded-xl text-center w-full hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {fileName ? `Uploaded: ${fileName}` : "Click to upload a PDF document (Max 5MB)"}
                                </span>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={isLoading || !topicId || (!prompt.trim() && !base64Pdf)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Now"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
