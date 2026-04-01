"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Share2, Trash2, Eye } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExamStatusSwitcher } from "./ExamStatusSwitcher";
import { ExamHistoryClearer } from "./ExamHistoryClearer";
import { ExamStatus } from "@prisma/client";
import { ShareExamDialog } from "@/components/exam/ShareExamDialog";
import Link from "next/link";

interface Props {
    examId: string;
    examTitle: string;
    examStatus: ExamStatus;
    accessType?: string;
}

export function ExamQuickActions({ examId, examTitle, examStatus, accessType }: Props) {
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

    return (
        <>
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-wider text-slate-500">Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
                <ExamStatusSwitcher examId={examId} currentStatus={examStatus} />
                <DropdownMenuItem onSelect={() => setShowShareDialog(true)} className="cursor-pointer">
                    <Share2 className="w-4 h-4 mr-3 text-primary" />
                    Share Exam
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/exam/${examId}?test=true`} target="_blank" className="flex w-full items-center gap-3 px-3 py-2 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all active:scale-[0.98] cursor-pointer">
                        <Eye className="w-4 h-4 text-primary" />
                        Test Paper
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
                <DropdownMenuItem 
                    onSelect={() => setShowClearHistoryDialog(true)} 
                    className="cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/50"
                >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Clear History
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <ShareExamDialog 
            examId={examId} 
            examTitle={examTitle} 
            accessType={accessType}
            open={showShareDialog} 
            onOpenChange={setShowShareDialog} 
        />
        <ExamHistoryClearer 
            examId={examId} 
            open={showClearHistoryDialog} 
            onOpenChange={setShowClearHistoryDialog}
            trigger={null}
        />
        </>
    );
}
