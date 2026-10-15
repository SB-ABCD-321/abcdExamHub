"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { EditTeacherAiLimitModal } from "@/components/workspace/EditTeacherAiLimitModal";
import { AddUserModal } from "@/components/workspace/AddUserModal";
import {
    Mail,
    Calendar,
    BookOpen,
    ClipboardList,
    TrendingUp,
    Users,
    Sparkles,
    Search,
    X,
    Copy,
    Check,
    CheckCircle2,
    LayoutGrid,
    Table as TableIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface TeacherRecord {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    createdAt: Date | string;
    authoredQuestions: { id: string }[];
    authoredExams: {
        _count: { results: number };
    }[];
    workspaceAiUsages?: {
        aiLimit: number;
        aiGenerationsCount: number;
    }[];
}

interface TeachersDirectoryClientProps {
    teachers: TeacherRecord[];
    workspaceId: string;
    workspaceName: string;
}

export function TeachersDirectoryClient({
    teachers,
    workspaceId,
    workspaceName
}: TeachersDirectoryClientProps) {
    const [viewMode, setViewMode] = useState<"card" | "table">("card");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "exams" | "questions" | "participations">("recent");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        toast.success(`Copied ${email} to clipboard`);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filteredAndSortedTeachers = useMemo(() => {
        let result = [...teachers];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(t => {
                const fullName = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
                const email = t.email.toLowerCase();
                return fullName.includes(q) || email.includes(q);
            });
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "exams") {
                return b.authoredExams.length - a.authoredExams.length;
            }
            if (sortBy === "questions") {
                return b.authoredQuestions.length - a.authoredQuestions.length;
            }
            if (sortBy === "participations") {
                const partsA = a.authoredExams.reduce((acc, curr) => acc + curr._count.results, 0);
                const partsB = b.authoredExams.reduce((acc, curr) => acc + curr._count.results, 0);
                return partsB - partsA;
            }
            // default: recent
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return result;
    }, [teachers, searchQuery, sortBy]);

    return (
        <div className="space-y-4">
            {/* SEARCH & FILTER CONTROLS TOOLBAR */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-card/90 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search faculty by name or email..."
                        className="h-9.5 pl-9 pr-8 text-xs font-medium rounded-xl border-border/60 bg-background/50 focus-visible:ring-primary/20"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                    <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 hidden sm:inline">
                            Sort:
                        </span>
                        <button
                            type="button"
                            onClick={() => setSortBy("recent")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                sortBy === "recent"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Recent
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortBy("exams")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                sortBy === "exams"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Exams
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortBy("questions")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                sortBy === "questions"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Questions
                        </button>
                    </div>

                    {/* View Switcher: Card vs Table */}
                    <div className="flex items-center p-0.5 rounded-xl border border-border/60 bg-muted/30">
                        <button
                            type="button"
                            onClick={() => setViewMode("card")}
                            className={cn(
                                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                viewMode === "card"
                                    ? "bg-card text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Card View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Cards</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                                viewMode === "table"
                                    ? "bg-card text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Table View"
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Table</span>
                        </button>
                    </div>

                    <span className="text-xs font-semibold text-muted-foreground shrink-0 pl-1">
                        {filteredAndSortedTeachers.length} of {teachers.length}
                    </span>
                </div>
            </div>

            {/* EMPTY STATE */}
            {filteredAndSortedTeachers.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border/60 bg-card/60 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                        {teachers.length === 0 ? <Users className="w-6 h-6 opacity-40" /> : <Search className="w-6 h-6 opacity-40" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">
                            {teachers.length === 0 ? "No Faculty Members Enrolled Yet" : "No Matching Faculty Members"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                            {teachers.length === 0
                                ? "Start expanding your academic team by adding educator accounts to your workspace."
                                : "Try clearing your query or searching for a different teacher name or email."}
                        </p>
                    </div>
                    {searchQuery ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                            className="text-xs font-bold text-primary cursor-pointer"
                        >
                            Clear search filter
                        </Button>
                    ) : (
                        <div className="pt-2">
                            <AddUserModal roleType="TEACHER" />
                        </div>
                    )}
                </div>
            ) : viewMode === "table" ? (
                /* ================= TABLE VIEW ================= */
                <Card className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10.5px]">
                                    <th className="py-3 px-4 min-w-[200px]">Faculty Member</th>
                                    <th className="py-3 px-3 text-center">Exam Sets</th>
                                    <th className="py-3 px-3 text-center">Questions</th>
                                    <th className="py-3 px-3 text-center">Submissions</th>
                                    <th className="py-3 px-3 min-w-[140px]">AI Quota</th>
                                    <th className="py-3 px-3 text-center">Joined</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filteredAndSortedTeachers.map((teacher) => {
                                    const questionsCount = teacher.authoredQuestions.length;
                                    const examsCreated = teacher.authoredExams.length;
                                    const totalParticipations = teacher.authoredExams.reduce(
                                        (acc, curr) => acc + curr._count.results,
                                        0
                                    );

                                    const usageRecord = teacher.workspaceAiUsages?.[0];
                                    const teacherAiLimit = usageRecord?.aiLimit ?? 5;
                                    const teacherAiUsage = usageRecord?.aiGenerationsCount ?? 0;
                                    const aiUsagePercent = teacherAiLimit > 0 ? Math.min(100, Math.round((teacherAiUsage / teacherAiLimit) * 100)) : 0;
                                    const teacherDisplayName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email.split("@")[0];

                                    return (
                                        <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                                            {/* Faculty info */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="w-8 h-8 rounded-lg border border-border/60 shrink-0">
                                                        <AvatarImage src={teacher.imageUrl || ""} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                                            {teacher.firstName?.[0] || teacher.email[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-foreground text-xs block truncate">
                                                            {teacherDisplayName}
                                                        </span>
                                                        <span className="text-[10.5px] text-muted-foreground block truncate">
                                                            {teacher.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Exams */}
                                            <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                                                {examsCreated}
                                            </td>

                                            {/* Questions */}
                                            <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                                                {questionsCount}
                                            </td>

                                            {/* Submissions */}
                                            <td className="py-3 px-3 text-center font-bold text-foreground tabular-nums">
                                                {totalParticipations}
                                            </td>

                                            {/* AI Quota */}
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                                                            <span>{teacherAiUsage}/{teacherAiLimit}</span>
                                                            <span className={cn(aiUsagePercent >= 100 && "text-rose-500 font-bold")}>{aiUsagePercent}%</span>
                                                        </div>
                                                        <Progress value={aiUsagePercent} className="h-1.5" />
                                                    </div>
                                                    <EditTeacherAiLimitModal
                                                        workspaceId={workspaceId}
                                                        teacherId={teacher.id}
                                                        teacherName={teacherDisplayName}
                                                        currentLimit={teacherAiLimit}
                                                        currentUsage={teacherAiUsage}
                                                    />
                                                </div>
                                            </td>

                                            {/* Joined */}
                                            <td className="py-3 px-3 text-center text-muted-foreground text-[10.5px] font-medium whitespace-nowrap">
                                                {format(new Date(teacher.createdAt), "dd MMM yyyy")}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyEmail(teacher.email)}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                                        title="Copy Email"
                                                    >
                                                        {copiedEmail === teacher.email ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                    <UniversalDeleteAction
                                                        type="TEACHER"
                                                        id={teacher.id}
                                                        name={teacherDisplayName}
                                                        workspaceId={workspaceId}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                /* ================= CARD VIEW ================= */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {filteredAndSortedTeachers.map((teacher) => {
                        const questionsCount = teacher.authoredQuestions.length;
                        const examsCreated = teacher.authoredExams.length;
                        const totalParticipations = teacher.authoredExams.reduce(
                            (acc, curr) => acc + curr._count.results,
                            0
                        );

                        const usageRecord = teacher.workspaceAiUsages?.[0];
                        const teacherAiLimit = usageRecord?.aiLimit ?? 5;
                        const teacherAiUsage = usageRecord?.aiGenerationsCount ?? 0;
                        const aiUsagePercent = teacherAiLimit > 0 ? Math.min(100, Math.round((teacherAiUsage / teacherAiLimit) * 100)) : 0;
                        const teacherDisplayName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || teacher.email.split("@")[0];

                        return (
                            <Card
                                key={teacher.id}
                                className="border border-border/70 bg-card/90 backdrop-blur-xl rounded-2xl shadow-2xs hover:shadow-md hover:border-primary/40 transition-all overflow-hidden flex flex-col justify-between"
                            >
                                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/40">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="w-11 h-11 rounded-xl border border-primary/20 shadow-xs shrink-0">
                                                <AvatarImage src={teacher.imageUrl || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-black text-sm uppercase">
                                                    {teacher.firstName?.[0] || teacher.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight truncate">
                                                    {teacherDisplayName}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground font-medium">
                                                    <span className="truncate max-w-[150px] sm:max-w-[180px]" title={teacher.email}>
                                                        {teacher.email}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyEmail(teacher.email)}
                                                        className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                                        title="Copy email"
                                                    >
                                                        {copiedEmail === teacher.email ? (
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <UniversalDeleteAction
                                            type="TEACHER"
                                            id={teacher.id}
                                            name={teacherDisplayName}
                                            workspaceId={workspaceId}
                                        />
                                    </div>
                                </CardHeader>

                                <CardContent className="p-4 sm:p-5 space-y-3.5">
                                    {/* 3-Column Stats Strip */}
                                    <div className="grid grid-cols-3 gap-1 p-1 bg-muted/20 rounded-xl border border-border/50 text-center">
                                        <div className="p-1.5">
                                            <span className="text-base font-black text-foreground block tabular-nums">{examsCreated}</span>
                                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground tracking-wider">Exams</span>
                                        </div>
                                        <div className="p-1.5 border-x border-border/50">
                                            <span className="text-base font-black text-foreground block tabular-nums">{questionsCount}</span>
                                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground tracking-wider">Questions</span>
                                        </div>
                                        <div className="p-1.5">
                                            <span className="text-base font-black text-foreground block tabular-nums">{totalParticipations}</span>
                                            <span className="text-[9.5px] font-bold uppercase text-muted-foreground tracking-wider">Attempts</span>
                                        </div>
                                    </div>

                                    {/* AI Quota Management Section */}
                                    <div className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-xs font-bold text-foreground">AI Quota</span>
                                            </div>
                                            <EditTeacherAiLimitModal
                                                workspaceId={workspaceId}
                                                teacherId={teacher.id}
                                                teacherName={teacherDisplayName}
                                                currentLimit={teacherAiLimit}
                                                currentUsage={teacherAiUsage}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                                                <span>Used: <strong className="text-foreground">{teacherAiUsage}</strong> of {teacherAiLimit}</span>
                                                <span className={cn(aiUsagePercent >= 100 ? "text-rose-500 font-bold" : "text-foreground font-semibold")}>
                                                    {aiUsagePercent}%
                                                </span>
                                            </div>
                                            <Progress value={aiUsagePercent} className="h-1.5" />
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10.5px]">
                                        <div className="flex items-center text-muted-foreground font-medium">
                                            <Calendar className="w-3 h-3 mr-1 text-muted-foreground/60" />
                                            Joined {format(new Date(teacher.createdAt), "dd MMM yyyy")}
                                        </div>
                                        <Badge variant="outline" className="text-[9.5px] font-bold uppercase tracking-wider border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Active
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
