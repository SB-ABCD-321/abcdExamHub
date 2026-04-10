"use client";

import { Button } from "@/components/ui/button";
import { Share2, Check, Loader2, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReceiptActionsProps {
    payment: any;
    settings: any;
}

export function ReceiptActions({ payment, settings }: ReceiptActionsProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const getImageBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute("crossOrigin", "anonymous");
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL("image/png");
                resolve(dataURL);
            };
            img.onerror = (err) => reject(err);
            img.src = url;
        });
    };

    const generatePDFBlob = async (): Promise<Blob> => {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const mainW = pageWidth - margin * 2;
        
        let y = 0;

        // === PREMIUM DARK HEADER ===
        doc.setFillColor(9, 9, 11); // zinc-950
        doc.rect(0, 0, pageWidth, 45, "F");
        
        // Gold accent line under header
        doc.setFillColor(255, 215, 0); // Gold
        doc.rect(0, 45, pageWidth, 2, "F");

        let textBaseX = margin;
        
        // Perfect vertical alignment calculations
        // Header height is 45, true center is 22.5
        const logoSize = 20;
        const logoY = 22.5 - (logoSize / 2); // Center logo vertically
        
        if (settings?.logoUrl) {
            try {
                const base64 = await getImageBase64(settings.logoUrl);
                // Draw logo perfectly centered
                doc.addImage(base64, "PNG", margin, logoY, logoSize, logoSize);
                textBaseX = margin + logoSize + 4; // Offset text past logo
            } catch (error) {
                console.error("Logo Draw Fail:", error);
            }
        }
        
        // Text baseline calculations for vertical alignment
        const titleY = 21.5; 
        const subtitleY = 30.5;

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bolditalic");
        doc.text(settings?.siteName || "ABCD EXAM HUB", textBaseX, titleY);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 215, 0);
        doc.text("PREMIUM OFFICIAL INVOICE", textBaseX, subtitleY);

        // Header Meta (Right Formatted)
        const rightY1 = 18;
        const rightY2 = 24.5;
        const rightY3 = 30.5; // Aligns perfectly with subtitleY

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`INVOICE #: ${payment.receiptNumber || payment.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, rightY1, { align: "right" });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 160);
        doc.text(`DATE ISSUED: ${format(new Date(payment.paymentDate), "MMM dd, yyyy")}`, pageWidth - margin, rightY2, { align: "right" });
        
        // Premium status highlight
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 215, 0); // Gold
        doc.text(`STATUS: PAID IN FULL`, pageWidth - margin, rightY3, { align: "right" });

        y = 65;

        // === BILLING ENTITIES (Side by Side) ===
        const colW = (mainW / 2) - 5;
        
        // Platform Provider Box
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, colW, 40, "F");
        doc.setDrawColor(230, 230, 230);
        doc.rect(margin, y, colW, 40, "S");
        
        // Billed To Box
        doc.setFillColor(250, 250, 250);
        doc.rect(margin + colW + 10, y, colW, 40, "F");
        doc.rect(margin + colW + 10, y, colW, 40, "S");

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 120, 120);
        doc.text("PLATFORM PROVIDER", margin + 5, y + 7);
        doc.text("BILLED TO INSTITUTION", margin + colW + 15, y + 7);

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(settings?.platformLegalName || settings?.siteName || "ABCD Exam Hub", margin + 5, y + 14);
        doc.text(payment.workspace.name, margin + colW + 15, y + 14);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        
        const providerAddr = doc.splitTextToSize(settings?.platformAddress || settings?.location || "Kolkata, West Bengal", colW - 10);
        doc.text(providerAddr, margin + 5, y + 20);
        if (settings?.platformGstNumber) {
            doc.setFont("helvetica", "bold");
            doc.text(`GSTIN: ${settings.platformGstNumber}`, margin + 5, y + 35);
        }

        doc.setFont("helvetica", "normal");
        const clientAddr = doc.splitTextToSize(payment.billingAddressSnapshot || payment.workspace.billingAddress || payment.workspace.address || "Client address on file", colW - 10);
        doc.text(clientAddr, margin + colW + 15, y + 20);
        if (payment.workspace.gstNumber) {
            doc.setFont("helvetica", "bold");
            doc.text(`GSTIN: ${payment.workspace.gstNumber}`, margin + colW + 15, y + 35);
        }

        y += 55;

        // === SUBSCRIPTION DETAILS STRIP ===
        doc.setFillColor(255, 248, 220); // Light warm
        doc.rect(margin, y, mainW, 15, "F");
        doc.setDrawColor(255, 215, 0); // Gold
        doc.rect(margin, y, mainW, 15, "S");

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(150, 120, 0); // Darker bold
        doc.text("SUBSCRIPTION PLAN:", margin + 5, y + 6);
        doc.text("PLAN DURATION:", margin + (mainW / 3) + 5, y + 6);
        doc.text("METHOD:", margin + (2 * mainW / 3) + 5, y + 6);

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(payment.planName, margin + 5, y + 11.5);
        doc.text(payment.duration, margin + (mainW / 3) + 5, y + 11.5);
        doc.text(payment.paymentMethod || "Manual Transfer", margin + (2 * mainW / 3) + 5, y + 11.5);

        y += 30;

        // === ITEMIZED TABLE ===
        // Header
        doc.setFillColor(9, 9, 11);
        doc.rect(margin, y, mainW, 10, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("SAC / ITEM DESCRIPTION", margin + 5, y + 6.5);
        doc.text("NET AMOUNT (INR)", pageWidth - margin - 5, y + 6.5, { align: "right" });

        y += 10;
        
        // Row 1
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, mainW, 16, "F");
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 16, pageWidth - margin, y + 16);

        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(`SAC 998433: Platform Licensing (${payment.planName})`, margin + 5, y + 7);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(`Service period: ${payment.duration}. Specialized software as a service provision.`, margin + 5, y + 12);
        
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(`Rs. ${(payment.baseAmount || payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 9.5, { align: "right" });

        y += 30;

        // === TOTALS CALCULATION (Right aligned) ===
        const sumX = pageWidth - margin - 60;
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Subtotal:", sumX, y);
        doc.setTextColor(30, 30, 30);
        doc.text(`Rs. ${(payment.baseAmount || payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
        
        y += 7;

        if (payment.gstAmount > 0) {
            doc.setTextColor(100, 100, 100);
            doc.text("CGST (9.0%):", sumX, y);
            doc.setTextColor(30, 30, 30);
            doc.text(`Rs. ${(payment.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
            y += 7;
            
            doc.setTextColor(100, 100, 100);
            doc.text("SGST (9.0%):", sumX, y);
            doc.setTextColor(30, 30, 30);
            doc.text(`Rs. ${(payment.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
            y += 10;
        } else {
            y += 3;
        }

        // Final Dark block for Grand Total
        doc.setFillColor(9, 9, 11);
        doc.rect(sumX - 5, y - 6, (pageWidth - margin) - (sumX - 5), 14, "F");
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 215, 0); // Gold
        doc.text("GRAND TOTAL", sumX, y + 3);

        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(`Rs. ${(payment.totalAmount || payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 3.5, { align: "right" });

        // === FOOTER ===
        const footerY = pageHeight - 35;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        
        const email = settings?.email || "sb.abcd321@gmail.com";
        const phone = settings?.mobileNo || settings?.whatsappNo || "+91 8944899747";
        const website = window?.location?.host || "abcdexamhub.com";

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(9, 9, 11);
        doc.text("CONTACT & COMPLIANCE", margin, footerY + 8);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        
        // Setup Icon Styles
        doc.setLineWidth(0.3);
        doc.setDrawColor(150, 150, 150);

        // Email Icon (Envelope)
        const ey = footerY + 11.5;
        doc.rect(margin, ey, 4, 3);
        doc.line(margin, ey, margin + 2, ey + 1.5);
        doc.line(margin + 4, ey, margin + 2, ey + 1.5);
        doc.text(email, margin + 6, footerY + 14);
        
        // Phone Icon (Mobile Smartphone)
        const py = footerY + 16;
        doc.roundedRect(margin + 0.8, py, 2.4, 3.5, 0.3, 0.3);
        doc.line(margin + 1.4, py + 2.8, margin + 2.6, py + 2.8); // tiny screen button/line
        doc.text(phone, margin + 6, footerY + 19);
        
        // Website Icon (Globe)
        const wy = footerY + 21.5;
        doc.circle(margin + 2, wy + 1.2, 1.5);
        doc.ellipse(margin + 2, wy + 1.2, 0.6, 1.5); // vertical meridian
        doc.line(margin + 0.5, wy + 1.2, margin + 3.5, wy + 1.2); // equator
        doc.text(website, margin + 6, footerY + 24);

        // Security Tag Right aligned
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        const tag = "Electronically generated tax invoice under IT Act.\nNo physical signature required for compliance verification.";
        const splitTag = doc.splitTextToSize(tag, 100);
        doc.text(splitTag, pageWidth - margin, footerY + 14, { align: "right" });

        return doc.output("blob");
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const blob = await generatePDFBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Invoice-${payment.receiptNumber || payment.id.slice(0, 8)}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Professional Invoice Generated");
        } catch (error) {
            console.error("PDF Fail:", error);
            toast.error("Failed to generate PDF. Using browser print.");
            window.print();
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async () => {
        setIsGenerating(true);
        try {
            const blob = await generatePDFBlob();
            const file = new File([blob], `Invoice-${payment.receiptNumber || payment.id.slice(0, 8)}.pdf`, { type: "application/pdf" });

            if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "Platform Tax Invoice",
                    text: "Please find the attached institutional payment receipt.",
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                toast.success("Invoice link copied");
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            toast.error("Share failed. Please download instead.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex items-center gap-2 md:gap-3 no-print">
            <Button 
                variant="outline" 
                className="h-10 md:h-12 px-3 md:px-5 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] gap-2 bg-white dark:bg-zinc-900 border-zinc-200 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50" 
                onClick={handleDownload}
                disabled={isGenerating}
            >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 md:w-4 h-3.5 md:h-4 stroke-[2.5]" />}
                <span className={isGenerating ? "" : "hidden md:inline"}>{isGenerating ? "AUDITTING..." : "Download Compliance PDF"}</span>
                <span className={isGenerating ? "hidden" : "md:hidden"}>PDF Proof</span>
            </Button>
            
            <Button 
                variant="default" 
                className="h-10 md:h-12 px-3 md:px-5 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50" 
                onClick={handleShare}
                disabled={isGenerating}
            >
                {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 md:w-4 h-3.5 md:h-4" />)}
                <span className={isGenerating ? "" : "hidden md:inline"}>{isGenerating ? "SHARING..." : (copied ? "Proof Saved" : "Share Official Proof")}</span>
                <span className={isGenerating ? "hidden" : "md:hidden"}>{copied ? "Copied" : "Share"}</span>
            </Button>
        </div>
    );
}
