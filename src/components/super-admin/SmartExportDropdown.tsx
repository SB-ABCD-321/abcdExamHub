"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, FileCode, Loader2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SmartExportDropdownProps {
    payments: any[];
}

export function SmartExportDropdown({ payments }: SmartExportDropdownProps) {
    const [isExporting, setIsExporting] = useState<string | null>(null);

    // 1. CSV EXPORT (Standard RFC-4180)
    const exportCSV = () => {
        if (!payments.length) {
            toast.error("No transaction records available to export");
            return;
        }
        setIsExporting("csv");
        try {
            const headers = [
                "Payment Date",
                "Workspace Name",
                "Reference ID",
                "Plan Name",
                "Duration",
                "Base Amount (INR)",
                "GST Amount (INR)",
                "Total Amount (INR)",
                "Payment Method",
                "Contact Email",
                "Institutional GSTIN"
            ];

            const rows = payments.map((p) => [
                format(new Date(p.paymentDate), "yyyy-MM-dd"),
                `"${(p.workspace?.name || "").replace(/"/g, '""')}"`,
                `TX_${p.id.slice(0, 8).toUpperCase()}`,
                `"${(p.planName || "").replace(/"/g, '""')}"`,
                p.duration || "N/A",
                p.baseAmount || p.amount || 0,
                p.gstAmount || 0,
                p.totalAmount || p.amount || 0,
                p.paymentMethod || "Direct",
                p.workspace?.contactEmail || "N/A",
                p.workspace?.gstNumber || "Unregistered"
            ]);

            const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            downloadFile(blob, `ABCD-ExamHub-Financial-Ledger-${format(new Date(), "yyyy-MM-dd")}.csv`);
            toast.success("CSV Ledger exported successfully");
        } catch (error) {
            console.error("CSV Export Failed:", error);
            toast.error("Failed to generate CSV export");
        } finally {
            setIsExporting(null);
        }
    };

    // 2. EXCEL EXPORT (CSV with UTF-8 BOM so Excel opens with proper accents and formatting)
    const exportExcel = () => {
        if (!payments.length) {
            toast.error("No transaction records available to export");
            return;
        }
        setIsExporting("excel");
        try {
            const headers = [
                "Payment Date",
                "Workspace Name",
                "Transaction Reference",
                "Plan Tier",
                "Duration",
                "Base Amount (INR)",
                "GST (18% INR)",
                "Gross Total (INR)",
                "Settlement Method",
                "Admin Contact",
                "GSTIN"
            ];

            const rows = payments.map((p) => [
                format(new Date(p.paymentDate), "dd-MMM-yyyy"),
                `"${(p.workspace?.name || "").replace(/"/g, '""')}"`,
                `TX_${p.id.slice(0, 8).toUpperCase()}`,
                `"${(p.planName || "").replace(/"/g, '""')}"`,
                p.duration || "N/A",
                (p.baseAmount || p.amount || 0).toFixed(2),
                (p.gstAmount || 0).toFixed(2),
                (p.totalAmount || p.amount || 0).toFixed(2),
                p.paymentMethod || "Direct",
                p.workspace?.contactEmail || "N/A",
                p.workspace?.gstNumber || "Unregistered"
            ]);

            // Prepend UTF-8 BOM (\uFEFF) for native Excel auto-detection
            const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
            downloadFile(blob, `ABCD-ExamHub-Ledger-Excel-${format(new Date(), "yyyy-MM-dd")}.csv`);
            toast.success("Excel report exported successfully");
        } catch (error) {
            console.error("Excel Export Failed:", error);
            toast.error("Failed to generate Excel export");
        } finally {
            setIsExporting(null);
        }
    };

    // 3. PDF AUDIT STATEMENT (jsPDF + autoTable)
    const exportPDF = () => {
        if (!payments.length) {
            toast.error("No transaction records available to export");
            return;
        }
        setIsExporting("pdf");
        try {
            const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
            const totalRevenue = payments.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0);
            const totalGst = payments.reduce((sum, p) => sum + (p.gstAmount || 0), 0);

            // Document Header
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.text("ABCD EXAM HUB — FINANCIAL AUDIT & SETTLEMENT STATEMENT", 40, 45);

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated on: ${format(new Date(), "dd MMMM yyyy, HH:mm:ss")} | Status: Verified Records Only`, 40, 62);
            doc.text(`Total Records: ${payments.length} | Gross Revenue: INR ${totalRevenue.toLocaleString()} | Total GST: INR ${totalGst.toLocaleString()}`, 40, 75);

            // Draw line
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(1);
            doc.line(40, 85, 800, 85);

            const tableRows = payments.map((p) => [
                format(new Date(p.paymentDate), "dd/MM/yyyy"),
                p.workspace?.name || "N/A",
                `TX_${p.id.slice(0, 8).toUpperCase()}`,
                p.planName || "Standard",
                p.duration || "N/A",
                `INR ${(p.baseAmount || p.amount || 0).toLocaleString()}`,
                `INR ${(p.gstAmount || 0).toLocaleString()}`,
                `INR ${(p.totalAmount || p.amount || 0).toLocaleString()}`,
                p.paymentMethod || "Online",
                p.workspace?.gstNumber || "Unregistered"
            ]);

            autoTable(doc, {
                startY: 95,
                head: [[
                    "Date",
                    "Workspace",
                    "Ref ID",
                    "Plan",
                    "Duration",
                    "Base (INR)",
                    "GST (INR)",
                    "Total (INR)",
                    "Method",
                    "GSTIN"
                ]],
                body: tableRows,
                theme: "striped",
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: "bold"
                },
                bodyStyles: {
                    fontSize: 7.5,
                    textColor: [51, 65, 85]
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { left: 40, right: 40 }
            });

            doc.save(`ABCD-ExamHub-Financial-Statement-${format(new Date(), "yyyy-MM-dd")}.pdf`);
            toast.success("PDF Financial Statement downloaded successfully");
        } catch (error) {
            console.error("PDF Export Failed:", error);
            toast.error("Failed to generate PDF Statement");
        } finally {
            setIsExporting(null);
        }
    };

    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={Boolean(isExporting) || payments.length === 0}
                    className="h-8.5 px-3 rounded-xl text-xs font-semibold gap-2 bg-card border-border/60 shadow-2xs hover:bg-muted/50 cursor-pointer"
                >
                    {isExporting ? (
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                    ) : (
                        <Download className="size-3.5 text-primary" />
                    )}
                    <span>{isExporting ? "Exporting..." : "Export Report"}</span>
                    <ChevronDown className="size-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/60 p-1">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Export Financial Data
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                    onClick={exportExcel}
                    className="gap-2.5 text-xs py-2 rounded-lg cursor-pointer font-medium"
                >
                    <FileSpreadsheet className="size-4 text-emerald-500" />
                    <div>
                        <div className="font-semibold text-foreground">Microsoft Excel (.csv)</div>
                        <div className="text-[10px] text-muted-foreground">Formatted with UTF-8 for Excel</div>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={exportCSV}
                    className="gap-2.5 text-xs py-2 rounded-lg cursor-pointer font-medium"
                >
                    <FileCode className="size-4 text-sky-500" />
                    <div>
                        <div className="font-semibold text-foreground">Standard CSV (.csv)</div>
                        <div className="text-[10px] text-muted-foreground">Raw comma-separated ledger</div>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={exportPDF}
                    className="gap-2.5 text-xs py-2 rounded-lg cursor-pointer font-medium"
                >
                    <FileText className="size-4 text-rose-500" />
                    <div>
                        <div className="font-semibold text-foreground">Audit Statement (.pdf)</div>
                        <div className="text-[10px] text-muted-foreground">Printable branded financial report</div>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
