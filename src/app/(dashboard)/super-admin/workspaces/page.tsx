import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";
import { WorkspaceControlPanel } from "@/components/workspace/WorkspaceControlPanel";
import { WorkspaceSearch } from "@/components/workspace/WorkspaceSearch";
import { Building2, Users, GraduationCap, ClipboardList, FileQuestion, CheckCircle2, PauseCircle, XCircle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
    ACTIVE: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-500", Icon: CheckCircle2 },
    PAUSED: { label: "Paused", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800/50", dot: "bg-amber-500", Icon: PauseCircle },
    SUSPENDED: { label: "Suspended", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800/50", dot: "bg-rose-500", Icon: XCircle },
};

function UsageBar({ used, max, color }: { used: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
    const isNear = pct >= 80;
    return (
        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
                className={cn("h-full rounded-full transition-all", isNear ? "bg-rose-500" : color)}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default async function SuperAdminWorkspacesPage(props: { searchParams: Promise<{ page?: string; search?: string }> }) {
    const searchParams = await props.searchParams;
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") redirect("/dashboard");

    const page = Number(searchParams.page) || 1;
    const search = searchParams.search?.trim() || "";
    const pageSize = 12;
    const skip = (page - 1) * pageSize;

    const whereFilter = search ? {
        OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { admin: { email: { contains: search, mode: "insensitive" as const } } },
            { admin: { firstName: { contains: search, mode: "insensitive" as const } } },
        ]
    } : {};

    const [allWorkspaces, totalCount] = await Promise.all([
        db.workspace.findMany({
            where: whereFilter,
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
            include: {
                admin: { select: { firstName: true, lastName: true, email: true } },
                _count: {
                    select: { teachers: true, students: true, exams: true, questions: true }
                }
            }
        }),
        db.workspace.count({ where: whereFilter })
    ]);

    const activeCount = await db.workspace.count({ where: { ...(whereFilter as any), status: "ACTIVE" } });
    const pausedCount = await db.workspace.count({ where: { ...(whereFilter as any), status: "PAUSED" } });
    const suspendedCount = await db.workspace.count({ where: { ...(whereFilter as any), status: "SUSPENDED" } });

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Platform <span className="text-primary">Workspaces</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl mt-1">
                        Full SaaS control over every institution on the platform.
                    </p>
                </div>
                {/* Summary badges */}
                <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                    <WorkspaceSearch defaultValue={search} />
                    <div className="flex flex-wrap gap-2">
                    <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border-0 text-xs font-bold px-3 py-1.5 gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {totalCount} Total
                    </Badge>
                    <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-0 text-xs font-bold px-3 py-1.5 gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {activeCount} Active
                    </Badge>
                    <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-0 text-xs font-bold px-3 py-1.5 gap-1.5">
                        <PauseCircle className="w-3.5 h-3.5" /> {pausedCount} Paused
                    </Badge>
                    {suspendedCount > 0 && (
                        <Badge className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-0 text-xs font-bold px-3 py-1.5 gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> {suspendedCount} Suspended
                        </Badge>
                    )}
                    </div>
                </div>
            </div>

            {/* Workspace Cards */}
            {allWorkspaces.length === 0 ? (
                <div className="p-20 text-center rounded-[2.5rem] border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-zinc-700" />
                    <p className="text-lg font-black uppercase text-slate-400">
                        {search ? `No workspaces match "${search}"` : "No workspaces yet"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {allWorkspaces.map((ws) => {
                        const statusKey = (ws as any).status as "ACTIVE" | "PAUSED" | "SUSPENDED" ?? "ACTIVE";
                        const cfg = STATUS_CONFIG[statusKey];
                        const StatusIcon = cfg.Icon;
                        const maxQ = (ws as any).maxQuestions ?? 500;

                        return (
                            <div
                                key={ws.id}
                                className={cn(
                                    "relative rounded-[1.75rem] border bg-white dark:bg-zinc-900 overflow-hidden",
                                    "shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
                                    "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]",
                                    "transition-all duration-300",
                                    statusKey === "SUSPENDED" && "opacity-70"
                                )}
                            >
                                {/* Status stripe */}
                                <div className={cn("h-1.5 w-full", cfg.dot)} />

                                <div className="p-5 space-y-4">
                                    {/* Top row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-base leading-tight truncate text-slate-900 dark:text-white">
                                                {ws.name}
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                {ws.admin.firstName} {ws.admin.lastName} · {ws.admin.email}
                                            </p>
                                        </div>
                                        <Badge className={cn("shrink-0 text-[10px] font-black uppercase tracking-widest border px-2 py-1 gap-1", cfg.bg, cfg.text, cfg.border)}>
                                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                                        </Badge>
                                    </div>

                                    {/* Usage stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Teachers", used: ws._count.teachers, max: ws.maxTeachers, color: "bg-indigo-500", Icon: Users },
                                            { label: "Students", used: ws._count.students, max: ws.maxStudents, color: "bg-emerald-500", Icon: GraduationCap },
                                            { label: "Exams", used: ws._count.exams, max: ws.maxExams, color: "bg-amber-500", Icon: ClipboardList },
                                            { label: "Questions", used: ws._count.questions, max: maxQ, color: "bg-violet-500", Icon: FileQuestion },
                                        ].map(({ label, used, max, color, Icon }) => (
                                            <div key={label} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                        <Icon className="w-3 h-3" /> {label}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                        {used}<span className="text-slate-300 dark:text-zinc-600">/{max}</span>
                                                    </span>
                                                </div>
                                                <UsageBar used={used} max={max} color={color} />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom row */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(ws.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </div>
                                        <WorkspaceControlPanel
                                            workspaceId={ws.id}
                                            workspaceName={ws.name}
                                            currentStatus={statusKey}
                                            aiLimit={ws.aiLimit}
                                            aiUsage={ws.aiGenerationsCount}
                                            isUnlimited={ws.aiUnlimited}
                                            maxTeachers={ws.maxTeachers}
                                            maxStudents={ws.maxStudents}
                                            maxExams={ws.maxExams}
                                            maxQuestions={maxQ}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Pagination totalItems={totalCount} itemsPerPage={pageSize} currentPage={page} />
        </div>
    );
}
