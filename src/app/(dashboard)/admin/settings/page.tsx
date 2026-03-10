import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkspaceSettingsForm } from "@/components/workspace/WorkspaceSettingsForm";

export default async function AdminSettingsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        redirect("/dashboard");
    }

    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id }
    });

    if (!workspace) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Please create your workspace profile on the dashboard first.
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
                <p className="text-muted-foreground">Configure the public appearance and contact details for {workspace.name}.</p>
            </div>

            <WorkspaceSettingsForm workspace={workspace} />
        </div>
    );
}
