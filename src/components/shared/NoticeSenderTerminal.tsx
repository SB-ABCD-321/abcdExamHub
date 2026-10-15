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
        <Card className="border border-border/70 bg-card/80 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden transition-all">
            {/* Header */}
            <CardHeader className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-3.5 px-4 sm:px-5">
                <div className="flex items-center gap-2.5">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Megaphone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-white text-base font-bold">Compose Notice</CardTitle>
                        <CardDescription className="text-indigo-200 text-[11px] font-medium mt-0.5">
                            Send targeted messages to your recipients
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3.5">
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Step 1 - Audience */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 capitalize">
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold">
                                1
                            </span>
                            Select Audience
                        </Label>
                        <Select value={targetType} onValueChange={(v: any) => { setTargetType(v); setWorkspaceId(""); setEmail(""); }}>
                            <SelectTrigger className="h-9.5 text-xs font-semibold border-border/60 bg-background/50 rounded-xl focus:ring-indigo-500">
                                <SelectValue placeholder="Who receives this notice?" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                                {groups.map(group => (
                                    <SelectGroup key={group}>
                                        <SelectLabel className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground px-2 py-1.5 flex items-center gap-1.5">
                                            {group === "Platform-wide" && <Globe className="w-3 h-3 text-indigo-400" />}
                                            {group === "By Workspace" && <Building2 className="w-3 h-3 text-blue-400" />}
                                            {group === "Broadcast" && <Users className="w-3 h-3 text-emerald-400" />}
                                            {group === "Requests" && <Lock className="w-3 h-3 text-amber-400" />}
                                            {group === "Individual" && <User className="w-3 h-3 text-rose-400" />}
                                            {group}
                                        </SelectLabel>
                                        {allowedTargets.filter(t => t.group === group).map(t => (
                                            <SelectItem key={t.value} value={t.value} className="text-xs font-medium py-1.5">
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Show selected badge */}
                        {selectedOption && (
                            <div className="flex items-center gap-1.5 mt-1">
                                <Badge className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 font-bold px-1.5 py-0.2">
                                    {selectedOption.group}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground truncate">▸ {selectedOption.label}</span>
                            </div>
                        )}
                    </div>

                    {/* Workspace selector */}
                    {selectedOption?.needsWorkspace && (
                        <div className="space-y-1.5 border-l-2 border-indigo-400 dark:border-indigo-700 pl-2.5">
                            <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Target Workspace
                            </Label>
                            {workspaces.length === 0 ? (
                                <p className="text-xs text-rose-500 italic">No workspaces available</p>
                            ) : (
                                <Select value={workspaceId} onValueChange={setWorkspaceId} required>
                                    <SelectTrigger className="h-9 text-xs font-medium border-border/60 bg-background/50 rounded-xl">
                                        <SelectValue placeholder="Choose workspace..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workspaces.map(w => (
                                            <SelectItem key={w.id} value={w.id} className="text-xs font-medium">{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )}

                    {/* Email for specific user */}
                    {selectedOption?.needsEmail && (
                        <div className="space-y-1.5 border-l-2 border-rose-400 dark:border-rose-700 pl-2.5">
                            <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Recipient Email
                            </Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="e.g. teacher@institution.com"
                                className="h-9 text-xs font-medium border-border/60 bg-background/50 rounded-xl"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">Must be registered in the system</p>
                        </div>
                    )}

                    {/* Step 2 - Subject */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 capitalize">
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold">
                                2
                            </span>
                            Subject
                        </Label>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Exam schedule update for March session"
                            className="h-9.5 text-xs font-semibold border-border/60 bg-background/50 rounded-xl focus-visible:ring-indigo-500"
                            maxLength={120}
                            required
                        />
                    </div>

                    {/* Step 3 - Message */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 capitalize">
                                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold">
                                    3
                                </span>
                                Message
                            </Label>
                            <span className={cn("text-[10px] font-medium font-mono", charCount > 900 ? "text-rose-500" : "text-muted-foreground")}>
                                {charCount}/1000
                            </span>
                        </div>
                        <Textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Write your announcement details here..."
                            className="min-h-[110px] text-xs font-medium border-border/60 bg-background/50 rounded-xl focus-visible:ring-indigo-500 resize-none leading-relaxed"
                            maxLength={1000}
                            required
                        />
                    </div>

                    {/* Send Button */}
                    <Button
                        type="submit"
                        disabled={isPending || !targetType}
                        className={cn(
                            "w-full h-10 rounded-xl font-bold text-xs transition-all",
                            isPending
                                ? "bg-muted text-muted-foreground"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
                        )}
                    >
                        <Send className="w-3.5 h-3.5 mr-2" />
                        {isPending ? "Dispatching..." : "Send Notice"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
