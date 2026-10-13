"use client";

import { useState } from "react";
import { Share2, FileDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PolicyActionsProps {
    title: string;
    content: string;
    effectiveDate: string;
    slug: string;
}

export default function PolicyActions({
    title,
    content,
    effectiveDate,
    slug,
}: PolicyActionsProps) {
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCopy = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success("Policy link copied to clipboard");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadA4Pdf = async () => {
        try {
            setIsGenerating(true);
            toast.loading("Preparing official A4 PDF...", { id: "pdf-download" });

            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF("p", "mm", "a4");

            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 20;
            const contentWidth = pageWidth - margin * 2;
            let y = 25;

            // Brand Header Banner
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(217, 119, 6); // amber/gold primary
            doc.text("ABCD EXAM HUB — INSTITUTIONAL GOVERNANCE", margin, y);
            y += 8;

            // Document Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(20, 20, 20);
            const wrappedTitle = doc.splitTextToSize(title, contentWidth);
            doc.text(wrappedTitle, margin, y);
            y += wrappedTitle.length * 8;

            // Document Metadata
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(110, 110, 110);
            doc.text(
                `Effective: ${effectiveDate}   |   Status: Active Official Policy`,
                margin,
                y
            );
            y += 6;

            // Header Separator Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += 9;

            // Content processing
            const cleanContent = content.replace(/<[^>]*>/g, ""); // strip HTML if any
            const lines = cleanContent.split("\n");

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line) {
                    y += 3.5;
                    continue;
                }

                if (line === "---") {
                    if (y > pageHeight - 30) {
                        doc.addPage();
                        y = 25;
                    } else {
                        y += 2.5;
                        doc.setDrawColor(230, 230, 230);
                        doc.line(margin, y, pageWidth - margin, y);
                        y += 6;
                    }
                    continue;
                }

                // Check for Section Headings (e.g., "1. Acceptance of Terms")
                const isHeading = /^\d+\.\s+/.test(line);
                if (isHeading) {
                    if (y > pageHeight - 35) {
                        doc.addPage();
                        y = 25;
                    } else {
                        y += 4;
                    }
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.setTextColor(20, 20, 20);
                    const wrappedHeading = doc.splitTextToSize(line, contentWidth);
                    doc.text(wrappedHeading, margin, y);
                    y += wrappedHeading.length * 5.5 + 3;
                    doc.setFont("helvetica", "normal");
                    continue;
                }

                // Bullet Items ("* item" or "- item")
                if (line.startsWith("* ") || line.startsWith("- ")) {
                    const bulletText = line.substring(2);
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(9.5);
                    doc.setTextColor(45, 45, 45);

                    const wrappedBullet = doc.splitTextToSize(bulletText, contentWidth - 6);
                    if (y + wrappedBullet.length * 4.8 > pageHeight - 20) {
                        doc.addPage();
                        y = 25;
                    }
                    doc.setFillColor(217, 119, 6);
                    doc.circle(margin + 2, y - 1, 0.8, "F");
                    doc.text(wrappedBullet, margin + 6, y);
                    y += wrappedBullet.length * 4.8 + 1.5;
                    continue;
                }

                // Regular Paragraph
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9.5);
                doc.setTextColor(50, 50, 50);

                const wrappedPara = doc.splitTextToSize(line, contentWidth);
                if (y + wrappedPara.length * 4.8 > pageHeight - 20) {
                    doc.addPage();
                    y = 25;
                }
                doc.text(wrappedPara, margin, y);
                y += wrappedPara.length * 4.8 + 1.5;
            }

            // Page numbering and footer notes across all generated pages
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(140, 140, 140);
                doc.text(
                    `ABCD Exam Hub © ${new Date().getFullYear()} — Page ${i} of ${totalPages}`,
                    margin,
                    pageHeight - 10
                );
                doc.text(
                    "Standard A4 Official Legal Policy",
                    pageWidth - margin,
                    pageHeight - 10,
                    { align: "right" }
                );
            }

            const cleanFileName = `${slug || "policy"}-abcd-exam-hub-a4.pdf`;
            doc.save(cleanFileName);

            toast.success("Document downloaded as A4 PDF!", { id: "pdf-download" });
        } catch (error: any) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF. Please try again.", { id: "pdf-download" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-2 pt-2 border-t border-border/50">
            {/* Download A4 PDF Button */}
            <Button
                onClick={handleDownloadA4Pdf}
                disabled={isGenerating}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs gap-2 shadow-xs hover:bg-primary/90 transition-transform active:scale-98"
            >
                {isGenerating ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <FileDown className="size-4" />
                )}
                <span>Download A4 PDF</span>
            </Button>

            {/* Share Link Button */}
            <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full h-9 rounded-xl border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-medium gap-2 transition-colors"
            >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Share2 className="size-3.5" />}
                <span>{copied ? "Link Copied" : "Share Document"}</span>
            </Button>
        </div>
    );
}
