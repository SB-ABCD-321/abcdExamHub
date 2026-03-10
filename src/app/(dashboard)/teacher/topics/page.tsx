import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";
import { UniversalDeleteAction } from "@/components/shared/UniversalDeleteAction";

export default async function TopicsManagementPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { teacherWorkspaces: true }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return <div>Unauthorized</div>;
    }

    // Identify accessible workspaces
    let workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace) workspaceIds.push(adminWorkspace.id);
    }

    if (workspaceIds.length === 0) return <div>No active workspaces found.</div>;

    const primaryWorkspaceId = workspaceIds[0];

    const topics = await db.topic.findMany({
        where: { OR: [{ workspaceId: { in: workspaceIds } }, { isGlobal: true }] },
        include: { _count: { select: { questions: true } } }
    });

    async function createTopic(formData: FormData) {
        "use server";

        const name = formData.get("name") as string;
        if (!name) return;

        // By default, teachers create local workspace topics unless it's the Super Admin
        if (!dbUser) return;

        await db.topic.create({
            data: {
                name,
                workspaceId: primaryWorkspaceId,
                isGlobal: false, // Will be set to true if Super Admin creates it via a separate flow
            }
        });

        revalidatePath("/teacher/topics");
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Manage Subject <span className="text-primary">Topics</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Topics categorize your question bank and exams (e.g., General Logic, Advanced Python).
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Create a Topic</CardTitle>
                        <CardDescription>This topic will be available to all teachers within your institute.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createTopic} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Topic Name</Label>
                                <Input id="name" name="name" required placeholder="E.g., Structural Engineering Basics" />
                            </div>

                            <Button type="submit" className="w-full mt-4 font-bold rounded-xl h-12 text-sm shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground">Add Topic</Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Available Topics</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {topics.map(t => (
                            <Card key={t.id} className={t.isGlobal ? 'bg-primary/5 border-primary/20' : ''}>
                                <CardContent className="p-4 flex flex-col justify-center h-full">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        {t.name}
                                        {t.isGlobal && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary text-primary-foreground">Global</span>}
                                    </h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-muted-foreground">{t._count.questions} linked questions</p>
                                        {!t.isGlobal && (
                                            <UniversalDeleteAction type="TOPIC" id={t.id} name={t.name} />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
