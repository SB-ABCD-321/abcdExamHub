import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserSearchBox } from "@/components/super-admin/UserSearchBox";
import { MakeAdminModal } from "@/components/super-admin/MakeAdminModal";
import { SuperAdminUserActions } from "@/components/super-admin/SuperAdminUserActions";

export default async function SuperAdminUsersPage(
    props: { searchParams: Promise<{ q?: string }> }
) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const searchParams = await props.searchParams;
    const q = searchParams?.q || "";

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

    const allUsers = await db.user.findMany({
        where: queryFilter,
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    teacherWorkspaces: true,
                    studentWorkspaces: true,
                    examResults: true
                }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Platform <span className="text-primary">Users</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Comprehensive list of all registered users on the ABCD Exam Hub.
                    </p>
                </div>
                <UserSearchBox />
            </div>

            <Card className="mt-6 border-zinc-200 shadow-sm dark:border-zinc-800">
                <CardHeader>
                    <CardTitle>All Users ({allUsers.length})</CardTitle>
                    <CardDescription>Manage roles and view platform wide activity.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y border-t bg-muted/20">
                        {allUsers.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">No users found matching your search.</div>
                        ) : (
                            allUsers.map((user) => (
                                <div key={user.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={user.imageUrl || ""} />
                                            <AvatarFallback>{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2">
                                                {user.firstName} {user.lastName}
                                                {user.role === "SUPER_ADMIN" && <Badge className="text-[10px] h-5" variant="default">SUPER ADMIN</Badge>}
                                                {user.role === "ADMIN" && <Badge className="text-[10px] h-5" variant="secondary">WORKSPACE ADMIN</Badge>}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 text-xs text-muted-foreground mt-4 sm:mt-0">
                                        <div className="hidden sm:block text-right">
                                            <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                                            {user.role === "STUDENT" && <p>Exams Taken: {user._count.examResults}</p>}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Only allow transforming normal students or teachers into Admins */}
                                            {user.role !== "SUPER_ADMIN" && user.role !== "ADMIN" && (
                                                <div className="hidden sm:block">
                                                    <MakeAdminModal
                                                        userId={user.id}
                                                        userName={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                                                        userEmail={user.email}
                                                    />
                                                </div>
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
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
