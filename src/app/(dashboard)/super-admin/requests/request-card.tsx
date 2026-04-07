"use client";

import { useTransition, useState } from "react";
import { approveWorkspaceRequest, rejectWorkspaceRequest, deleteWorkspaceRequest } from "@/actions/workspace-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
    Building2, 
    Users, 
    GraduationCap, 
    Zap, 
    Mail, 
    Phone, 
    Globe, 
    Clock, 
    Calendar, 
    ChevronDown, 
    ChevronUp, 
    Trash2, 
    ShieldCheck, 
    AlertCircle, 
    UserCheck, 
    UserX,
    Fingerprint,
    Timer,
    Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface RequestCardProps {
    request: any;
    readonly?: boolean;
    history?: any[];
}

export function RequestCard({ request, readonly = false, history = [] }: RequestCardProps) {
    const [isPending, startTransition] = useTransition();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    
    const createdAt = new Date(request.createdAt);
    const hoursElapsed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
    const isUrgent = hoursElapsed >= 24;
    const isPendingStatus = request.status === 'PENDING';

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approveWorkspaceRequest(request.id);
            if (res.success) toast.success("Workspace activated successfully");
            else toast.error(res.error || "Failed to activate");
        });
    };

    const handleReject = () => {
        if (!rejectionReason) {
            toast.error("Please provide a reason for rejection");
            return;
        }
        startTransition(async () => {
            const res = await rejectWorkspaceRequest(request.id, rejectionReason);
            if (res.success) {
                toast.success("Request denied and applicant notified");
                setShowRejectionForm(false);
            } else toast.error(res.error || "Failed to deny");
        });
    };

    const handleDelete = () => {
        if (!confirm("Are you sure you want to permanently delete this request log?")) return;
        startTransition(async () => {
            const res = await deleteWorkspaceRequest(request.id);
            if (res.success) toast.success("Request deleted permanently");
            else toast.error(res.error || "Failed to delete");
        });
    };

    return (
        <Card className={cn(
            "group relative overflow-hidden border border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.005] transition-all duration-500",
            !readonly && isUrgent && isPendingStatus && "ring-1 ring-rose-500/20 shadow-rose-500/5",
            isExpanded && "shadow-2xl ring-1 ring-primary/20 bg-white dark:bg-zinc-900"
        )}>
            {/* Status Status Bar (Top Line for Row effect) */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                request.status === 'PENDING' ? (isUrgent ? "bg-rose-500" : "bg-amber-500") :
                request.status === 'APPROVED' ? "bg-emerald-500" :
                "bg-rose-500"
            )} />

            {/* Delete Option (Desktop Hover) */}
            <Button 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                size="icon" 
                variant="ghost" 
                className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                disabled={isPending}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </Button>

            <CardContent className="p-0">
                {/* HORIZONTAL LEDGER ROW */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex flex-col md:flex-row md:items-center p-4 md:p-6 cursor-pointer gap-4 md:gap-8 min-h-[80px]"
                >
                    {/* COL 1: IDENTITY */}
                    <div className="flex items-center gap-4 flex-[1.5] min-w-0">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                            request.status === 'PENDING' ? "bg-amber-100/50 text-amber-600" :
                            request.status === 'APPROVED' ? "bg-emerald-100/50 text-emerald-600" :
                            "bg-rose-100/50 text-rose-600"
                        )}>
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none mb-1.5 truncate">
                                {request.workspaceName}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{request.id.slice(-8).toUpperCase()}</span>
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest py-0 border-primary/20 text-primary">{request.planId}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: ADMIN (Desktop Only) */}
                    <div className="hidden lg:flex flex-col flex-1 min-w-0">
                         <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Administrative Lead</span>
                         <p className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate">{request.adminName}</p>
                         <p className="text-[10px] font-medium text-slate-400 truncate tracking-tight">{request.adminEmail}</p>
                    </div>

                    {/* COL 3: STATS (Compact) */}
                    <div className="hidden sm:flex items-center gap-6 flex-1 justify-center border-l border-slate-100 dark:border-zinc-800 pr-8">
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Faculty</p>
                            <p className="text-xs font-black">{request.maxTeachers || 'Std'}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Students</p>
                            <p className="text-xs font-black">{request.maxStudents || 'Std'}</p>
                         </div>
                    </div>

                    {/* COL 4: AUDIT/TIME */}
                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-[220px] shrink-0">
                        <div className="flex flex-col items-end text-right">
                             <div className="flex items-center gap-1.5 mb-1">
                                <Timer className={cn("w-3 h-3", isUrgent && isPendingStatus ? "text-rose-500 animate-pulse" : "text-slate-300")} />
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tight",
                                    isUrgent && isPendingStatus ? "text-rose-600" : "text-slate-400"
                                )}>
                                    {isPendingStatus ? formatDistanceToNow(createdAt) : format(createdAt, "dd MMM")}
                                </span>
                             </div>
                             <span className={cn(
                                "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                request.status === 'PENDING' ? (isUrgent ? "bg-rose-500 text-white" : "bg-amber-100 text-amber-700") :
                                request.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" :
                                "bg-rose-100 text-rose-700"
                            )}>
                                {request.status}
                             </span>
                        </div>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isExpanded ? "bg-primary text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                        )}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                </div>

                {/* EXPANDED CONTENT (LEDGER STYLE) */}
                {isExpanded && (
                    <div className="px-6 md:px-10 pb-10 space-y-10 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-100 dark:border-zinc-800">
                             {/* Institutional Verification Stamp */}
                             <div className="space-y-6">
                                <div className="space-y-4">
                                    {(request.status === 'APPROVED' || request.status === 'REJECTED') && (
                                        <div className={cn(
                                            "relative p-6 rounded-[1.5rem] border-2 flex flex-col items-center text-center gap-2 overflow-hidden",
                                            request.status === 'APPROVED' ? "bg-emerald-50/20 border-emerald-100/30" : "bg-rose-50/20 border-rose-100/30"
                                        )}>
                                            <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                                                {request.status === 'APPROVED' ? <ShieldCheck size={100} /> : <AlertCircle size={100} />}
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Audit Verification Stamp</p>
                                            <h4 className="text-sm font-black uppercase text-slate-950 dark:text-white">
                                                Node: {request.status === 'APPROVED' ? "Activated" : "Requisition Failed"}
                                            </h4>
                                            <div className="flex flex-col gap-0.5">
                                                 <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    Processed: {request.processedBy ? `${request.processedBy.firstName} ${request.processedBy.lastName}` : 'System Node'}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400 italic">
                                                    Locked on {request.processedAt ? format(new Date(request.processedAt), "dd MMM yyyy HH:mm") : 'Legacy Trace'}
                                                </p>
                                            </div>

                                            {request.status === 'REJECTED' && (
                                                <div className="mt-4 p-4 w-full rounded-2xl bg-white dark:bg-zinc-950 border border-rose-100 dark:border-rose-900/40 text-left">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-2">Refusal Reason</p>
                                                    <p className="text-xs font-bold text-slate-700 italic">"{request.rejectionReason}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {request.status === 'PENDING' && (
                                        <div className="p-6 rounded-[1.5rem] bg-slate-50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800 border-dashed text-center">
                                            <Fingerprint className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Awaiting Senior Audit</p>
                                            <p className="text-xs font-bold text-slate-500 italic max-w-[200px] mx-auto">Manual institutional verification required for activation.</p>
                                        </div>
                                    )}
                                </div>
                             </div>

                             {/* Location & Contact Grid */}
                             <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Globe className="w-3 h-3" /> Node Region
                                        </p>
                                        <p className="font-bold text-xs text-slate-700 uppercase truncate">
                                            {request.address || "Global Cluster"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Recieved
                                        </p>
                                        <p className="font-bold text-xs text-slate-700">
                                            {format(createdAt, "dd/MM/yy HH:mm")}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication Channels</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <a href={`mailto:${request.adminEmail}`} className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-100 flex items-center gap-3 group/mail hover:border-primary transition-all">
                                            <Mail className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-[11px] font-bold truncate">Email Admin</span>
                                        </a>
                                        <a href={`tel:${request.adminPhone}`} className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-950 border border-slate-100 flex items-center gap-3 group/phone hover:border-slate-800 transition-all text-slate-500">
                                            <Phone className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">Call Request</span>
                                        </a>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* Resource Allocation Profile */}
                        <div className="p-6 md:p-8 rounded-[2rem] bg-slate-950 text-white relative overflow-hidden group/stats">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Cpu size={80} />
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                {[
                                    { label: "Faculty Cap", value: request.maxTeachers || 'Std', icon: Users, color: "text-blue-400" },
                                    { label: "Student Pool", value: request.maxStudents || 'Std', icon: GraduationCap, color: "text-emerald-400" },
                                    { label: "Storage Core", value: request.storageLimit ? `${request.storageLimit}GB` : 'Std', icon: Zap, color: "text-amber-400" }
                                ].map((limit, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <limit.icon className={cn("w-5 h-5 mb-2", limit.color)} />
                                        <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">{limit.label}</p>
                                        <p className="text-xl font-black">{limit.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Deck (Pending Only) */}
                        {!readonly && request.status === 'PENDING' && (
                            <div className="pt-8 border-t border-slate-100 dark:border-zinc-800 space-y-6">
                                {showRejectionForm ? (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                        <Textarea 
                                            placeholder="Audit refusal reason... (Emailed to Institution Lead)"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="rounded-2xl bg-rose-50/30 border-rose-100 font-bold text-sm min-h-[100px] p-6"
                                        />
                                        <div className="flex gap-3">
                                            <Button 
                                                onClick={handleReject}
                                                disabled={isPending}
                                                className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.2em] text-[10px]"
                                            >
                                                Confirm Rejection Audit
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                onClick={() => setShowRejectionForm(false)}
                                                className="px-6 h-12 rounded-xl font-bold text-xs"
                                            >
                                                Abort
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Button 
                                            onClick={handleApprove}
                                            disabled={isPending}
                                            className="flex-[2] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            <UserCheck className="w-4 h-4 mr-3" /> Activate Institutional Node
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => setShowRejectionForm(true)}
                                            disabled={isPending}
                                            className="flex-1 h-14 rounded-2xl border-2 border-rose-100 text-rose-600 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-50 active:scale-95 transition-all"
                                        >
                                            <UserX className="w-4 h-4 mr-3" /> Deny Access
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
