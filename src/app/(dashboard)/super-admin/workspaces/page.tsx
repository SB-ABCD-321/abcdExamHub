import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";
import { EditWorkspaceAiLimitModal } from "@/components/workspace/EditWorkspaceAiLimitModal";

export default async function SuperAdminWorkspacesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const allWorkspaces = await db.workspace.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            admin: { select: { firstName: true, lastName: true, email: true } },
            _count: {
                select: {
                    teachers: true,
                    students: true,
                    exams: true
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Platform <span className="text-primary">Workspaces</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Monitor and manage all institute workspaces hosted on the platform.
                </p>
            </div>

            <Card className="mt-6 border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardHeader>
                    <CardTitle>All Workspaces ({allWorkspaces.length})</CardTitle>
                    <CardDescription>View statistics and contact details for each institute.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y border-t bg-muted/20">
                        {allWorkspaces.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">No workspaces have been created yet.</div>
                        ) : (
                            allWorkspaces.map((ws) => (
                                <div key={ws.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-lg flex items-center gap-2">
                                            {ws.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-lg line-clamp-1">{ws.description}</p>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <span>Admin: {ws.admin.firstName} {ws.admin.lastName} ({ws.admin.email})</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="outline" className="flex gap-1 items-center px-2 py-1">
                                            <span className="font-semibold">{ws._count.teachers}</span> Teachers
                                        </Badge>
                                        <Badge variant="outline" className="flex gap-1 items-center px-2 py-1">
                                            <span className="font-semibold">{ws._count.students}</span> Students
                                        </Badge>
                                        <Badge variant="outline" className="flex gap-1 items-center px-2 py-1">
                                            <span className="font-semibold">{ws._count.exams}</span> / {(ws as any).maxExams || 10} Exams
                                        </Badge>
                                        <Badge variant={ws.aiUnlimited ? "default" : "secondary"} className="flex gap-1 items-center px-2 py-1">
                                            AI Usage: <span className="font-semibold">{ws.aiGenerationsCount}</span> {ws.aiUnlimited ? "" : `/ ${ws.aiLimit || 10}`}
                                        </Badge>
                                        <EditWorkspaceAiLimitModal
                                            workspaceId={ws.id}
                                            workspaceName={ws.name}
                                            currentLimit={ws.aiLimit || 10}
                                            currentUsage={ws.aiGenerationsCount}
                                            isUnlimited={ws.aiUnlimited}
                                            maxTeachers={ws.maxTeachers}
                                            maxStudents={ws.maxStudents}
                                            maxExams={(ws as any).maxExams || 10}
                                        />
                                        <UniversalDeleteAction type="WORKSPACE" id={ws.id} name={ws.name} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
