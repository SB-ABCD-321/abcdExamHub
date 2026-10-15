"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Copy, 
    Share2, 
    Users, 
    Check, 
    Download, 
    Printer, 
    ExternalLink, 
    QrCode, 
    ShieldCheck, 
    Sparkles, 
    Mail, 
    Smartphone, 
    GraduationCap, 
    CheckCircle2, 
    ArrowRight 
} from "lucide-react";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface InvitationManagerProps {
    joinLink: string;
    workspaceName: string;
    workspaceId: string;
    studentCount: number;
    maxStudents: number;
}

export function InvitationManager({
    joinLink,
    workspaceName,
    workspaceId,
    studentCount,
    maxStudents
}: InvitationManagerProps) {
    const [copied, setCopied] = useState(false);

    const whatsappShareText = encodeURIComponent(
        `🎓 You're invited to join ${workspaceName}!\n\nClick the link below or scan our official QR code to register and access all institution examinations & learning materials:\n\n👉 ${joinLink}`
    );

    const emailSubject = encodeURIComponent(`Invitation to join ${workspaceName} Portal`);
    const emailBody = encodeURIComponent(
        `Dear Candidate,\n\nYou have been invited to join the official ${workspaceName} learning portal.\n\nPlease click the registration link below to activate your student account:\n${joinLink}\n\nBest regards,\n${workspaceName} Administration`
    );

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinLink);
            setCopied(true);
            toast.success("Invitation link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleDownloadQR = () => {
        const svg = document.getElementById("invitation-qr-svg");
        if (!svg) {
            toast.error("QR Code element not found");
            return;
        }

        try {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                canvas.width = 1000;
                canvas.height = 1000;
                if (ctx) {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, 1000, 1000);
                    ctx.drawImage(img, 100, 100, 800, 800);
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `${workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr-code.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                    toast.success("High-resolution QR Code downloaded (PNG)");
                }
            };

            img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
        } catch (e) {
            toast.error("Failed to generate download image");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4 sm:space-y-5">
            {/* MAIN 2-COLUMN ONBOARDING GATEWAY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                {/* LEFT 7 COLS: SHAREABLE LINK & DIGITAL BROADCASTS */}
                <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <Share2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-foreground tracking-tight">Direct Invitation Gateway</h3>
                                    <p className="text-[10.5px] text-muted-foreground font-medium">Unique URL for automatic candidate onboarding</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                                Auto-Link Active
                            </Badge>
                        </div>

                        {/* Join URL Box */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground block">
                                Permanent Institutional Join Link
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={joinLink}
                                    className="bg-muted/30 border-border/60 font-mono text-xs h-10 px-3 rounded-xl select-all focus-visible:ring-primary/20"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleCopy}
                                    className="h-10 px-3.5 rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 shrink-0 font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-emerald-500">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy Link</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Broadcast Channels */}
                        <div className="space-y-2.5 pt-1">
                            <span className="text-xs font-bold text-foreground block">
                                Instant Communication Channels
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <a
                                    href={`https://wa.me/?text=${whatsappShareText}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                >
                                    <Button className="w-full h-10 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs gap-2 cursor-pointer shadow-xs transition-all active:scale-95">
                                        <FaWhatsapp className="w-4 h-4 fill-current" />
                                        <span>Share on WhatsApp</span>
                                    </Button>
                                </a>

                                <a
                                    href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                                    className="block"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-xl border-border/60 hover:bg-muted font-bold text-xs gap-2 cursor-pointer transition-all"
                                    >
                                        <Mail className="w-4 h-4 text-primary" />
                                        <span>Share via Email</span>
                                    </Button>
                                </a>
                            </div>
                        </div>

                        {/* Onboarding Security & Assurance */}
                        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-foreground">Zero-Downtime Auto Linking</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Candidates registering through this link are automatically enrolled under <strong className="text-foreground">{workspaceName}</strong> with immediate access to private assessments without requiring manual confirmation.
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs">
                        <span className="text-muted-foreground">
                            Enrolled: <strong className="text-foreground">{studentCount}</strong> of {maxStudents} Slots
                        </span>
                        <a
                            href={joinLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <span>Preview Gateway</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>

                {/* RIGHT 5 COLS: PHYSICAL SMARTBOARD / QR CODE POSTER */}
                <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs space-y-4 flex flex-col justify-between items-center text-center">
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50 text-left w-full">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                    <QrCode className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-foreground tracking-tight">Classroom QR Poster</h3>
                                    <p className="text-[10.5px] text-muted-foreground font-medium">Scan to join via mobile camera</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground">
                                High-Res
                            </Badge>
                        </div>

                        {/* QR Code Container */}
                        <div className="py-2 flex flex-col items-center justify-center">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 transition-all hover:scale-102">
                                <QRCodeSVG
                                    id="invitation-qr-svg"
                                    value={joinLink}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium mt-2 max-w-xs">
                                Point phone camera at QR code to authenticate and launch the student portal.
                            </p>
                        </div>
                    </div>

                    {/* QR Code Action Buttons */}
                    <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                        <Button
                            variant="outline"
                            onClick={handleDownloadQR}
                            className="h-9 px-3 rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <Download className="w-3.5 h-3.5 text-primary" />
                            <span>Download PNG</span>
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            className="h-9 px-3 rounded-xl border-border/60 hover:bg-muted font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Print Poster</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 3-STEP CANDIDATE ONBOARDING TIMELINE */}
            <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-foreground tracking-tight">Seamless Candidate Onboarding Flow</h3>
                        <p className="text-[10.5px] text-muted-foreground font-medium">How students access your private assessments and institutional repository</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                        {
                            step: "01",
                            title: "Access Gateway",
                            desc: "Students scan the classroom QR code or tap the secure WhatsApp/Email invitation link on any mobile or desktop browser.",
                            icon: Smartphone
                        },
                        {
                            step: "02",
                            title: "Instant Verification",
                            desc: "Candidates authenticate with Google or Email. The system verifies and attaches them to your workspace shard automatically.",
                            icon: ShieldCheck
                        },
                        {
                            step: "03",
                            title: "Assessment Ready",
                            desc: "Scholars are immediately redirected to the student dashboard with all published exams and notices available on their roster.",
                            icon: GraduationCap
                        }
                    ].map((step, i) => (
                        <div
                            key={i}
                            className="p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/40 hover:bg-card transition-all relative overflow-hidden group"
                        >
                            <span className="absolute top-2.5 right-3 text-3xl font-black text-muted-foreground/10 group-hover:text-primary/15 transition-colors select-none font-mono">
                                {step.step}
                            </span>
                            <div className="space-y-2.5">
                                <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs">
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* QUICK ROUTING BAR */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground font-medium">
                        Looking to manage enrolled candidates or broadcast class notices?
                    </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link href="/admin/students">
                        <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl border-border/60 hover:bg-muted font-bold text-xs cursor-pointer">
                            <span>Scholar Roster</span>
                        </Button>
                    </Link>
                    <Link href="/admin/notices">
                        <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl border-border/60 hover:bg-muted font-bold text-xs cursor-pointer">
                            <span>Send Notice</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
