"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow } from "date-fns";
import { 
    ChevronDown, 
    ShieldCheck, 
    GraduationCap, 
    User, 
    Calendar, 
    Activity, 
    Mail,
    Phone,
    Copy,
    Check,
    Building2,
    ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MakeAdminModal } from "@/components/super-admin/MakeAdminModal";
import { SuperAdminUserActions } from "@/components/super-admin/SuperAdminUserActions";
import { toast } from "sonner";
import Link from "next/link";

interface UserRowProps {
    user: any;
    isDeveloper: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}

export function UserRow({ user, isDeveloper, isExpanded, onToggle }: UserRowProps) {
    const [copiedEmail, setCopiedEmail] = useState(false);

    const roleColors: Record<string, string> = {
        SUPER_ADMIN: "bg-indigo-500",
        ADMIN: "bg-emerald-500",
        TEACHER: "bg-amber-500",
        STUDENT: "bg-sky-500"
    };

    const roleBadgeStyles: Record<string, string> = {
        SUPER_ADMIN: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        ADMIN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        TEACHER: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        STUDENT: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
    };

    const roleLabels: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Workspace Admin",
        TEACHER: "Faculty / Teacher",
        STUDENT: "Student / Examinee"
    };

    const roleIcons: Record<string, any> = {
        SUPER_ADMIN: ShieldCheck,
        ADMIN: Building2,
        TEACHER: GraduationCap,
        STUDENT: User
    };

    const RoleIcon = roleIcons[user.role] || User;

    const handleCopyEmail = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(user.email);
        setCopiedEmail(true);
        toast.success("Email copied to clipboard");
        setTimeout(() => setCopiedEmail(false), 2000);
    };

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Anonymous Identity";
    const totalMemberships = (user._count?.teacherWorkspaces || 0) + (user._count?.studentWorkspaces || 0);
    const totalAuthored = (user._count?.authoredExams || 0) + (user._count?.authoredQuestions || 0);

    return (
        <div className={cn(
            "group relative overflow-hidden border border-border/60 bg-card rounded-xl shadow-2xs hover:border-primary/40 transition-all duration-200",
            isExpanded && "shadow-xs border-primary/40 ring-1 ring-primary/20"
        )}>
            {/* Left vertical role indicator stripe */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", roleColors[user.role] || "bg-muted")} />

            {/* Horizontal summary row */}
            <div 
                onClick={onToggle}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-3.5 px-3.5 sm:px-4 cursor-pointer gap-2.5 sm:gap-4 select-none hover:bg-muted/30 transition-colors"
            >
                {/* Identity & Basic Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="size-8.5 rounded-lg border border-border/60 shrink-0 shadow-2xs">
                        <AvatarImage src={user.imageUrl || ""} alt={fullName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                                {fullName}
                            </h3>
                            <Badge 
                                variant="outline" 
                                className={cn("text-[9px] font-bold uppercase tracking-wider py-0 px-1.5 h-4.5 border", roleBadgeStyles[user.role])}
                            >
                                <RoleIcon className="size-2.5 mr-1" />
                                {roleLabels[user.role]}
                            </Badge>
                            {user.adminWorkspace && (
                                <Badge variant="outline" className="text-[9px] font-bold py-0 px-1.5 h-4.5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 truncate max-w-[150px]">
                                    Org: {user.adminWorkspace.name}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground leading-tight mt-0.5">
                            <span className="truncate">{user.email}</span>
                            {user.phoneNumber && (
                                <>
                                    <span>•</span>
                                    <span className="truncate">{user.phoneNumber}</span>
                                </>
                            )}
                            <span>•</span>
                            <span className="font-mono text-[10px]">#{user.id.slice(-6).toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                {/* Compact Analytics Metrics (Visible on md and up) */}
                <div className="hidden md:flex items-center gap-5 px-4 border-l border-border/50 text-center shrink-0">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Exams</p>
                        <p className="text-xs font-black text-foreground tabular-nums">{user._count?.examResults || 0}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Orgs</p>
                        <p className="text-xs font-black text-foreground tabular-nums">{totalMemberships}</p>
                    </div>
                    {totalAuthored > 0 && (
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Authored</p>
                            <p className="text-xs font-black text-foreground tabular-nums">{totalAuthored}</p>
                        </div>
                    )}
                </div>

                {/* Time & Action Deck */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-0.5">
                            <Calendar className="size-3 text-muted-foreground/70" />
                            <span>Joined {format(new Date(user.createdAt), "dd MMM yyyy")}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/60">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <MakeAdminModal
                                    userId={user.id}
                                    userName={fullName}
                                    userEmail={user.email}
                                />
                            </div>
                        )}
                        <SuperAdminUserActions
                            userId={user.id}
                            userName={fullName}
                            userEmail={user.email}
                            userRole={user.role}
                            createdAt={user.createdAt}
                            isDeveloper={isDeveloper}
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle();
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

            {/* EXPANDED DOSSIER DRAWER WITH SMOOTH OPEN & CLOSE ANIMATION */}
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                            {/* 1: Profile & Contact Card */}
                            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <User className="size-3 text-primary" />
                                        Identity Profile
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
                                <div className="space-y-1.5 text-xs">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Full Name</p>
                                        <p className="font-semibold text-foreground truncate">{fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Official Email</p>
                                        <p className="font-semibold text-foreground truncate">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Contact Phone</p>
                                        <p className="font-semibold text-foreground">{user.phoneNumber || "Not registered"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium">Clerk Identity Shard</p>
                                        <p className="font-mono text-[10px] text-muted-foreground truncate">{user.clerkId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <a 
                                        href={`mailto:${user.email}`}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 h-7.5 rounded-lg bg-card border border-border/60 hover:bg-muted font-semibold text-xs transition-colors"
                                    >
                                        <Mail className="size-3 text-primary" />
                                        <span>Send Mail</span>
                                    </a>
                                    {user.phoneNumber && (
                                        <a 
                                            href={`tel:${user.phoneNumber}`}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 h-7.5 rounded-lg bg-card border border-border/60 hover:bg-muted font-semibold text-xs transition-colors"
                                        >
                                            <Phone className="size-3 text-emerald-500" />
                                            <span>Direct Call</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* 2: Institutional & Workspace Affiliations */}
                            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Building2 className="size-3 text-primary" />
                                        Institutional Shards
                                    </span>
                                    <span className="text-[10px] font-bold text-foreground">
                                        {totalMemberships} Total
                                    </span>
                                </div>
                                <div className="space-y-2 text-xs">
                                    {user.adminWorkspace ? (
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground">Admin Workspace</p>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className="font-bold text-foreground truncate">{user.adminWorkspace.name}</p>
                                                <Link 
                                                    href={`/super-admin/workspaces?id=${user.adminWorkspace.id}`}
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                >
                                                    <span>Manage</span>
                                                    <ExternalLink className="size-2.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-muted-foreground italic">No primary workspace admin governance assigned.</p>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Faculty Orgs</p>
                                            <p className="text-sm font-black text-foreground">{user._count?.teacherWorkspaces || 0}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Student Orgs</p>
                                            <p className="text-sm font-black text-foreground">{user._count?.studentWorkspaces || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3: Activity & Audit Trail */}
                            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Activity className="size-3 text-primary" />
                                        Audit Ledger
                                    </span>
                                    <Badge variant="outline" className="text-[9px] font-bold border-border/60">
                                        {user.isProfileComplete ? "Profile Verified" : "Basic Auth"}
                                    </Badge>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Exams Taken</p>
                                            <p className="text-sm font-black text-foreground">{user._count?.examResults || 0}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-card border border-border/40">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold">Authored Content</p>
                                            <p className="text-sm font-black text-foreground">{totalAuthored}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-card border border-border/40 text-[10px] space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Registered:</span>
                                            <span className="font-semibold text-foreground">{format(new Date(user.createdAt), "dd MMM yyyy, HH:mm")}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Last Activity:</span>
                                            <span className="font-semibold text-foreground">{format(new Date(user.updatedAt), "dd MMM yyyy, HH:mm")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
