"use client";

import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MeritResult {
    id: string;
    score: number;
    timeTaken: number;
    createdAt: Date;
    guestName?: string | null;
    guestMobile?: string | null;
    student?: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    } | null;
}

interface ExportMeritListProps {
    examTitle: string;
    workspaceName: string;
    passMarks: number;
    totalQuestions: number;
    results: MeritResult[];
}

export function ExportMeritList({ examTitle, workspaceName, passMarks, totalQuestions, results }: ExportMeritListProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = async () => {
        if (results.length === 0) {
            toast.error("No results to export.");
            return;
        }

        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const dateStr = format(new Date(), "PPpp");

            // 1. Header Section
            doc.setFontSize(22);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text("OFFICIAL MERIT LIST", 105, 20, { align: "center" });

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(examTitle.toUpperCase(), 105, 30, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(`Institution: ${workspaceName}`, 105, 36, { align: "center" });
            doc.text(`Generated on: ${dateStr}`, 105, 41, { align: "center" });

            // 2. Summary stats
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 48, 190, 48);
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(51, 65, 85);
            doc.text(`Total Participants: ${results.length}`, 20, 55);
            doc.text(`Passing Mark: ${passMarks}`, 105, 55, { align: "center" });
            doc.text(`Total Questions: ${totalQuestions}`, 190, 55, { align: "right" });

            // 3. Table Section
            const tableRows = results.map((r, index) => {
                const rank = index + 1;
                const isPass = r.score >= passMarks;
                const percentage = Math.round((r.score / totalQuestions) * 100);
                
                const participantName = r.student 
                    ? `${r.student.firstName || ''} ${r.student.lastName || ''}`.trim() 
                    : (r.guestName || "Guest");
                    
                const participantContact = r.student 
                    ? r.student.email 
                    : (r.guestMobile || "No Mobile");

                return [
                    rank.toString(),
                    participantName,
                    participantContact,
                    r.score.toString(),
                    `${percentage}%`,
                    isPass ? "PASS" : "FAIL"
                ];
            });

            autoTable(doc, {
                startY: 62,
                head: [["Rank", "Student Name", "Email Address", "Score", "Percentage", "Status"]],
                body: tableRows,
                headStyles: { 
                    fillColor: [15, 23, 42], // slate-900
                    textColor: [255, 255, 255], 
                    fontSize: 10,
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', fontStyle: 'bold', cellWidth: 15 },
                    1: { cellWidth: 45 },
                    2: { cellWidth: 55 },
                    3: { halign: 'center', fontStyle: 'bold' },
                    4: { halign: 'center' },
                    5: { halign: 'center', fontStyle: 'bold' }
                },
                styles: { fontSize: 9, cellPadding: 3 },
                alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
                didParseCell: function(data) {
                    if (data.section === 'body' && data.column.index === 5) {
                        const isPass = data.cell.raw === "PASS";
                        if (isPass) {
                            data.cell.styles.textColor = [22, 163, 74]; // green-600
                        } else {
                            data.cell.styles.textColor = [220, 38, 38]; // red-600
                        }
                    }
                }
            });

            // 4. Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Page ${i} of ${pageCount} | abcdExamHub Official Report`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: "center" }
                );
            }

            const fileName = `${examTitle.replace(/\s+/g, '_')}_Merit_List.pdf`;
            doc.save(fileName);
            toast.success("Merit list downloaded successfully!");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            variant="outline"
            className="gap-2 h-9 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
                <FileDown className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-xs font-bold uppercase tracking-tight">
                {isGenerating ? "Processing..." : "Export Merit List"}
            </span>
        </Button>
    );
}
