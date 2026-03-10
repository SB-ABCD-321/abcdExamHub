"use client";

import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExamStatusSwitcher } from "./ExamStatusSwitcher";
import { ExamHistoryClearer } from "./ExamHistoryClearer";
import { ExamStatus } from "@prisma/client";

interface Props {
    examId: string;
    examStatus: ExamStatus;
}

export function ExamQuickActions({ examId, examStatus }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-wider text-slate-500">Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
                <ExamStatusSwitcher examId={examId} currentStatus={examStatus} />
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
                <ExamHistoryClearer examId={examId} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
