"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    clearSystemCache,
    manualDatabaseSync,
    exportSystemLogs,
    manualSystemMaintenance
} from "@/actions/developer";
import {
    Loader2,
    Download,
    RefreshCcw,
    Trash2,
    ShieldAlert,
    UserX,
    Lock,
    Hammer
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DeveloperClient() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
        setLoading(actionName);
        try {
            const res = await actionFn();
            if (res.success) {
                toast.success(res.message);
            } else {
                toast.error("Action failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4 pt-4">
                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("export", exportSystemLogs)}
                    className="w-full bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white font-black uppercase tracking-widest text-[10px] h-12 transition-all group"
                >
                    {loading === "export" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                    Export System Logs
                </Button>

                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("maintenance", manualSystemMaintenance)}
                    className="w-full bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[10px] h-12 transition-all group"
                >
                    {loading === "maintenance" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Hammer className="w-4 h-4 mr-2 group-hover:-rotate-45 transition-transform" />}
                    Run System Maintenance
                </Button>

                <Button
                    variant="outline"
                    disabled={loading !== null}
                    onClick={() => handleAction("sync", manualDatabaseSync)}
                    className="w-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 hover:text-primary font-black uppercase tracking-widest text-[10px] h-12 transition-all group"
                >
                    {loading === "sync" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />}
                    Manual DB Sync
                </Button>

                <Button
                    variant="destructive"
                    disabled={loading !== null}
                    onClick={() => handleAction("clear", clearSystemCache)}
                    className="w-full font-black uppercase tracking-widest text-[10px] h-12 transition-all group"
                >
                    {loading === "clear" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2 group-hover:shake transition-transform" />}
                    Clear System Cache
                </Button>
            </div>

            <div className="pt-6 border-t border-zinc-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Restriction Management</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="h-20 flex flex-col items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all">
                        <UserX className="w-5 h-5 text-rose-500" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Ban User</span>
                    </Button>
                    <Button variant="ghost" className="h-20 flex flex-col items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">IP Block</span>
                    </Button>
                    <Button variant="ghost" className="h-20 flex flex-col items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all">
                        <Lock className="w-5 h-5 text-blue-500" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Whitelabel</span>
                    </Button>
                    <Button variant="ghost" className="h-20 flex flex-col items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all">
                        <ShieldAlert className="w-5 h-5 text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Debug Mode</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

