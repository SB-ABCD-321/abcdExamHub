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
        const contentWidth = pageWidth - margin * 2;
        let y = 35; // Standard Header Baseline

        // === LOGO INTEGRATION (SIDE-BY-SIDE LAYOUT) ===
        const logoSize = 14;
        let textBaseX = margin;
        
        if (settings?.logoUrl) {
            try {
                const base64 = await getImageBase64(settings.logoUrl);
                doc.addImage(base64, "PNG", margin, y - 10.5, logoSize, logoSize);
                textBaseX = margin + logoSize + 4; // Shift name to the right
            } catch (error) {
                console.error("Logo Draw Fail:", error);
                doc.setFillColor(67, 56, 202);
                doc.roundedRect(margin, y - 9, 10, 10, 1, 1, "F");
                textBaseX = margin + 14;
            }
        } else {
             doc.setFillColor(67, 56, 202);
             doc.roundedRect(margin, y - 9, 10, 10, 1, 1, "F");
             textBaseX = margin + 14;
        }

        // === LUXURY ACCENT LINE ===
        doc.setDrawColor(67, 56, 202); // Indigo
        doc.setLineWidth(0.5);
        doc.line(margin, 15, margin + 40, 15);

        // === BRAND HEADER (HORIZONTAL) ===
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(22); // Slightly smaller for better horizontal fit
        doc.setFont("helvetica", "bold");
        doc.text(settings?.siteName || "ABCD Exam Hub", textBaseX, y);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 180, 180);
        doc.text("OFFICIAL PAYMENT RECEIPT / TAX INVOICE", textBaseX, y + 6);

        // Metadata on right (Safely spaced)
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(67, 56, 202);
        doc.text(`#${payment.receiptNumber || payment.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, y - 5, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(140, 140, 140);
        doc.text(`Issued On: ${format(new Date(payment.paymentDate), "dd/MM/yyyy")}`, pageWidth - margin, y, { align: "right" });

        y += 35; // Advance y to next section

        // === INFORMATION BLOCKS (PROVIDER & CUSTOMER) ===
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 200, 200);
        doc.text("PLATFORM PROVIDER", margin, y);
        
        const rightCol = margin + (contentWidth / 2) + 5;
        doc.text("BILLED TO INSTITUTION", rightCol, y);
        
        y += 7; // Content y

        // Platform Content (Left)
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(settings?.platformLegalName || settings?.siteName || "ABCD Exam Hub", margin, y);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        const providerAddr = settings?.platformAddress || settings?.location || "Kolkata, West Bengal";
        const splitProvider = doc.splitTextToSize(providerAddr, (contentWidth / 2) - 10);
        doc.text(splitProvider, margin, y + 5);
        
        let provGstY = y + 5 + (splitProvider.length * 4) + 4;
        if (settings?.platformGstNumber) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text(`GSTIN: ${settings.platformGstNumber}`, margin, provGstY);
        }

        // Customer Content (Right)
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        doc.text(payment.workspace.name, rightCol, y);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        const clientAddr = payment.billingAddressSnapshot || payment.workspace.billingAddress || payment.workspace.address || "Client address on file";
        const splitClient = doc.splitTextToSize(clientAddr, (contentWidth / 2) - 10);
        doc.text(splitClient, rightCol, y + 5);

        let custGstY = y + 5 + (splitClient.length * 4) + 4;
        if (payment.workspace.gstNumber) {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text(`CLIENT GSTIN: ${payment.workspace.gstNumber}`, rightCol, custGstY);
        }

        // Final Dynamic y calculation for Information Blocks
        y = Math.max(provGstY, custGstY) + 20;

        // === LUXURY DIVIDER ===
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y - 8, pageWidth - margin, y - 8);

        // === TRANSACTION GRID (CHROME STYLE) ===
        const details = [
            { label: "PLAN", value: payment.planName },
            { label: "DURATION", value: payment.duration },
            { label: "METHOD", value: payment.paymentMethod || "Manual Transfer" },
        ];

        const cellWidth = contentWidth / 3;
        details.forEach((item, i) => {
            const x = margin + i * cellWidth;
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(180, 180, 180);
            doc.text(item.label, x, y);
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(item.value, x, y + 7);
        });

        // "Verified" Icon Badge (Right)
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(pageWidth - margin - 35, y - 3, 35, 12, 1, 1, "F");
        doc.setFontSize(7);
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("Verified Artifact", pageWidth - margin - 31, y + 4.5);

        y += 30; // Spacing before Service Table

        // === SERVICE TABLE ===
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 10, "F");
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text("SAC / SERVICE DESCRIPTION", margin + 5, y + 6.5);
        doc.text("VALUE (INR)", pageWidth - margin - 5, y + 6.5, { align: "right" });
        
        y += 10; // First Row

        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text(`SAC 998433: ${payment.planName} Academic Hub Subscription`, margin + 5, y + 10);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(`Proprietary cloud node and specialized teacher management toolsets for ${payment.duration}`, margin + 5, y + 15);
        
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(`Rs. ${(payment.baseAmount || payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 10, { align: "right" });
        
        y += 30; // Spacing before summary

        // === CALCULATION SUMMARY ===
        const sumX = pageWidth - margin - 65; // Shift left for label
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Net Subtotal Value:", sumX, y);
        doc.text(`Rs. ${(payment.baseAmount || payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
        
        y += 7;

        if (payment.gstAmount > 0) {
            doc.text("CGST (9.0%):", sumX, y);
            doc.text(`Rs. ${(payment.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
            y += 7;
            doc.text("SGST (9.0%):", sumX, y);
            doc.text(`Rs. ${(payment.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y, { align: "right" });
            y += 12;
        } else {
            y += 6;
        }

        // Final total line
        doc.setDrawColor(67, 56, 202);
        doc.line(sumX, y - 5, pageWidth - margin, y - 5);
        
        // TOTAL (Small Label per User Request)
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL", sumX, y + 2.5);
        
        doc.setFontSize(14);
        doc.setTextColor(67, 56, 202); // Focus color
        doc.text(`Rs. ${(payment.totalAmount || payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 3, { align: "right" });

        // === LUXURY FOOTER ===
        const footerY = pageHeight - 40;
        doc.setDrawColor(245, 245, 245);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        
        const email = settings?.email || "sb.abcd321@gmail.com";
        const phone = settings?.mobileNo || settings?.whatsappNo || "+91 8944899747";
        const website = window.location.host;

        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(200, 200, 200);
        doc.text("SUPPORT & COMPLIANCE VERIFICATION", margin, footerY + 10);
        
        const colW = contentWidth / 3;
        // Email
        doc.setFontSize(7);
        doc.setTextColor(67, 56, 202);
        doc.text("OFFICIAL EMAIL", margin, footerY + 18);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(email.toLowerCase(), margin, footerY + 23);
        
        // Phone
        doc.setFontSize(7);
        doc.setTextColor(67, 56, 202);
        doc.setFont("helvetica", "bold");
        doc.text("MOBILE CONTACT", margin + colW, footerY + 18);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(phone, margin + colW, footerY + 23);
        
        // Website
        doc.setFontSize(7);
        doc.setTextColor(67, 56, 202);
        doc.setFont("helvetica", "bold");
        doc.text("PLATFORM DOMAIN", margin + colW * 2, footerY + 18);
        doc.setTextColor(120, 120, 120);
        doc.setFont("helvetica", "normal");
        doc.text(website.toLowerCase(), margin + colW * 2, footerY + 23);

        // Security Tag
        doc.setFontSize(6);
        doc.setTextColor(220, 220, 220);
        doc.setFont("helvetica", "italic");
        doc.text("Electronically generated proof of compliance under IT Act. Dynamic verification enabled.", margin, pageHeight - 12);

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
