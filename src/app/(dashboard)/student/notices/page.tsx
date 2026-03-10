import { db } from "@/lib/prisma";
import { NoticesSection } from "@/components/shared/NoticesSection";
import { getInbox } from "../../../../actions/notice";


import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function StudentNoticesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "STUDENT") redirect("/dashboard");

    const inbox = await getInbox();

    return (
        <div className="space-y-8 pb-12 pr-2">
            <div className="flex flex-col gap-2 relative z-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Inbox & <span className="text-primary">Announcements</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">Stay informed with updates from your teachers and administrators.</p>
                </div>
            </div>
            {/* Students only get inbox, no sender */}
            <NoticesSection allowedTargets={[]} workspaces={[]} inbox={inbox} sentBox={[]} showSentTab={false} />
        </div>
    );
}
