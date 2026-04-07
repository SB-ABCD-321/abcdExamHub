"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { 
    ChevronDown, 
    ChevronUp, 
    ShieldCheck, 
    GraduationCap, 
    User, 
    Calendar, 
    Activity, 
    Mail,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MakeAdminModal } from "@/components/super-admin/MakeAdminModal";
import { SuperAdminUserActions } from "@/components/super-admin/SuperAdminUserActions";
import { Card, CardContent } from "@/components/ui/card";

interface UserRowProps {
    user: any;
    isDeveloper: boolean;
}

export function UserRow({ user, isDeveloper }: UserRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const roleColors: Record<string, string> = {
        SUPER_ADMIN: "bg-indigo-500",
        ADMIN: "bg-emerald-500",
        TEACHER: "bg-amber-500",
        STUDENT: "bg-slate-400"
    };

    const roleLabels: Record<string, string> = {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Workspace Admin",
        TEACHER: "Professional Teacher",
        STUDENT: "Examinee / Student"
    };

    const roleIcons: Record<string, any> = {
        SUPER_ADMIN: ShieldCheck,
        ADMIN: GraduationCap,
        TEACHER: GraduationCap,
        STUDENT: User
    };

    const Icon = roleIcons[user.role] || User;

    return (
        <Card className={cn(
            "group relative overflow-hidden border border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.005] transition-all duration-500",
            isExpanded && "shadow-2xl ring-1 ring-primary/20 bg-white dark:bg-zinc-900"
        )}>
            {/* Role Scan-Line */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", roleColors[user.role])} />

            <CardContent className="p-0">
                {/* HORIZONTAL LEDGER ROW */}
                <div 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex flex-col md:flex-row md:items-center p-4 md:p-6 cursor-pointer gap-4 md:gap-8 min-h-[80px]"
                >
                    {/* COL 1: IDENTITY */}
                    <div className="flex items-center gap-4 flex-[1.5] min-w-0">
                        <Avatar className="h-12 w-12 rounded-2xl shadow-inner border border-slate-100 dark:border-zinc-800">
                            <AvatarImage src={user.imageUrl || ""} />
                            <AvatarFallback className="bg-slate-100 dark:bg-zinc-800 text-sm font-black">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none mb-1.5 truncate">
                                {user.firstName} {user.lastName}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 truncate tracking-tight lowercase">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: ROLE BADGE */}
                    <div className="flex-1 min-w-0 flex items-center">
                         <div className={cn(
                            "px-4 py-1.5 rounded-full flex items-center gap-2 border-[0.5px]",
                            user.role === 'SUPER_ADMIN' ? "bg-indigo-50 border-indigo-100 text-indigo-700" :
                            user.role === 'ADMIN' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                            user.role === 'TEACHER' ? "bg-amber-50 border-amber-100 text-amber-700" :
                            "bg-slate-50 border-slate-100 text-slate-700"
                         )}>
                            <Icon className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{roleLabels[user.role]}</span>
                         </div>
                    </div>

                    {/* COL 3: ANALYTICS (Compact) */}
                    <div className="hidden lg:flex items-center gap-8 flex-1 justify-center border-l border-slate-100 dark:border-zinc-800 pr-8">
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Exams</p>
                            <p className="text-xs font-black">{user._count.examResults}</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Memberships</p>
                            <p className="text-xs font-black">{user._count.teacherWorkspaces + user._count.studentWorkspaces}</p>
                         </div>
                    </div>

                    {/* COL 4: TIME/ACTIONS */}
                    <div className="flex items-center justify-between md:justify-end gap-6 md:w-[220px] shrink-0">
                        <div className="flex flex-col items-end text-right">
                             <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="w-3 h-3 text-slate-300" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    Joined {format(new Date(user.createdAt), "dd MMM")}
                                </span>
                             </div>
                             <div className="flex items-center gap-2">
                                {user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && (
                                    <MakeAdminModal
                                        userId={user.id}
                                        userName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                                        userEmail={user.email}
                                    />
                                )}
                                <SuperAdminUserActions
                                    userId={user.id}
                                    userName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                                    userEmail={user.email}
                                    userRole={user.role}
                                    createdAt={user.createdAt}
                                    isDeveloper={isDeveloper}
                                />
                             </div>
                        </div>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm",
                            isExpanded ? "bg-primary text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                        )}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                </div>

                {/* EXPANDED CONTENT (LEDGER DEEP-DIVE) */}
                {isExpanded && (
                    <div className="px-6 md:px-10 pb-10 space-y-8 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-100 dark:border-zinc-800">
                             {/* Institutional Role Trace */}
                             <div className="space-y-6">
                                <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-zinc-800/20 border border-slate-100 dark:border-zinc-800 flex items-start gap-4">
                                    <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                                        <Activity className="w-6 h-6 text-indigo-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black uppercase tracking-tight">Access Audit Summary</h4>
                                        <p className="text-xs text-muted-foreground font-medium italic italic">
                                            Account created via {user.email.includes("gmail.com") ? "Google Global Cluster" : "Institutional Mail Server"}.
                                        </p>
                                        <div className="pt-3 flex flex-wrap gap-2">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 bg-indigo-50/50">Trace Verified</Badge>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-200 text-emerald-600 bg-emerald-50/50">Profile Complete</Badge>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Contact Hub */}
                             <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-2">Communication Hub</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a href={`mailto:${user.email}`} className="h-12 px-5 rounded-2xl bg-white dark:bg-zinc-950 border border-slate-100 hover:border-indigo-600 flex items-center gap-4 group/mail transition-all shadow-sm">
                                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                            <Mail className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black uppercase text-slate-400">Direct Link</p>
                                            <p className="text-[11px] font-bold truncate">Dispatch Mail</p>
                                        </div>
                                    </a>
                                </div>
                             </div>
                        </div>

                        {/* Professional Metrics Card */}
                        <div className="p-8 rounded-[2.5rem] bg-slate-950 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Activity size={80} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {[
                                    { label: "Exams Mastered", value: user._count.examResults, color: "text-indigo-400" },
                                    { label: "Teacher Shards", value: user._count.teacherWorkspaces, color: "text-amber-400" },
                                    { label: "Student Shards", value: user._count.studentWorkspaces, color: "text-emerald-400" },
                                    { label: "Registry Date", value: format(new Date(user.createdAt), "dd/MM/yy"), color: "text-slate-400" }
                                ].map((stat, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center">
                                        <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">{stat.label}</p>
                                        <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
