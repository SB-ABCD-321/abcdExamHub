import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/shared/Pagination";
import { format } from "date-fns";
import { WorkspaceControlPanel } from "@/components/workspace/WorkspaceControlPanel";
import { WorkspaceSearch } from "@/components/workspace/WorkspaceSearch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, GraduationCap, ClipboardList, FileQuestion, CheckCircle2, PauseCircle, XCircle, CalendarDays, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
    ACTIVE: { label: "Active", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-500", Icon: CheckCircle2 },
    PAUSED: { label: "Paused", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800/50", dot: "bg-amber-500", Icon: PauseCircle },
    SUSPENDED: { label: "Suspended", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800/50", dot: "bg-rose-500", Icon: XCircle },
};

function UsageBar({ used, max, color }: { used: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
    const isNear = pct >= 80;
    return (
        <div className="h-1.5 w-16 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
            <div
                className={cn("h-full rounded-full transition-all", isNear ? "bg-rose-500" : color)}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default async function SuperAdminWorkspacesPage(props: { searchParams: Promise<{ page?: string; search?: string; id?: string }> }) {
    const searchParams = await props.searchParams;
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") redirect("/dashboard");

    const page = Number(searchParams.page) || 1;
    const search = searchParams.search?.trim() || "";
    const directId = searchParams.id?.trim() || "";
    const pageSize = 15;
    const skip = (page - 1) * pageSize;

    // Filter Logic
    const whereFilter: any = {};
    if (directId) {
        whereFilter.id = directId;
    } else if (search) {
        whereFilter.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { admin: { email: { contains: search, mode: "insensitive" } } },
            { admin: { firstName: { contains: search, mode: "insensitive" } } },
            { admin: { lastName: { contains: search, mode: "insensitive" } } },
        ];
    }

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

    const activeCount = await db.workspace.count({ where: { status: "ACTIVE" } });
    const pausedCount = await db.workspace.count({ where: { status: "PAUSED" } });
    const suspendedCount = await db.workspace.count({ where: { status: "SUSPENDED" } });

    return (
        <div className="space-y-10 pb-12 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 relative z-10 pb-2 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
                        Node <span className="text-primary font-black">Directory</span>
                    </h1>
                    <p className="text-muted-foreground font-bold text-sm md:text-lg max-w-xl italic flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" /> Administrative oversight of all institutional shards.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <WorkspaceSearch defaultValue={search} />
                    <div className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-700">
                        <div className="flex items-center gap-3 pr-4 border-r border-slate-100 dark:border-zinc-700">
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                                {activeCount} Online
                            </Badge>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Total Units: {totalCount}</span>
                    </div>
                </div>
            </div>

            {/* List Ledger Section */}
            <Card className="border-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50 dark:border-zinc-800 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight uppercase">Registry Ledger</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Workspace Sharding and Capacity Status</CardDescription>
                    </div>
                    {directId && (
                         <Button asChild variant="outline" className="h-9 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200">
                            <Link href="/super-admin/workspaces">View All Shards</Link>
                         </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-zinc-950/20">
                                <TableRow className="border-none h-16">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest pl-12">Institutional Node</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Resource Load (T/S/E)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">AI Tier</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-12">Control Panel</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allWorkspaces.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="p-20 text-center">
                                             <Building2 className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                                             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                                {search || directId ? "Node Not Found in Primary Shard" : "Zero Managed Shards Detected"}
                                             </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    allWorkspaces.map((ws) => {
                                        const statusKey = ws.status as keyof typeof STATUS_CONFIG;
                                        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.ACTIVE;
                                        const StatusIcon = cfg.Icon;
                                        const maxQ = (ws as any).maxQuestions ?? 500;

                                        return (
                                            <TableRow key={ws.id} className={cn(
                                                "border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/20 dark:hover:bg-zinc-800/10 transition-all group",
                                                directId === ws.id && "bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-inset ring-indigo-500/20"
                                            )}>
                                                <TableCell className="pl-12 py-7">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base group-hover:text-primary transition-colors flex items-center gap-2">
                                                            {ws.name}
                                                            {directId === ws.id && <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                                        </span>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ws.admin.email}</p>
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-300 font-black uppercase tracking-widest italic">
                                                                <CalendarDays className="w-2.5 h-2.5" />
                                                                {format(new Date(ws.createdAt), "dd/MM/yyyy")}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn("text-[9px] font-black uppercase border-none px-3 py-1 rounded-lg shadow-sm gap-1.5", cfg.bg, cfg.text)}>
                                                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-6">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                                                                <span>T: {ws._count.teachers}/{ws.maxTeachers}</span>
                                                            </div>
                                                            <UsageBar used={ws._count.teachers} max={ws.maxTeachers} color="bg-indigo-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                                                                <span>S: {ws._count.students}/{ws.maxStudents}</span>
                                                            </div>
                                                            <UsageBar used={ws._count.students} max={ws.maxStudents} color="bg-emerald-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-tighter">
                                                                <span>E: {ws._count.exams}/{ws.maxExams}</span>
                                                            </div>
                                                            <UsageBar used={ws._count.exams} max={ws.maxExams} color="bg-amber-500" />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {ws.aiUnlimited ? (
                                                        <Badge className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 border-none rounded-lg shadow-inner">
                                                            <Zap className="w-3 h-3 mr-1.5 fill-current" /> UNLIMITED
                                                        </Badge>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 tabular-nums">
                                                                {ws.aiGenerationsCount}<span className="text-slate-300">/{(ws as any).aiLimit || 10}</span>
                                                            </span>
                                                            <div className="w-12 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                                                <div className="h-full bg-indigo-400" style={{ width: `${Math.min((ws.aiGenerationsCount / ((ws as any).aiLimit || 10)) * 100, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-12 text-right">
                                                    <WorkspaceControlPanel
                                                        workspaceId={ws.id}
                                                        workspaceName={ws.name}
                                                        currentStatus={statusKey as "ACTIVE" | "PAUSED" | "SUSPENDED"}
                                                        aiLimit={ws.aiLimit}
                                                        aiUsage={ws.aiGenerationsCount}
                                                        isUnlimited={ws.aiUnlimited}
                                                        maxTeachers={ws.maxTeachers}
                                                        maxStudents={ws.maxStudents}
                                                        maxExams={ws.maxExams}
                                                        maxQuestions={maxQ}
                                                        maxConcurrentExams={(ws as any).maxConcurrentExams ?? 100}
                                                        trialExpiresAt={(ws as any).trialExpiresAt ? new Date((ws as any).trialExpiresAt).toISOString() : undefined}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center mt-8">
                 <Pagination totalItems={totalCount} itemsPerPage={pageSize} currentPage={page} />
            </div>
        </div>
    );
}
