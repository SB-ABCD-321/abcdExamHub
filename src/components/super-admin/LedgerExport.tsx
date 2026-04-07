"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

interface LedgerExportProps {
    payments: any[];
}

export function LedgerExport({ payments }: LedgerExportProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = () => {
        setIsExporting(true);
        try {
            // CSV Headers
            const headers = [
                "Payment Date",
                "Workspace Name",
                "Reference ID",
                "Plan Name",
                "Duration",
                "Base Amount (INR)",
                "GST Amount (INR)",
                "Total Amount (INR)",
                "Contact Email",
                "Institutional GSTIN"
            ];

            // Map payments to CSV rows
            const rows = payments.map(p => [
                format(new Date(p.paymentDate), "dd/MM/yyyy"),
                `"${p.workspace.name.replace(/"/g, '""')}"`, // Escape quotes and handle commas
                `TX_${p.id.slice(0, 8).toUpperCase()}`,
                `"${p.planName}"`,
                p.duration,
                p.baseAmount || p.amount,
                p.gstAmount || 0,
                p.totalAmount || p.amount,
                p.workspace.contactEmail || "N/A",
                p.workspace.gstNumber || "Unregistered"
            ]);

            // Combine into CSV string
            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.join(","))
            ].join("\n");

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const dateStr = format(new Date(), "dd-MM-yyyy");
            
            link.setAttribute("href", url);
            link.setAttribute("download", `abcdExamHub-Full-Ledger-${dateStr}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Platform Ledger Exported Successfully");
        } catch (error) {
            console.error("Export Fail:", error);
            toast.error("Failed to generate ledger export.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button 
            variant="outline" 
            className="h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-white dark:bg-zinc-900 border-zinc-200 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50" 
            onClick={handleExport}
            disabled={isExporting || payments.length === 0}
        >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 stroke-[2.5]" />}
            {isExporting ? "Compiling..." : "Download Full Ledger"}
        </Button>
    );
}
