"use client";

import { useTransition, useState } from "react";
import { approveWorkspaceRequest, rejectWorkspaceRequest, deleteWorkspaceRequest } from "@/actions/workspace-request";
import { Button } from "@/components/ui/button";
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
    Cpu,
    ExternalLink,
    MessageSquare,
    Copy,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface RequestCardProps {
    request: any;
    readonly?: boolean;
    history?: any[];
    isExpanded?: boolean;
    onToggle?: () => void;
}

export function RequestCard({ 
    request, 
    readonly = false, 
    history = [],
    isExpanded: controlledExpanded,
    onToggle: controlledOnToggle,
}: RequestCardProps) {
    const [isPending, startTransition] = useTransition();
    const [internalExpanded, setInternalExpanded] = useState(false);
    const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
    const handleToggle = controlledOnToggle || (() => setInternalExpanded(!internalExpanded));

    const [showRejectionForm, setShowRejectionForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [copiedEmail, setCopiedEmail] = useState(false);

    const createdAt = new Date(request.createdAt);
    const hoursElapsed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
    const isUrgent = hoursElapsed >= 24;
    const isPendingStatus = request.status === 'PENDING';

    const handleCopyEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(request.adminEmail);
        setCopiedEmail(true);
        toast.success("Email copied to clipboard");
        setTimeout(() => setCopiedEmail(false), 2000);
    };

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approveWorkspaceRequest(request.id);
            if (res.success) toast.success("Workspace activated successfully!");
            else toast.error(res.error || "Failed to activate workspace");
        });
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a refusal reason for the audit trail");
            return;
        }
        startTransition(async () => {
            const res = await rejectWorkspaceRequest(request.id, rejectionReason.trim());
            if (res.success) {
                toast.success("Requisition denied and applicant notified");
                setShowRejectionForm(false);
            } else {
                toast.error(res.error || "Failed to deny request");
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("Are you sure you want to permanently delete this requisition record?")) return;
        startTransition(async () => {
            const res = await deleteWorkspaceRequest(request.id);
            if (res.success) toast.success("Record deleted permanently");
            else toast.error(res.error || "Failed to delete record");
        });
    };

    const quickReasons = [
        "Incomplete verification documentation",
        "Duplicate requisition application",
        "Unable to verify official institutional email",
        "Capacity quota allocation exceeded"
    ];

    return (
        <div className={cn(
            "group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 transition-all duration-200",
            !readonly && isUrgent && isPendingStatus && "border-amber-500/40 shadow-amber-500/5",
            isExpanded && "shadow-xs border-primary/40 ring-1 ring-primary/20"
        )}>
            {/* Status indicator bar on the left edge */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-colors",
                request.status === 'PENDING' ? (isUrgent ? "bg-amber-500" : "bg-primary") :
                request.status === 'APPROVED' ? "bg-emerald-500" :
                "bg-rose-500"
            )} />

            {/* Horizontal summary ledger row */}
            <div 
                onClick={handleToggle}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-3.5 px-3.5 sm:px-4 cursor-pointer gap-2.5 sm:gap-4 select-none hover:bg-muted/30 transition-colors"
            >
                {/* Identity & Workspace details */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={cn(
                        "size-8.5 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-2xs",
                        request.status === 'PENDING' ? "bg-primary/10 text-primary" :
                        request.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                        "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    )}>
                        {request.workspaceName?.[0]?.toUpperCase() || <Building2 className="size-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                {request.workspaceName}
                            </h3>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0 px-1.5 h-4.5 border-border/60">
                                {request.planId}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                #{request.id.slice(-6).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground leading-tight">
                            <span className="font-medium text-foreground/85 truncate">{request.adminName}</span>
                            <span>•</span>
                            <span className="truncate">{request.adminEmail}</span>
                        </div>
                    </div>
                </div>

                {/* Middle stats (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-5 px-4 border-l border-border/50 text-center shrink-0">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Faculty</p>
                        <p className="text-xs font-black text-foreground tabular-nums">{request.maxTeachers || 'Std'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Students</p>
                        <p className="text-xs font-black text-foreground tabular-nums">{request.maxStudents || 'Std'}</p>
                    </div>
                </div>

                {/* Right side: Status and Time */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <Clock className={cn("size-3", isUrgent && isPendingStatus ? "text-amber-500 animate-pulse" : "text-muted-foreground")} />
                            <span className={cn(
                                "text-[10px] font-semibold",
                                isUrgent && isPendingStatus ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"
                            )}>
                                {isPendingStatus ? formatDistanceToNow(createdAt, { addSuffix: true }) : format(createdAt, "dd MMM yyyy")}
                            </span>
                        </div>
                        <div>
                            {request.status === 'PENDING' && (
                                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider h-4.5 px-2">
                                    Waitlist
                                </Badge>
                            )}
                            {request.status === 'APPROVED' && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider h-4.5 px-2">
                                    Authorized
                                </Badge>
                            )}
                            {request.status === 'REJECTED' && (
                                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase tracking-wider h-4.5 px-2">
                                    Declined
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {!readonly && (
                            <Button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                                size="icon" 
                                variant="ghost" 
                                className="size-7 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete record"
                                disabled={isPending}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggle();
                            }}
                            className={cn(
                                "size-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                                isExpanded ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            title={isExpanded ? "Collapse dossier" : "Expand dossier"}
                        >
                            <ChevronDown className={cn("size-3.5 transition-transform duration-300 ease-out", isExpanded && "rotate-180")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded dossier ledger view with smooth open & close transitions */}
            <div 
                className={cn(
                    "grid transition-all duration-300 ease-out border-border/40",
                    isExpanded 
                        ? "grid-rows-[1fr] opacity-100 border-t" 
                        : "grid-rows-[0fr] opacity-0 border-t-0 pointer-events-none"
                )}
            >
                <div className="overflow-hidden">
                    <div className="p-3.5 sm:p-4 pt-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3">
                            {/* Contact & Administrative Lead */}
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Users className="size-3 text-primary" />
                                        Administrative Dossier
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={handleCopyEmail}
                                        className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                                    >
                                        {copiedEmail ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                        <span>Copy Email</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Lead Admin</p>
                                        <p className="font-semibold text-foreground truncate">{request.adminName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Official Email</p>
                                        <p className="font-semibold text-foreground truncate">{request.adminEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Contact Phone</p>
                                        <p className="font-semibold text-foreground">{request.adminPhone || "Not provided"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">WhatsApp</p>
                                        <p className="font-semibold text-foreground">{request.whatsappNo || "Not provided"}</p>
                                    </div>
                                    <div className="col-span-2 pt-1">
                                        <p className="text-[10px] text-muted-foreground font-medium">Node Physical Location</p>
                                        <p className="font-semibold text-foreground">{request.address || "Global Cluster Node"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <a 
                                        href={`mailto:${request.adminEmail}`} 
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-card border border-border/60 hover:bg-muted font-semibold text-xs transition-colors"
                                    >
                                        <Mail className="size-3.5 text-primary" />
                                        <span>Send Email</span>
                                    </a>
                                    {request.adminPhone && (
                                        <a 
                                            href={`tel:${request.adminPhone}`} 
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-card border border-border/60 hover:bg-muted font-semibold text-xs transition-colors"
                                        >
                                            <Phone className="size-3.5 text-emerald-500" />
                                            <span>Direct Call</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Resource Allocation & Specifications */}
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <Cpu className="size-3 text-primary" />
                                            Resource Blueprint
                                        </span>
                                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                                            Plan: {request.planId}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Faculty</p>
                                            <p className="text-sm font-black text-foreground">{request.maxTeachers || 'Std'}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Students</p>
                                            <p className="text-sm font-black text-foreground">{request.maxStudents || 'Std'}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Exams Cap</p>
                                            <p className="text-sm font-black text-foreground">{request.maxExams || 'Std'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit Status Details */}
                                <div className="p-2.5 rounded-lg bg-card border border-border/40 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-[10px] uppercase font-bold">Audit State</span>
                                        <span className="font-bold text-foreground capitalize">{request.status.toLowerCase()}</span>
                                    </div>
                                    {request.processedAt && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            Processed on {format(new Date(request.processedAt), "PPP 'at' p")}
                                        </p>
                                    )}
                                    {request.rejectionReason && (
                                        <div className="mt-2 p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                                            <span className="font-bold block text-[10px] uppercase">Refusal Reason:</span>
                                            "{request.rejectionReason}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action deck for pending requests */}
                        {!readonly && request.status === 'PENDING' && (
                            <div className="pt-2 border-t border-border/40">
                                {showRejectionForm ? (
                                    <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-foreground">Specify Refusal Justification</p>
                                            <span className="text-[10px] text-muted-foreground">Will be logged and emailed to applicant</span>
                                        </div>
                                        <Textarea 
                                            placeholder="Provide reason for denial..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            className="rounded-xl border-border/60 text-xs min-h-[75px]"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                            {quickReasons.map((reason, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setRejectionReason(reason)}
                                                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-colors"
                                                >
                                                    {reason}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Button 
                                                onClick={handleReject}
                                                disabled={isPending}
                                                size="sm"
                                                variant="destructive"
                                                className="h-8.5 px-4 rounded-xl text-xs font-semibold gap-1.5"
                                            >
                                                <UserX className="size-3.5" />
                                                <span>Confirm Denial</span>
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowRejectionForm(false)}
                                                className="h-8.5 px-3.5 rounded-xl text-xs font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                        <Button 
                                            onClick={handleApprove}
                                            disabled={isPending}
                                            size="sm"
                                            className="w-full sm:w-auto h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xs gap-1.5 transition-all"
                                        >
                                            <UserCheck className="size-4" />
                                            <span>Approve & Provision Workspace</span>
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowRejectionForm(true)}
                                            disabled={isPending}
                                            className="w-full sm:w-auto h-9 px-4 rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs gap-1.5 transition-all"
                                        >
                                            <UserX className="size-4" />
                                            <span>Deny Requisition</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
