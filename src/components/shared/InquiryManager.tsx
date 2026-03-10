"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, History, ChevronRight, Clock, User as UserIcon, MessageCircle, Phone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateInquiryStatus, deleteInquiry } from "@/actions/inquiry";
import { toast } from "sonner";

function timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (seconds < 60) return rtf.format(-seconds, "second");
    if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
    if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), "hour");
    return rtf.format(-Math.floor(seconds / 86400), "day");
}

interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string | null;
    message: string;
    status: string;
    createdAt: Date;
}

interface Props {
    inquiries: Inquiry[];
}

export function InquiryManager({ inquiries }: Props) {
    const [activeInquiry, setActiveInquiry] = useState<Inquiry | null>(null);
    const [localInquiries, setLocalInquiries] = useState<Inquiry[]>(inquiries || []);

    const handleSelectInquiry = async (inquiry: Inquiry) => {
        setActiveInquiry(inquiry);

        // If it's pending, mark as read automatically
        if (inquiry.status === "PENDING") {
            try {
                const res = await updateInquiryStatus(inquiry.id, "READ");
                if (res.success) {
                    // Update local state to reflect read status immediately (clears sidebar count)
                    setLocalInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, status: "READ" } : i));
                }
            } catch (error) {
                console.error("Failed to update status", error);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this inquiry? This action cannot be undone.")) return;

        try {
            const res = await deleteInquiry(id);
            if (res.success) {
                toast.success("Inquiry deleted successfully.");
                setLocalInquiries(prev => prev.filter(i => i.id !== id));
                if (activeInquiry?.id === id) setActiveInquiry(null);
            } else {
                toast.error(res.error || "Failed to delete inquiry.");
            }
        } catch (error) {
            toast.error("An error occurred during deletion.");
        }
    };

    return (
        <Card className="shadow-lg border-0 ring-1 ring-slate-200 dark:ring-zinc-800 overflow-hidden bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
            <div className="grid lg:grid-cols-12 min-h-[600px]">
                {/* List Column */}
                <div className="lg:col-span-4 border-r border-slate-100 dark:border-zinc-800 flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">All Inquiries</h3>
                            <Badge variant="outline" className="rounded-full px-2 font-bold text-[10px]">{localInquiries.length}</Badge>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
                        {localInquiries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                                <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No inquiries received yet</p>
                            </div>
                        ) : (
                            localInquiries.map((i) => (
                                <button
                                    key={i.id}
                                    onClick={() => handleSelectInquiry(i)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative",
                                        activeInquiry?.id === i.id
                                            ? "bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                            : "bg-white border-slate-100 hover:border-amber-100 hover:bg-amber-50/30 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:border-amber-900/50"
                                    )}
                                >
                                    {i.status === "PENDING" && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                    )}
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl transition-colors",
                                            activeInquiry?.id === i.id ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600"
                                        )}>
                                            <MessageCircle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {i.name}
                                                </p>
                                                <span className="text-[10px] font-medium text-slate-400">{timeAgo(i.createdAt)}</span>
                                            </div>
                                            <h4 className={cn("text-sm font-black truncate leading-tight", i.status === "PENDING" ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-zinc-400")}>
                                                {i.subject || "No Subject"}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-medium">
                                                {i.message}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-8 bg-slate-50/30 dark:bg-zinc-900/20 p-8 flex flex-col">
                    {activeInquiry ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-10">
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-bold px-4 py-1.5 text-[11px] uppercase tracking-widest shadow-lg shadow-amber-500/20">
                                    Client Inquiry
                                </Badge>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <button
                                        onClick={() => handleDelete(activeInquiry.id)}
                                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border-rose-100 border hover:bg-rose-50 hover:text-rose-600 transition-all text-slate-400 shadow-sm"
                                        title="Delete Inquiry"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1" />
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{new Date(activeInquiry.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-8">
                                {activeInquiry.subject || "Mission Inquiry"}
                            </h2>

                            <div className="grid sm:grid-cols-2 gap-6 mb-10">
                                <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-all">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contact Name</p>
                                        <p className="text-sm font-black truncate">{activeInquiry.name}</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                        <p className="text-sm font-black truncate">{activeInquiry.email}</p>
                                    </div>
                                </div>

                                {activeInquiry.phone && (
                                    <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                                            <p className="text-sm font-black truncate">{activeInquiry.phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Current Status</p>
                                        <p className="text-sm font-black truncate uppercase tracking-tighter text-amber-600">{activeInquiry.status}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 text-slate-600 dark:text-zinc-300 leading-relaxed text-base font-medium whitespace-pre-wrap p-10 rounded-[3rem] bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 italic shadow-inner">
                                "{activeInquiry.message}"
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">Tracking ID: {activeInquiry.id}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl"
                                    onClick={() => setActiveInquiry(null)}
                                >
                                    Close Inquiry
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700">
                            <div className="w-24 h-24 rounded-[2.5rem] border-2 border-dashed border-current flex items-center justify-center mb-6 opacity-20">
                                <MessageCircle className="w-10 h-10" />
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-widest mb-2">Select a Lead</h4>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Select an inquiry from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
