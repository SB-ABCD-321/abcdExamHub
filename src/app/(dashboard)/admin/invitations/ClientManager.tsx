"use client"

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Users, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";

export function InvitationManager({ joinLink, workspaceName }: { joinLink: string, workspaceName: string }) {
    const [copied, setCopied] = useState(false);

    const whatsappShareText = encodeURIComponent(`You're invited to join ${workspaceName} as a student! Click the link to register and access your mock exams:\n\n${joinLink}`);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinLink);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link");
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 mt-6">
            {/* Link Sharing Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Shareable Link
                    </CardTitle>
                    <CardDescription>
                        Send this secure link to your students. When clicked, it will automatically connect them to your workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Join URL</label>
                        <div className="flex gap-2">
                            <Input readOnly value={joinLink} className="bg-muted/50 font-mono text-xs" />
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <a href={`https://wa.me/?text=${whatsappShareText}`} target="_blank" rel="noreferrer" className="w-full">
                            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                                <FaWhatsapp className="w-4 h-4 mr-2" /> Share via WhatsApp
                            </Button>
                        </a>
                        <a href={`mailto:?subject=Invitation to join ${workspaceName}&body=${whatsappShareText}`} className="w-full">
                            <Button variant="outline" className="w-full">
                                Share via Email
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        QR Code Scan
                    </CardTitle>
                    <CardDescription>
                        Students can scan this code with their mobile phone cameras to instantly join the class.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="p-4 bg-white rounded-xl shadow-sm border">
                        <QRCodeSVG
                            value={joinLink}
                            size={200}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <p className="text-sm text-center text-muted-foreground w-3/4">
                        Print this code and place it in your classroom or include it in your PDF notices.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
