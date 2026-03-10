import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { InvitationManager } from "./ClientManager";

export default async function AdminInvitationsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser) return <div>User profile not found.</div>;

    // Get Admin's workspace
    const workspace = await db.workspace.findUnique({
        where: { adminId: dbUser.id },
    });

    if (!workspace) return <div>Workspace not found.</div>;

    const headersList = await headers();
    const host = headersList.get("host") || "";
    // Reconstruct base URL avoiding hardcoded localhost
    const protocol = host.includes("localhost") ? "http" : "https";
    const joinLink = `${protocol}://${host}/join/${workspace.id}`;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Student <span className="text-primary">Invitations</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Invite students to join your institute and access exams.
                </p>
            </div>

            <InvitationManager joinLink={joinLink} workspaceName={workspace.name} />
        </div>
    );
}
