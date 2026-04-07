import { getWorkspaceRequests, getUserRequestHistory } from "@/actions/workspace-request";
import { RequestStatus } from "@prisma/client";
import { RequestCard } from "./request-card";
import { Badge } from "@/components/ui/badge";
import { Inbox, ShieldCheck, Mail, Phone, ExternalLink, History, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default async function SuperAdminRequestsPage() {
    const pendingRequests = await getWorkspaceRequests('PENDING');
    const approvedRequests = await getWorkspaceRequests('APPROVED');
    const rejectedRequests = await getWorkspaceRequests('REJECTED');

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            {/* High-Fidelity Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 relative z-10 pb-2 border-b border-slate-100 dark:border-zinc-800/50">
                <div className="space-y-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        Governance & <span className="text-primary font-black">Audit Hub</span>
                    </h1>
                    <p className="text-muted-foreground font-bold text-sm md:text-lg max-w-xl italic">
                        A centralized ledger for institutional requisitions and administrative audit logs.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                     <div className="hidden sm:flex flex-col items-end text-right pr-6 border-r-2 border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Audit Pool</span>
                        <span className="text-2xl font-black tabular-nums tracking-tighter">{(pendingRequests.length + approvedRequests.length + rejectedRequests.length).toLocaleString()}</span>
                    </div>
                    <Badge variant="outline" className="h-12 md:h-16 px-4 md:px-8 rounded-2xl md:rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-4 md:gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest mb-0.5 md:mb-1">Waitlist</span>
                            <span className="text-lg md:text-xl font-black tabular-nums">{pendingRequests.length}</span>
                        </div>
                        <div className="w-px h-6 md:h-8 bg-slate-100 dark:bg-zinc-800" />
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest mb-0.5 md:mb-1">Active</span>
                            <span className="text-lg md:text-xl font-black tabular-nums">{approvedRequests.length}</span>
                        </div>
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                 <TabsList className="grid grid-cols-3 h-auto min-h-[56px] md:h-16 bg-slate-100/50 dark:bg-zinc-950/20 p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] mb-8 md:mb-12 border border-slate-200/40 dark:border-zinc-800/40 shadow-inner w-full lg:w-max">
                    <TabsTrigger value="pending" className="rounded-xl md:rounded-2xl px-2 md:px-10 font-black uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-2xl data-[state=active]:text-primary transition-all h-full gap-2 md:gap-3 group">
                        <Inbox className="w-3.5 h-3.5 md:w-4 md:h-4 group-data-[state=active]:animate-bounce" /> 
                        <span className="hidden sm:inline">Waitlist</span>
                        <span className="sm:hidden">Waiting</span>
                        {pendingRequests.length > 0 && <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-md text-[8px]">{pendingRequests.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="rounded-xl md:rounded-2xl px-2 md:px-10 font-black uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-2xl data-[state=active]:text-emerald-500 transition-all h-full gap-2 md:gap-3 group">
                        <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> 
                        Authorized
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="rounded-xl md:rounded-2xl px-2 md:px-10 font-black uppercase tracking-widest text-[9px] md:text-[10px] data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-2xl data-[state=active]:text-rose-500 transition-all h-full gap-2 md:gap-3 group">
                        <History className="w-3.5 h-3.5 md:w-4 md:h-4" /> 
                        Rejected
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-8 outline-none mt-8 md:mt-12">
                    {pendingRequests.length === 0 ? (
                        <div className="h-[450px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-zinc-950/20 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-zinc-800">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white dark:bg-zinc-900 flex items-center justify-center mb-8 shadow-xl">
                                <Inbox className="w-10 h-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black italic tracking-widest uppercase text-[10px]">Transmission Buffer Empty: No incoming requisitions.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 md:gap-6">
                            {await Promise.all(pendingRequests.map(async (request) => {
                                const history = request.userId ? await getUserRequestHistory(request.userId) : [];
                                const pastRequests = history.filter(h => h.id !== request.id);
                                return (
                                    <RequestCard 
                                        key={request.id} 
                                        request={JSON.parse(JSON.stringify(request))} 
                                        history={JSON.parse(JSON.stringify(pastRequests))}
                                    />
                                );
                            }))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="approved" className="outline-none mt-8 md:mt-12">
                    <div className="flex flex-col gap-4 md:gap-6">
                         {approvedRequests.map(request => (
                             <div key={request.id} className="opacity-80 hover:opacity-100 transition-all">
                                 <RequestCard request={JSON.parse(JSON.stringify(request))} readonly />
                             </div>
                         ))}
                    </div>
                </TabsContent>

                <TabsContent value="rejected" className="outline-none mt-8 md:mt-12">
                    <div className="flex flex-col gap-4 md:gap-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                         {rejectedRequests.map(request => (
                             <RequestCard key={request.id} request={JSON.parse(JSON.stringify(request))} readonly />
                         ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Notice Footer */}
            <div className="mt-20 p-8 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck size={120} />
                </div>
                <div className="space-y-1 relative z-10 text-center md:text-left">
                    <h4 className="text-lg font-black uppercase tracking-tight">Institutional Integrity Protocol</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Workspace verification ensures platform stability and legal compliance</p>
                </div>
                <Badge className="h-10 px-6 rounded-xl bg-white text-slate-950 font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                    Real-time Audit Active
                </Badge>
            </div>
        </div>
    );
}
