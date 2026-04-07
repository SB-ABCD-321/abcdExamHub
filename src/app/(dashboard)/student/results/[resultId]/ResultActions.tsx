"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuestionData {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
}

interface ResultActionsProps {
    resultId: string;
    examTitle: string;
    workspaceName: string;
    score: number;
    maxMarks: number;
    percentage: number;
    isPass: boolean;
    passMarks: number;
    timeTaken: number;
    rank: number;
    totalParticipants: number;
    submittedAt: string;
    studentName: string;
    questions: { question: QuestionData }[];
    studentAnswers: Record<string, string>;
    showCorrectAnswers: boolean;
    showDetailedLog: boolean;
    allowPdfDownload: boolean;
    isArchived?: boolean;
}

export function ResultActions({
    resultId,
    examTitle,
    workspaceName,
    score,
    maxMarks,
    percentage,
    isPass,
    passMarks,
    timeTaken,
    rank,
    totalParticipants,
    submittedAt,
    studentName,
    questions,
    studentAnswers,
    showCorrectAnswers,
    showDetailedLog,
    allowPdfDownload,
    isArchived = false
}: ResultActionsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const handleExportPDF = async () => {
        setIsExporting(true);

        try {
            const { jsPDF } = await import("jspdf");
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - margin * 2;
            let y = margin;

            const checkPageBreak = (requiredHeight: number) => {
                if (y + requiredHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            // Footer helper - adds branding to every page
            const addFooter = (pdfDoc: any, pw: number, ph: number) => {
                pdfDoc.setFillColor(245, 245, 250);
                pdfDoc.rect(0, ph - 22, pw, 22, "F");
                pdfDoc.setFontSize(7);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(67, 56, 202);
                pdfDoc.text("ABCD Exam Hub", margin, ph - 14);
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.setTextColor(130, 130, 130);
                pdfDoc.text("ABCD Exam Hub  |  abcdexamhub.vercel.app", margin, ph - 8);
                pdfDoc.text(`Result ID: ${resultId}`, pw - margin, ph - 8, { align: "right" });
            };

            // === HEADER BAR ===
            doc.setFillColor(67, 56, 202); // Indigo
            doc.rect(0, 0, pageWidth, 50, "F");

            // Brand name
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("ABCD Exam Hub", margin, 18);

            // Tagline
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("Exam Result Report", margin, 27);

            // Website & contact
            doc.setFontSize(8);
            doc.text("abcdexamhub.vercel.app", margin, 36);

            // Date on right
            doc.setFontSize(8);
            doc.text(
                new Date().toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" }),
                pageWidth - margin, 18, { align: "right" }
            );

            y = 58;

            // === WORKSPACE ===
            doc.setFillColor(243, 244, 255);
            doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(67, 56, 202);
            doc.text(`Workspace: ${workspaceName}`, margin + 4, y + 7);
            y += 16;

            // === EXAM TITLE ===
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text(examTitle, margin, y);
            y += 10;

            // === STUDENT NAME ===
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(`Student: ${studentName}`, margin, y);
            y += 14;

            // === DETAILS GRID ===
            const gridItems = [
                { label: "Score", value: `${score} / ${maxMarks}` },
                { label: "Percentage", value: `${percentage}%` },
                { label: "Status", value: isPass ? "PASSED" : "FAILED" },
                { label: "Pass Marks", value: `${passMarks}` },
                { label: "Time Taken", value: formatTime(timeTaken) },
                { label: "Rank", value: `#${rank} of ${totalParticipants}` },
                { label: "Submitted", value: new Date(submittedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) },
                { label: "Workspace", value: workspaceName },
            ];

            const cellWidth = contentWidth / 4;
            const cellHeight = 18;

            gridItems.forEach((item, i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const x = margin + col * cellWidth;
                const cellY = y + row * cellHeight;

                // Cell background
                doc.setFillColor(col % 2 === 0 ? 248 : 243, col % 2 === 0 ? 248 : 244, 255);
                doc.roundedRect(x + 1, cellY, cellWidth - 2, cellHeight - 2, 2, 2, "F");

                // Label
                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(140, 140, 140);
                doc.text(item.label.toUpperCase(), x + 4, cellY + 6);

                // Value
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");

                if (item.label === "Status") {
                    doc.setTextColor(isPass ? 22 : 220, isPass ? 163 : 38, isPass ? 74 : 38);
                } else {
                    doc.setTextColor(30, 30, 30);
                }
                doc.text(item.value, x + 4, cellY + 13);
            });

            y += Math.ceil(gridItems.length / 4) * cellHeight + 10;

            // === QUESTIONS SECTION ===
            if (showDetailedLog && questions.length > 0) {
                checkPageBreak(20);

                // Section Header
                doc.setFillColor(67, 56, 202);
                doc.rect(margin, y, contentWidth, 10, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text("DETAILED QUESTION LOG", margin + 4, y + 7);
                y += 16;

                questions.forEach((eq, index) => {
                    const q = eq.question;
                    const studentAnswer = studentAnswers[q.id];
                    const isCorrect = studentAnswer === q.correctAnswer;
                    const isUnanswered = !studentAnswer;

                    // Estimate height needed
                    const questionLines = doc.splitTextToSize(q.text, contentWidth - 16);
                    let estimatedHeight = 28 + questionLines.length * 5;
                    q.options.forEach(opt => {
                        const optLines = doc.splitTextToSize(opt, contentWidth - 30);
                        estimatedHeight += optLines.length * 5 + 3;
                    });
                    if (showCorrectAnswers && !isCorrect) estimatedHeight += 10;

                    checkPageBreak(estimatedHeight);

                    // Question number badge
                    const statusColor = isCorrect ? [22, 163, 74] : isUnanswered ? [148, 163, 184] : [220, 38, 38];
                    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
                    doc.roundedRect(margin, y, 8, 8, 1.5, 1.5, "F");
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "bold");
                    doc.text(`${index + 1}`, margin + (index + 1 > 9 ? 1.5 : 2.8), y + 5.5);

                    // Status text
                    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
                    doc.setFontSize(7);
                    doc.text(isCorrect ? "CORRECT" : isUnanswered ? "SKIPPED" : "WRONG", margin + 11, y + 5.5);

                    y += 12;

                    // Question text
                    doc.setTextColor(30, 30, 30);
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    questionLines.forEach((line: string) => {
                        doc.text(line, margin + 4, y);
                        y += 5;
                    });
                    y += 3;

                    // Options
                    const optionLabels = ["A", "B", "C", "D", "E", "F"];
                    q.options.forEach((opt, optIdx) => {
                        const optLabel = optionLabels[optIdx] || `${optIdx + 1}`;
                        const isStudentChoice = opt === studentAnswer;
                        const isCorrectOption = opt === q.correctAnswer;

                        const optLines = doc.splitTextToSize(`${optLabel}. ${opt}`, contentWidth - 20);

                        checkPageBreak(optLines.length * 5 + 4);

                        // Highlight background
                        if (isStudentChoice && isCorrect) {
                            doc.setFillColor(220, 252, 231); // green bg
                            doc.roundedRect(margin + 4, y - 3.5, contentWidth - 8, optLines.length * 5 + 2, 1.5, 1.5, "F");
                        } else if (isStudentChoice && !isCorrect) {
                            doc.setFillColor(254, 226, 226); // red bg
                            doc.roundedRect(margin + 4, y - 3.5, contentWidth - 8, optLines.length * 5 + 2, 1.5, 1.5, "F");
                        } else if (showCorrectAnswers && isCorrectOption) {
                            doc.setFillColor(220, 252, 231); // green bg for correct
                            doc.roundedRect(margin + 4, y - 3.5, contentWidth - 8, optLines.length * 5 + 2, 1.5, 1.5, "F");
                        }

                        doc.setFontSize(9);
                        if (isStudentChoice) {
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(isCorrect ? 22 : 220, isCorrect ? 163 : 38, isCorrect ? 74 : 38);
                        } else if (showCorrectAnswers && isCorrectOption) {
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(22, 163, 74);
                        } else {
                            doc.setFont("helvetica", "normal");
                            doc.setTextColor(60, 60, 60);
                        }

                        optLines.forEach((line: string) => {
                            doc.text(line, margin + 8, y);
                            y += 5;
                        });

                        // Indicator text
                        if (isStudentChoice) {
                            doc.setFontSize(7);
                            doc.setFont("helvetica", "bold");
                            doc.text("[YOUR ANSWER]", margin + contentWidth - 32, y - 3);
                        }
                        if (showCorrectAnswers && isCorrectOption && !isStudentChoice) {
                            doc.setFontSize(7);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(22, 163, 74);
                            doc.text("[CORRECT]", margin + contentWidth - 26, y - 3);
                        }

                        y += 2;
                    });

                    y += 6;

                    // Divider line
                    doc.setDrawColor(230, 230, 230);
                    doc.setLineWidth(0.3);
                    doc.line(margin, y, pageWidth - margin, y);
                    y += 6;
                });
            }

            // === FOOTER on last page ===
            addFooter(doc, pageWidth, pageHeight);

            doc.save(`${examTitle.replace(/[^a-zA-Z0-9]/g, "_")}_Result.pdf`);
            toast.success("PDF exported successfully!");
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Failed to export PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {!isArchived && allowPdfDownload && (
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 text-[10px] uppercase font-black tracking-widest gap-2 text-indigo-600 border-indigo-200"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {isExporting ? "Generating..." : "Export PDF"}
                </Button>
            )}
        </div>
    );
}
