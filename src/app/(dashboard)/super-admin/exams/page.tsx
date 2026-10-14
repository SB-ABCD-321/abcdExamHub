import { db } from "@/lib/prisma";
import GlobalExamTable from "@/components/super-admin/GlobalExamTable";
import { Badge } from "@/components/ui/badge";
import { 
    ClipboardList, 
    CheckCircle2, 
    Clock, 
    HelpCircle, 
    FileCheck, 
    ShieldCheck, 
    Layers, 
    Activity
} from "lucide-react";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { cn } from "@/lib/utils";

export default async function GlobalExamsPage() {
    const exams = await db.exam.findMany({
        include: {
            workspace: true,
            author: true,
            _count: { select: { questions: true, results: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Metric aggregations
    const totalExams = exams.length;
    const activeCount = exams.filter((e) => e.status === "ACTIVE").length;
    const pausedCount = exams.filter((e) => e.status === "PAUSED").length;
    const inactiveCount = exams.filter((e) => e.status === "INACTIVE").length;

    const totalQuestions = exams.reduce((acc, e) => acc + (e._count?.questions || 0), 0);
    const totalSubmissions = exams.reduce((acc, e) => acc + (e._count?.results || 0), 0);

    const activeRate = totalExams > 0 ? Math.round((activeCount / totalExams) * 100) : 100;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Global <span className="text-primary font-black">Assessment Registry</span></>}
                subtitle="Full cross-workspace examination oversight, question bank telemetry, and assessment governance."
            />

            {/* HIGH-DENSITY ANALYTICAL KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Active Live Sessions"
                    value={activeCount}
                    subtitle={`${activeRate}% operational availability`}
                    icon={<Activity className={cn("size-4", activeCount > 0 ? "text-emerald-500" : "text-muted-foreground")} />}
                    badge={
                        activeCount > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {activeCount} Online
                            </span>
                        ) : undefined
                    }
                />

                <DashboardMetricCard
                    title="Total Assessments"
                    value={totalExams}
                    subtitle={`${pausedCount} paused • ${inactiveCount} inactive`}
                    icon={<ClipboardList className="size-4 text-primary" />}
                />

                <DashboardMetricCard
                    title="Question Pool Bank"
                    value={totalQuestions}
                    subtitle={totalExams > 0 ? `Avg ${Math.round(totalQuestions / totalExams)} Qs per assessment` : "No questions mapped"}
                    icon={<HelpCircle className="size-4 text-blue-500" />}
                />

                <DashboardMetricCard
                    title="Candidate Results"
                    value={totalSubmissions}
                    subtitle="Cross-workspace logged attempts"
                    icon={<FileCheck className="size-4 text-indigo-500" />}
                    badge={
                        totalSubmissions > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                Logged
                            </span>
                        ) : undefined
                    }
                />
            </div>

            {/* ADVANCED GLOBAL EXAMS MANIFEST (SEARCH + TABS + WORKSPACE FILTER + SORT + CSV EXPORT + PAGINATION) */}
            <GlobalExamTable exams={exams} />

            {/* INTEGRITY & WORKSPACE SECURITY AUDIT PROTOCOL FOOTER */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-5" />
                    </div>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">Examination Governance & Anti-Tamper Protocol</h4>
                        <p className="text-[11px] text-muted-foreground">
                            Global assessment changes, question pools, and candidate answer keys are cryptographically logged with tenant isolation.
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold shrink-0">
                    Tenant Isolated
                </Badge>
            </div>
        </DashboardPage>
    );
}
