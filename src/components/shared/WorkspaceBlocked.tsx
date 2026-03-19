import { Building2, ShieldX, PauseCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WorkspaceBlockedProps {
    mode: "SUSPENDED" | "PAUSED";
    workspaceName?: string;
}

const CONFIG = {
    SUSPENDED: {
        Icon: ShieldX,
        color: "rose",
        title: "Workspace Suspended",
        subtitle: "This workspace has been suspended by the platform administrator.",
        detail: "All access to this workspace — including exams, questions, and student data — has been locked. Please contact the platform administrator to resolve this.",
        badge: "SUSPENDED",
        badgeClass: "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50",
        iconBg: "bg-rose-100 dark:bg-rose-950/30",
        iconColor: "text-rose-500",
        glow: "from-rose-500/10",
    },
    PAUSED: {
        Icon: PauseCircle,
        color: "amber",
        title: "Workspace Paused",
        subtitle: "This workspace has been temporarily paused by the platform administrator.",
        detail: "Creating new exams, questions, and topics is currently disabled. Existing content and student results remain accessible in read-only mode.",
        badge: "PAUSED",
        badgeClass: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
        iconBg: "bg-amber-100 dark:bg-amber-950/30",
        iconColor: "text-amber-500",
        glow: "from-amber-500/10",
    },
};

export function WorkspaceBlocked({ mode, workspaceName }: WorkspaceBlockedProps) {
    const cfg = CONFIG[mode];
    const Icon = cfg.Icon;

    return (
        <div className="min-h-[80dvh] flex items-center justify-center p-6">
            <div className="max-w-lg w-full text-center space-y-6">
                {/* Glow bg */}
                <div className={`absolute inset-0 bg-gradient-to-b ${cfg.glow} to-transparent pointer-events-none`} />

                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-3xl ${cfg.iconBg} flex items-center justify-center shadow-lg`}>
                    <Icon className={`w-10 h-10 ${cfg.iconColor}`} />
                </div>

                {/* Badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.badgeClass}`}>
                    <Building2 className="w-3 h-3" />
                    {workspaceName && `${workspaceName} · `}{cfg.badge}
                </span>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {cfg.title}
                    </h1>
                    <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
                        {cfg.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {cfg.detail}
                    </p>
                </div>

                {/* Action */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <p className="text-[11px] text-muted-foreground">
                    Contact your platform administrator for assistance.
                </p>
            </div>
        </div>
    );
}
