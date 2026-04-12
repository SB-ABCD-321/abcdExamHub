"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { NoticeTargetType } from "@prisma/client";

// Force bust: using relative import
import { sendNotice } from "../../actions/notice";

import { useRouter } from "next/navigation";
import { Send, Users, User, Globe, Building2, Megaphone, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TargetOption {
    value: NoticeTargetType;
    label: string;
    group: string;
    icon?: React.ReactNode;
    needsWorkspace?: boolean;
    needsEmail?: boolean;
    description?: string;
}

interface Props {
    allowedTargets: TargetOption[];
    workspaces: { id: string; name: string }[];
}

export function NoticeSenderTerminal({ allowedTargets, workspaces }: Props) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [targetType, setTargetType] = useState<NoticeTargetType | "">("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [workspaceId, setWorkspaceId] = useState("");
    const [email, setEmail] = useState("");

    const selectedOption = allowedTargets.find(t => t.value === targetType);
    const groups = Array.from(new Set(allowedTargets.map(t => t.group)));
    const charCount = content.length;

    function reset() {
        setTitle(""); setContent(""); setWorkspaceId(""); setEmail(""); setTargetType("");
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!targetType) return toast.error("Select an audience first");
        if (!title.trim()) return toast.error("Add a subject line");
        if (!content.trim()) return toast.error("Write a message body");
        if (selectedOption?.needsWorkspace && !workspaceId) return toast.error("Select a workspace");
        if (selectedOption?.needsEmail && !email.trim()) return toast.error("Enter recipient email");

        startTransition(async () => {
            try {
                await sendNotice(
                    title,
                    content,
                    targetType,
                    selectedOption?.needsWorkspace ? workspaceId : null,
                    selectedOption?.needsEmail ? email : null
                );
                toast.success("Notice sent successfully!");
                reset();
                router.refresh();
            } catch (error: any) {
                toast.error(error.message || "Failed to send notice");
            }
        });
    }

    return (
        <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-zinc-800 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white pb-6 pt-5">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                        <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-white text-lg font-bold">Compose Notice</CardTitle>
                        <CardDescription className="text-indigo-200 text-xs font-medium mt-0.5">
                            Send targeted messages to your recipients
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Step 1 - Audience */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 capitalize">
                            <span className="bg-indigo-100 text-indigo-600 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold">1</span>
                            Select Audience
                        </Label>
                        <Select value={targetType} onValueChange={(v: any) => { setTargetType(v); setWorkspaceId(""); setEmail(""); }}>
                            <SelectTrigger className="h-11 font-semibold border-slate-200 dark:border-zinc-700 focus:ring-indigo-500">
                                <SelectValue placeholder="Who receives this notice?" />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map(group => (
                                    <SelectGroup key={group}>
                                        <SelectLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 px-2 py-1.5 flex items-center gap-1.5">
                                            {group === "Platform-wide" && <Globe className="w-3 h-3 text-indigo-400" />}
                                            {group === "By Workspace" && <Building2 className="w-3 h-3 text-blue-400" />}
                                            {group === "Broadcast" && <Users className="w-3 h-3 text-emerald-400" />}
                                            {group === "Requests" && <Lock className="w-3 h-3 text-amber-400" />}
                                            {group === "Individual" && <User className="w-3 h-3 text-rose-400" />}
                                            {group}
                                        </SelectLabel>
                                        {allowedTargets.filter(t => t.group === group).map(t => (
                                            <SelectItem key={t.value} value={t.value} className="font-medium">
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Show selected badge */}
                        {selectedOption && (
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 font-bold px-2 py-0.5">
                                    {selectedOption.group}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">▸ {selectedOption.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Workspace selector */}
                    {selectedOption?.needsWorkspace && (
                        <div className="space-y-2 border-l-2 border-indigo-200 dark:border-indigo-900 pl-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <Building2 className="w-3 h-3" /> Workspace
                            </Label>
                            {workspaces.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">No workspaces available</p>
                            ) : (
                                <Select value={workspaceId} onValueChange={setWorkspaceId} required>
                                    <SelectTrigger className="h-10 font-medium border-slate-200 dark:border-zinc-700">
                                        <SelectValue placeholder="Choose workspace..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workspaces.map(w => (
                                            <SelectItem key={w.id} value={w.id} className="font-medium">{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {/* Email for specific user */}
                    {selectedOption?.needsEmail && (
                        <div className="space-y-2 border-l-2 border-rose-200 dark:border-rose-900 pl-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Recipient Email
                            </Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="e.g. teacher@school.com"
                                className="h-10 font-medium"
                                required
                            />
                            <p className="text-[11px] text-muted-foreground">Must be registered in the system</p>
                        </div>
                    )}

                    {/* Step 2 - Subject */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 capitalize">
                            <span className="bg-indigo-100 text-indigo-600 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold">2</span>
                            Subject
                        </Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Exam schedule change for March"
                            className="h-11 font-medium border-slate-200 dark:border-zinc-700 focus-visible:ring-indigo-500"
                            maxLength={120}
                            required
                        />
                    </div>

                    {/* Step 3 - Message */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-500 flex items-center gap-1.5 capitalize">
                                <span className="bg-indigo-100 text-indigo-600 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold">3</span>
                                Message
                            </Label>
                            <span className={cn("text-[10px] font-medium", charCount > 900 ? "text-rose-500" : "text-muted-foreground")}>
                                {charCount}/1000
                            </span>
                        </div>
                        <Textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Write your announcement here..."
                            className="min-h-[130px] font-medium border-slate-200 dark:border-zinc-700 focus-visible:ring-indigo-500 resize-none"
                            maxLength={1000}
                            required
                        />
                    </div>

                    {/* Send Button */}
                    <Button
                        type="submit"
                        disabled={isPending || !targetType}
                        className={cn(
                            "w-full h-12 rounded-xl font-bold text-sm transition-all",
                            isPending
                                ? "bg-slate-300 text-slate-500"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
                        )}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {isPending ? "Dispatching..." : "Send Notice"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
