"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check, Mail, MessageCircle, Send, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface Props {
    examId: string;
    examTitle: string;
    accessType?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ShareExamDialog({ examId, examTitle, accessType, open, onOpenChange, trigger }: Props) {
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    
    // Guest exams use the public /live gateway, everything else goes through /exam auth boundary
    const shareUrl = accessType === "OPEN_GUEST" 
        ? `${baseUrl}/live/${examId}` 
        : `${baseUrl}/exam/${examId}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsApp = () => {
        const text = `Join the exam: ${examTitle}\n\nLink: ${shareUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareViaEmail = () => {
        const subject = `Exam Invitation: ${examTitle}`;
        const body = `You have been invited to take the exam: ${examTitle}\n\nAccess it here: ${shareUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const downloadQR = () => {
        if (!qrRef.current) return;
        const svg = qrRef.current.querySelector("svg");
        if (!svg) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            canvas.width = 512;
            canvas.height = 512;
            ctx?.drawImage(img, 0, 0, 512, 512);
            URL.revokeObjectURL(url);

            const a = document.createElement("a");
            a.download = `${examTitle.replace(/[^a-zA-Z0-9]/g, "_")}_QR.png`;
            a.href = canvas.toDataURL("image/png");
            a.click();
            toast.success("QR code downloaded!");
        };
        img.src = url;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl dark:bg-zinc-900 overflow-hidden">
                <DialogHeader className="p-4 pt-6">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-center">Share Link</DialogTitle>
                    <DialogDescription className="text-center font-medium italic">
                        Send this link or scan the QR code to start the exam.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 pt-0 space-y-6">
                    {/* QR Code */}
                    <div className="flex flex-col items-center gap-3">
                        <div
                            ref={qrRef}
                            className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-700"
                        >
                            <QRCodeSVG
                                value={shareUrl}
                                size={180}
                                level="H"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#1e1e2e"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadQR}
                            className="text-[10px] font-bold uppercase tracking-widest gap-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download QR
                        </Button>
                    </div>

                    {/* URL Input */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 group">
                            <Input
                                readOnly
                                value={shareUrl}
                                className="h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-mono text-xs pr-12 shadow-inner"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                            </button>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="grid grid-cols-3 gap-4">
                        <Button 
                            variant="outline" 
                            onClick={shareOnWhatsApp}
                            className="flex flex-col h-auto py-5 gap-3 rounded-2xl border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 group transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold tracking-widest">WhatsApp</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={shareViaEmail}
                            className="flex flex-col h-auto py-5 gap-3 rounded-2xl border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 group transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <Mail className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold tracking-widest">Email</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={copyToClipboard}
                            className="flex flex-col h-auto py-5 gap-3 rounded-2xl border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white group transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-zinc-700 text-white flex items-center justify-center shadow-lg shadow-black/10 group-hover:scale-110 transition-transform">
                                <Send className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold tracking-widest">Copy</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
