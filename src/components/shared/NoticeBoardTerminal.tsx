"use client";

import { useState } from "react";
function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (seconds < 60) return rtf.format(-seconds, "second");
    if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
    if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), "hour");
    return rtf.format(-Math.floor(seconds / 86400), "day");
}

// Force bust: relative import
import { markAsRead } from "../../actions/notice";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";

import { Check, Mail, MailOpen, History, Inbox, ChevronRight, Clock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notice {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    sender: { firstName: string; lastName: string; role: string };
    readCount?: number;
    expectedTargetText?: string;
}

interface Props {
    inbox: Notice[];
    sentBox: Notice[];
}

export function NoticeBoardTerminal({ inbox, sentBox }: Props) {
    const [activeNotice, setActiveNotice] = useState<Notice | null>(null);

    const handleRead = async (notice: Notice) => {
        setActiveNotice(notice);
        if (notice.isRead) return;
        try {
            await markAsRead(notice.id);
            notice.isRead = true;
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const NoticeList = ({ notices, isSent = false }: { notices: Notice[], isSent?: boolean }) => (
        <div className="h-[500px] pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">

            {notices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                    <Mail className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No messages here yet</p>
                </div>
            ) : (
                <div className="space-y-3 p-1">
                    {notices.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleRead(n)}
                            className={cn(
                                "w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative",
                                activeNotice?.id === n.id
                                    ? "bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                                    : "bg-white border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-indigo-900/50"
                            )}
                        >
                            {!n.isRead && !isSent && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                            )}
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    activeNotice?.id === n.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                )}>
                                    {isSent ? <MailOpen className="w-4 h-4" /> : (n.isRead ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {isSent ? `To: ${n.expectedTargetText}` : `${n.sender.firstName} ${n.sender.lastName}`}
                                        </p>
                                        <span className="text-[10px] font-medium text-slate-400">{timeAgo(n.createdAt)}</span>
                                    </div>
                                    <h4 className={cn("text-sm font-black truncate leading-tight", !n.isRead && !isSent ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-400")}>
                                        {n.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-medium">
                                        {n.content}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-zinc-800 overflow-hidden bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
            <Tabs defaultValue="inbox" className="w-full">

                <div className="px-6 pt-5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
                    <TabsList className="bg-slate-100/50 dark:bg-zinc-900/50 p-1 h-10 mb-[-1px]">
                        <TabsTrigger value="inbox" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 text-xs font-bold uppercase tracking-widest">
                            <Inbox className="w-3.5 h-3.5 mr-2" />
                            Inbox
                        </TabsTrigger>
                        {sentBox.length > 0 && (
                            <TabsTrigger value="sent" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 text-xs font-bold uppercase tracking-widest">
                                <History className="w-3.5 h-3.5 mr-2" />
                                Sent
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <div className="grid lg:grid-cols-2">
                    <div className="border-r border-slate-100 dark:border-zinc-800">
                        <TabsContent value="inbox" className="m-0 p-4">
                            <NoticeList notices={inbox} />
                        </TabsContent>
                        <TabsContent value="sent" className="m-0 p-4">
                            <NoticeList notices={sentBox} isSent />
                        </TabsContent>
                    </div>

                    <div className="bg-slate-50/30 dark:bg-zinc-900/20 p-6 flex flex-col min-h-[500px]">
                        {activeNotice ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white border-0 font-bold px-3 py-1 text-[10px] uppercase tracking-widest">
                                        Notice Details
                                    </Badge>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(activeNotice.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                                    {activeNotice.title}
                                </h2>

                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 mb-8 shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                        {activeNotice.sender.firstName[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                                            {activeNotice.sender.firstName} {activeNotice.sender.lastName}
                                        </p>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                                            {activeNotice.sender.role}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 text-slate-600 dark:text-zinc-300 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                                    {activeNotice.content}
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between font-mono">
                                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Ref: {activeNotice.id.slice(0, 8)}</span>
                                    <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => setActiveNotice(null)}>
                                        Close Message
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-4 opacity-50">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em]">Select a notice to view</p>
                            </div>
                        )}
                    </div>
                </div>
            </Tabs>
        </Card>
    );
}
