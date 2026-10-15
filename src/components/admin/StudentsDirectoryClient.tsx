"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PromoteTeacherModal } from "@/components/workspace/PromoteTeacherModal";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { AddUserModal } from "@/components/workspace/AddUserModal";
import { 
    Search, 
    X, 
    GraduationCap, 
    Calendar, 
    Copy, 
    Check, 
    LayoutGrid, 
    Table as TableIcon,
    Award,
    ClipboardList,
    Mail,
    ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface StudentRecord {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    phoneNumber?: string | null;
    createdAt: Date | string;
    examResults?: { id: string; score: number }[];
}

interface StudentsDirectoryClientProps {
    students: StudentRecord[];
    workspaceId: string;
    workspaceName: string;
}

export function StudentsDirectoryClient({
    students,
    workspaceId,
    workspaceName
}: StudentsDirectoryClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "name" | "exams">("recent");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        toast.success(`Copied ${email} to clipboard`);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filteredAndSortedStudents = useMemo(() => {
        let result = [...students];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(s => {
                const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
                const email = s.email.toLowerCase();
                return fullName.includes(q) || email.includes(q);
            });
        }

        result.sort((a, b) => {
            if (sortBy === "name") {
                const nameA = `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
                const nameB = `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();
                return nameA.localeCompare(nameB);
            }
            if (sortBy === "exams") {
                const examsA = a.examResults?.length || 0;
                const examsB = b.examResults?.length || 0;
                return examsB - examsA;
            }
            // default: recent
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return result;
    }, [students, searchQuery, sortBy]);

    return (
        <div className="space-y-4">
            {/* SEARCH & CONTROLS TOOLBAR */}
            <div className="p-3 sm:p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search scholars by name or email..."
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

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Sorting pills */}
                    <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/50 text-xs">
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
                            Tests Taken
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortBy("name")}
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                sortBy === "name"
                                    ? "bg-background text-foreground shadow-2xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            A-Z
                        </button>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/50">
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            title="Table View"
                            className={cn(
                                "p-1.5 rounded-lg transition-all cursor-pointer",
                                viewMode === "table" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <TableIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            title="Grid Cards"
                            className={cn(
                                "p-1.5 rounded-lg transition-all cursor-pointer",
                                viewMode === "grid" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <span className="text-xs font-semibold text-muted-foreground shrink-0 hidden md:inline">
                        {filteredAndSortedStudents.length} of {students.length}
                    </span>
                </div>
            </div>

            {/* EMPTY STATE */}
            {filteredAndSortedStudents.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <GraduationCap className="w-6 h-6 opacity-40" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">
                            {students.length === 0 ? "No Scholars Enrolled Yet" : "No Matching Scholars Found"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                            {students.length === 0
                                ? "Onboard candidates to your workspace using direct invitations or public QR codes."
                                : "Try clearing your query or searching with a different candidate name or email."}
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
                            <AddUserModal roleType="STUDENT" />
                        </div>
                    )}
                </div>
            ) : viewMode === "table" ? (
                /* TABLE VIEW */
                <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="border-border/50 h-11 text-xs">
                                    <TableHead className="font-bold text-muted-foreground pl-5">Scholar</TableHead>
                                    <TableHead className="font-bold text-muted-foreground">Email Address</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-center">Assessments</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-center">Enrollment Date</TableHead>
                                    <TableHead className="font-bold text-muted-foreground text-right pr-5">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedStudents.map((student) => {
                                    const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email.split("@")[0];
                                    const attemptsCount = student.examResults?.length || 0;
                                    const avgScore = attemptsCount > 0 
                                        ? Math.round((student.examResults?.reduce((acc, r) => acc + r.score, 0) || 0) / attemptsCount) 
                                        : 0;

                                    return (
                                        <TableRow key={student.id} className="border-border/40 hover:bg-muted/20 transition-all text-xs">
                                            <TableCell className="pl-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-9 h-9 border border-primary/20 rounded-xl shrink-0">
                                                        <AvatarImage src={student.imageUrl || ""} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                                            {student.firstName?.[0] || student.email[0].toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm tracking-tight">{studentName}</p>
                                                        <Badge variant="outline" className="text-[9px] font-semibold tracking-wider uppercase border-border/60 text-muted-foreground mt-0.5">
                                                            Scholar
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3.5">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                    <span className="truncate max-w-[200px]" title={student.email}>
                                                        {student.email}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyEmail(student.email)}
                                                        className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                                        title="Copy email"
                                                    >
                                                        {copiedEmail === student.email ? (
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                                                        )}
                                                    </button>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3.5 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-foreground">
                                                        <ClipboardList className="w-3 h-3 mr-1 text-primary" />
                                                        {attemptsCount} {attemptsCount === 1 ? "Test" : "Tests"}
                                                    </Badge>
                                                    {attemptsCount > 0 && (
                                                        <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                                                            Avg {avgScore}%
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3.5 text-center text-muted-foreground font-medium tabular-nums">
                                                {format(new Date(student.createdAt), "dd MMM yyyy")}
                                            </TableCell>

                                            <TableCell className="pr-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <PromoteTeacherModal
                                                        studentId={student.id}
                                                        studentName={studentName}
                                                        studentEmail={student.email}
                                                        workspaceId={workspaceId}
                                                    />
                                                    <UniversalDeleteAction
                                                        type="STUDENT"
                                                        id={student.id}
                                                        name={studentName}
                                                        workspaceId={workspaceId}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                /* GRID CARDS VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedStudents.map((student) => {
                        const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.email.split("@")[0];
                        const attemptsCount = student.examResults?.length || 0;
                        const avgScore = attemptsCount > 0 
                            ? Math.round((student.examResults?.reduce((acc, r) => acc + r.score, 0) || 0) / attemptsCount) 
                            : 0;

                        return (
                            <div
                                key={student.id}
                                className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-2xs hover:shadow-md hover:border-primary/40 transition-all space-y-3.5 flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="w-11 h-11 border border-primary/20 rounded-xl shrink-0">
                                                <AvatarImage src={student.imageUrl || ""} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                                                    {student.firstName?.[0] || student.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm text-foreground tracking-tight truncate">{studentName}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground font-medium">
                                                    <span className="truncate max-w-[150px]" title={student.email}>
                                                        {student.email}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyEmail(student.email)}
                                                        className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                                    >
                                                        {copiedEmail === student.email ? (
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-border/60 text-muted-foreground">
                                            Scholar
                                        </Badge>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 text-center">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Tests Taken</span>
                                            <span className="text-base font-black text-foreground">{attemptsCount}</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50 text-center">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Avg Score</span>
                                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{attemptsCount > 0 ? `${avgScore}%` : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                                    <div className="text-[10px] text-muted-foreground font-medium">
                                        Joined {format(new Date(student.createdAt), "dd MMM yyyy")}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <PromoteTeacherModal
                                            studentId={student.id}
                                            studentName={studentName}
                                            studentEmail={student.email}
                                            workspaceId={workspaceId}
                                        />
                                        <UniversalDeleteAction
                                            type="STUDENT"
                                            id={student.id}
                                            name={studentName}
                                            workspaceId={workspaceId}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
