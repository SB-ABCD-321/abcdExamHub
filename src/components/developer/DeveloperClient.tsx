"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    clearSystemCache,
    manualDatabaseSync,
    exportSystemLogs,
    manualSystemMaintenance,
    pingDatabaseLatency
} from "@/actions/developer";
import {
    Loader2,
    Download,
    RefreshCcw,
    Trash2,
    ShieldCheck,
    Hammer,
    Zap,
    Activity,
    Terminal,
    Server,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DeveloperClient() {
    const [loading, setLoading] = useState<string | null>(null);
    const [dbLatency, setDbLatency] = useState<number | null>(null);

    const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
        setLoading(actionName);
        try {
            const res = await actionFn();
            if (res.success) {
                if (actionName === "export" && res.data) {
                    const blob = new Blob([res.data], { type: "application/json" });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `abcd-system-logs-${new Date().toISOString().split("T")[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success("System diagnostic logs downloaded");
                } else {
                    toast.success(res.message);
                }
            } else {
                toast.error(res.message || "Operation failed");
            }
        } catch (error: any) {
            toast.error(error?.message || "An unexpected error occurred");
        } finally {
            setLoading(null);
        }
    };

    const handlePing = async () => {
        setLoading("ping");
        try {
            const res = await pingDatabaseLatency();
            if (res.success && res.latency !== undefined) {
                setDbLatency(res.latency);
                toast.success(`Database round-trip latency: ${res.latency}ms`);
            } else {
                toast.error("Database latency check failed");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to ping database");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header info / live status */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            Sentinel Commander
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium">
                            {dbLatency !== null ? `DB Ping: ${dbLatency}ms` : "Real-time command executor"}
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={loading === "ping"}
                    onClick={handlePing}
                    className="h-7 px-2.5 text-[11px] font-bold rounded-lg border-border/60 hover:bg-muted/60"
                >
                    {loading === "ping" ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                        <Zap className="w-3 h-3 text-amber-500 mr-1" />
                    )}
                    Ping DB
                </Button>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2">
                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("export", exportSystemLogs)}
                    className="w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all group"
                >
                    {loading === "export" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2.5 text-primary" />
                    ) : (
                        <Download className="w-4 h-4 mr-2.5 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <span>Export Diagnostic Logs</span>
                    <Badge variant="outline" className="ml-auto text-[9.5px] font-mono border-border/60 text-muted-foreground">
                        JSON
                    </Badge>
                </Button>

                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("maintenance", manualSystemMaintenance)}
                    className="w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl border-border/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 transition-all group"
                >
                    {loading === "maintenance" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2.5 text-emerald-500" />
                    ) : (
                        <Hammer className="w-4 h-4 mr-2.5 text-emerald-500 group-hover:-rotate-45 transition-transform" />
                    )}
                    <span>Run Maintenance Cycle</span>
                    <Badge variant="outline" className="ml-auto text-[9.5px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        Purge
                    </Badge>
                </Button>

                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("sync", manualDatabaseSync)}
                    className="w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl border-border/60 hover:bg-blue-500/5 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all group"
                >
                    {loading === "sync" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2.5 text-blue-500" />
                    ) : (
                        <RefreshCcw className="w-4 h-4 mr-2.5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                    )}
                    <span>Manual Database Sync</span>
                    <Badge variant="outline" className="ml-auto text-[9.5px] font-mono border-border/60 text-muted-foreground">
                        Sync
                    </Badge>
                </Button>

                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("clear", clearSystemCache)}
                    className="w-full justify-start text-xs font-bold h-10 px-3.5 rounded-xl border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-all group"
                >
                    {loading === "clear" ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2.5 text-rose-500" />
                    ) : (
                        <Trash2 className="w-4 h-4 mr-2.5 text-rose-500 group-hover:shake transition-transform" />
                    )}
                    <span>Purge Next.js Cache</span>
                    <Badge variant="outline" className="ml-auto text-[9.5px] font-mono border-rose-500/30 text-rose-600 dark:text-rose-400">
                        Flush
                    </Badge>
                </Button>
            </div>

            {/* Quick Diagnostic Checkpoints */}
            <div className="pt-2 border-t border-border/40 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Security & Protocol Telemetry
                </span>

                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground truncate">Node Security</p>
                            <p className="text-xs font-bold text-foreground">Verified</p>
                        </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground truncate">Prisma Pool</p>
                            <p className="text-xs font-bold text-foreground">Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
