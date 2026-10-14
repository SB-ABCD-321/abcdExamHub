import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { InvitationManager } from "./ClientManager";
import { DashboardPage, DashboardHeader } from "@/components/layout/DashboardTemplate";

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
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Student <span className="text-primary font-black">Invitations</span></>}
                subtitle="Invite scholars to join your institutional portal and automatically access examinations."
            />

            <div className="max-w-4xl">
                <InvitationManager joinLink={joinLink} workspaceName={workspace.name} />
            </div>
        </DashboardPage>
    );
}
