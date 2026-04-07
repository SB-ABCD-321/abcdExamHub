import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ShieldCheck } from "lucide-react";
import { UserSearchBox } from "@/components/super-admin/UserSearchBox";
import { MakeAdminModal } from "@/components/super-admin/MakeAdminModal";
import { SuperAdminUserActions } from "@/components/super-admin/SuperAdminUserActions";
import { UserRow } from "./user-row";
import { Pagination } from "@/components/shared/Pagination";

export default async function SuperAdminUsersPage(
    props: { searchParams: Promise<{ q?: string; page?: string }> }
) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const searchParams = await props.searchParams;
    const q = searchParams?.q || "";
    const page = Number(searchParams?.page) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });

    if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    const devEmail = process.env.DEVELOPER_EMAIL || "developer@abcd.com";
    const isDeveloper = dbUser.email.toLowerCase() === devEmail.toLowerCase();

    // Build the query dynamically
    const queryFilter = q ? {
        OR: [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
        ]
    } : {};

    const [allUsers, totalUsers] = await Promise.all([
        db.user.findMany({
            where: queryFilter,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                _count: {
                    select: {
                        teacherWorkspaces: true,
                        studentWorkspaces: true,
                        examResults: true
                    }
                }
            }
        }),
        db.user.count({ where: queryFilter })
    ]);

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                <div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                        Platform <span className="text-indigo-600">Users</span>
                    </h1>
                    <p className="text-muted-foreground font-bold text-sm md:text-base max-w-xl italic">
                        The Institutional Ledger of all registered identities. Manage roles and audit platform-wide activity with high-fidelity control.
                    </p>
                </div>
                <div className="w-full lg:w-auto">
                    <UserSearchBox />
                </div>
            </div>

            <div className="flex flex-col gap-4 mt-8">
                {allUsers.length === 0 ? (
                    <div className="p-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                        <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-black uppercase tracking-tight">No Identities Found</h3>
                        <p className="text-xs text-muted-foreground font-bold italic mt-2">No users match your criteria in the global directory.</p>
                    </div>
                ) : (
                    allUsers.map((user) => (
                        <UserRow key={user.id} user={user} isDeveloper={isDeveloper} />
                    ))
                )}
            </div>

            <div className="mt-10">
                <Pagination totalItems={totalUsers} itemsPerPage={pageSize} currentPage={page} />
            </div>
        </div>
    );
}
