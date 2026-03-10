import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { QrCode, Users, GraduationCap, ClipboardList, Zap, Rocket, CheckCircle2 } from "lucide-react";
import { EntityBarChart } from "@/components/analytics/BarChart";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function AdminDashboard() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md font-medium italic">You do not have Admin privileges. Please contact the Super Admin to purchase a workspace subscription and upgrade your account.</p>
            </div>
        )
    }

    let workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
        include: {
            teachers: true,
            students: true,
            exams: true,
        }
    });

    let examEngagementData: any[] = [];

    if (workspace) {
        // Exam Engagement (Results over time - Bar Chart Data)
        const results = await db.examResult.findMany({
            where: { exam: { workspaceId: workspace.id } },
            orderBy: { createdAt: 'asc' }
        });

        if (results.length > 0) {
            const engagementMap = new Map<string, number>();
            results.forEach(r => {
                const dateStr = r.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                engagementMap.set(dateStr, (engagementMap.get(dateStr) || 0) + 1);
            });
            examEngagementData = Array.from(engagementMap.entries()).map(([date, count]) => ({ date, count }));
        }
    }

    async function createOrUpdateWorkspace(formData: FormData) {
        "use server";
        if (!dbUser) return;

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const contactEmail = formData.get("contactEmail") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const address = formData.get("address") as string;

        const existing = await db.workspace.findUnique({ where: { adminId: dbUser.id } });

        if (existing) {
            await db.workspace.update({
                where: { id: existing.id },
                data: { name, description, contactEmail, contactPhone, address }
            });
        } else {
            await db.workspace.create({
                data: {
                    name, description, contactEmail, contactPhone, address,
                    adminId: dbUser.id
                }
            })
        }
        revalidatePath("/admin");
    }

    const showUpgradePrompt = workspace && !workspace.aiUnlimited && workspace.aiGenerationsCount >= 1;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Workspace <span className="text-primary">Hub</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Manage your enterprise training environment.
                </p>
            </div>

            {showUpgradePrompt && (
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 rounded-[2.5rem] p-10 text-white shadow-[0_20px_50px_rgb(99,102,241,0.3)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                    <Zap className="absolute -bottom-6 -right-6 w-56 h-56 text-white/5 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight">Upgrade to Unlimited AI</h2>
                            <p className="text-sm text-indigo-100 font-medium italic max-w-xl leading-relaxed">You've sampled the power of AI Question Generation. Unlock unlimited creation, custom branding, and deep proctoring insights by upgrading to Enterprise Premium.</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Questions
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Custom Logo & Themes
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Advanced Proctoring
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Link href="mailto:sb.abcd321@gmail.com?subject=Workspace Upgrade Request">
                                <Button className="h-14 px-8 bg-white text-indigo-700 hover:bg-zinc-900 hover:text-white rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300">
                                    <Rocket className="w-5 h-5 mr-3" /> Upgrade Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {!workspace ? (
                <Card className="max-w-2xl relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden mt-12 group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/30 p-8 border-b border-slate-100 dark:border-zinc-800 relative z-10">
                        <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Welcome to ABCD Exam Hub!</CardTitle>
                        <CardDescription className="text-muted-foreground mt-1 font-medium italic">Get started by creating your Institute Workspace profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 relative z-10">
                        <form action={createOrUpdateWorkspace} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institute Name</Label>
                                <Input id="name" name="name" placeholder="E.g., Global Tech Academy" required className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 font-bold focus-visible:ring-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                                <Input id="description" name="description" placeholder="A brief about your institute..." required className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 focus-visible:ring-indigo-500" />
                            </div>
                            <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1rem] font-black uppercase tracking-widest shadow-[0_8px_20px_rgb(99,102,241,0.3)] hover:shadow-[0_12px_25px_rgb(99,102,241,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 mt-4">Initialize Workspace</Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-12">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(99,102,241,0.08)] transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Students</CardTitle>
                                <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-900/40 rounded-xl shadow-sm border border-indigo-100/50 dark:border-indigo-800/50">
                                    <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{workspace.students.length}</div>
                                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-1 font-bold uppercase tracking-widest">Currently enrolled</p>
                            </CardContent>
                        </Card>

                        <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(16,185,129,0.08)] transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workforce</CardTitle>
                                <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-900/40 rounded-xl shadow-sm border border-emerald-100/50 dark:border-emerald-800/50">
                                    <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{workspace.teachers.length}</div>
                                <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-bold uppercase tracking-widest">Teachers & Staff</p>
                            </CardContent>
                        </Card>

                        <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden group hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(245,158,11,0.08)] transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Vault</CardTitle>
                                <div className="p-2.5 bg-amber-50/80 dark:bg-amber-900/40 rounded-xl shadow-sm border border-amber-100/50 dark:border-amber-800/50">
                                    <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{workspace.exams.length}</div>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-bold uppercase tracking-widest">Total question sets</p>
                            </CardContent>
                        </Card>

                        <Card className={cn(
                            "relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-all duration-500",
                            workspace.aiUnlimited ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white hover:shadow-[0_20px_40px_rgb(99,102,241,0.3)]" : "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl hover:shadow-[0_20px_40px_rgb(99,102,241,0.08)]"
                        )}>
                            {!workspace.aiUnlimited && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />}
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    workspace.aiUnlimited ? "text-indigo-200" : "text-slate-400"
                                )}>AI Smart Credits</CardTitle>
                                <div className={cn(
                                    "p-2.5 rounded-xl shadow-sm border",
                                    workspace.aiUnlimited ? "bg-white/20 border-white/10" : "bg-slate-50/80 dark:bg-zinc-800 border-slate-100/50 dark:border-zinc-700/50"
                                )}>
                                    <Zap className={cn("w-4 h-4 group-hover:scale-110 transition-transform", workspace.aiUnlimited ? "text-white" : "text-indigo-600")} />
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <div className="text-4xl font-black">
                                        {workspace.aiUnlimited ? "∞" : workspace.aiGenerationsCount}
                                    </div>
                                    {!workspace.aiUnlimited && (
                                        <div className="text-lg font-bold text-slate-400">
                                            / {(workspace as any).aiLimit || 10}
                                        </div>
                                    )}
                                </div>
                                <p className={cn(
                                    "text-[10px] mt-1 font-bold uppercase tracking-widest",
                                    workspace.aiUnlimited ? "text-indigo-200" : "text-indigo-600/80 dark:text-indigo-400/80"
                                )}>
                                    {workspace.aiUnlimited ? "Premium Enterprise Access" : "Usage Tracking"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* NEW: Workspace Capacity Monitoring for Admin */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] p-6 group">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher Capacity</h4>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {workspace.teachers.length} / {(workspace as any).maxTeachers || 5}
                                    </Badge>
                                </div>
                                <Progress
                                    value={(workspace.teachers.length / ((workspace as any).maxTeachers || 5)) * 100}
                                    className="h-2 bg-indigo-50 dark:bg-indigo-900/20 [&>div]:bg-indigo-600"
                                />
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    {((workspace as any).maxTeachers || 5) - workspace.teachers.length} seats remaining in your current plan.
                                </p>
                            </div>
                        </Card>

                        <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] p-6 group">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Enrollment</h4>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {workspace.students.length} / {(workspace as any).maxStudents || 100}
                                    </Badge>
                                </div>
                                <Progress
                                    value={(workspace.students.length / ((workspace as any).maxStudents || 100)) * 100}
                                    className="h-2 bg-emerald-50 dark:bg-emerald-900/20 [&>div]:bg-emerald-600"
                                />
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    {((workspace as any).maxStudents || 100) - workspace.students.length} student slots available.
                                </p>
                            </div>
                        </Card>

                        <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] p-6 group">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Inventory</h4>
                                    <Badge variant="outline" className="text-[10px] font-bold">
                                        {workspace.exams.length} / {(workspace as any).maxExams || 10}
                                    </Badge>
                                </div>
                                <Progress
                                    value={(workspace.exams.length / ((workspace as any).maxExams || 10)) * 100}
                                    className="h-2 bg-amber-50 dark:bg-amber-900/20 [&>div]:bg-amber-600"
                                />
                                <p className="text-[10px] text-muted-foreground font-medium italic">
                                    {((workspace as any).maxExams || 10) - workspace.exams.length} more exams can be hosted.
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-8">
                        <Link href="/admin/invitations" className="lg:col-span-1 block group">
                            <Card className="hover:border-indigo-600 transition-all duration-500 h-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-[0_8px_30px_rgb(99,102,241,0.2)] hover:shadow-[0_20px_40px_rgb(99,102,241,0.4)] border-none rounded-[2rem] p-6 relative overflow-hidden group">
                                <QrCode className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="p-0 mb-4 relative z-10">
                                    <CardTitle className="text-xl font-bold tracking-tight">Growth Toolbox</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 relative z-10">
                                    <p className="text-xs opacity-90 font-medium mb-8 leading-relaxed">Invite students via QR code or magic links to seamlessly scale your institute globally.</p>
                                    <Button variant="secondary" className="w-full h-12 rounded-xl font-bold text-xs text-indigo-700 shadow-md hover:shadow-lg transition-all duration-300">Manage Invitations</Button>
                                </CardContent>
                            </Card>
                        </Link>

                        <div className="lg:col-span-3">
                            {examEngagementData.length > 0 && (
                                <Card className="relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] p-8 overflow-hidden group h-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
                                        <div>
                                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Exam Participation</CardTitle>
                                            <p className="text-xs text-muted-foreground font-medium">Daily count of students who completed exams.</p>
                                        </div>
                                        <Badge variant="secondary" className="w-fit text-[10px] font-black uppercase px-3 py-1 bg-indigo-50 text-indigo-600 border-indigo-100">
                                            Last 30 Days
                                        </Badge>
                                    </div>
                                    <div className="relative z-10 h-[250px]">
                                        <EntityBarChart
                                            data={examEngagementData}
                                            title=""
                                            description=""
                                            dataKey="count"
                                            nameKey="date"
                                            color="#6366f1"
                                        />
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>

                    <Card className="max-w-3xl relative border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden mt-12 group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/30 p-8 border-b border-slate-100 dark:border-zinc-800 relative z-10">
                            <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Workspace Configuration</CardTitle>
                            <CardDescription className="text-muted-foreground mt-1 font-medium italic">Update your institute's public profile and contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 relative z-10">
                            <form action={createOrUpdateWorkspace} className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institute Brand Name</Label>
                                    <Input id="name" name="name" defaultValue={workspace.name || ""} required className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 font-bold focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Public Tagline</Label>
                                    <Input id="description" name="description" defaultValue={workspace.description || ""} className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Public Email</Label>
                                    <Input id="contactEmail" name="contactEmail" defaultValue={workspace.contactEmail || ""} type="email" className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number</Label>
                                    <Input id="contactPhone" name="contactPhone" defaultValue={workspace.contactPhone || ""} className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institute Address</Label>
                                    <Input id="address" name="address" defaultValue={workspace.address || ""} className="rounded-[1rem] border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 h-14 focus-visible:ring-indigo-500" />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all duration-300">
                                        Update Enterprise Profile
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
