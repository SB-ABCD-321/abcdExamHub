import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    let user = null;

    if (userId) {
        try {
            user = await currentUser();
        } catch (error) {
            console.error("Clerk API Response Error: Failed to fetch user details.", error);
        }
    }
    let role = "STUDENT"; // Default fallback

    if (user) {
        // Sync user to database just in case the Clerk Webhook failed or was delayed
        // This guarantees all logged-in users appear in the Super Admin dashboard
        const primaryEmail = user.emailAddresses[0]?.emailAddress || "";

        let dbUser = await db.user.findUnique({ where: { clerkId: user.id } });

        if (!dbUser) {
            // Check if there is a 'Stub' user created by an Admin invitation using this email
            const stubUser = await db.user.findUnique({ where: { email: primaryEmail } });

            if (stubUser) {
                // Link the Clerk ID to the existing stub account
                dbUser = await db.user.update({
                    where: { id: stubUser.id },
                    data: {
                        clerkId: user.id,
                        firstName: user.firstName || stubUser.firstName || "",
                        lastName: user.lastName || stubUser.lastName || "",
                        imageUrl: user.imageUrl || stubUser.imageUrl || "",
                    }
                });
            } else {
                // Create a completely new user
                dbUser = await db.user.create({
                    data: {
                        clerkId: user.id,
                        email: primaryEmail,
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        imageUrl: user.imageUrl || "",
                        role: "STUDENT" // Default role
                    }
                });
            }
        } else {
            // Just update existing user info on successive logins to keep it fresh
            dbUser = await db.user.update({
                where: { clerkId: user.id },
                data: {
                    email: primaryEmail,
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    imageUrl: user.imageUrl || "",
                }
            });
        }

        role = dbUser.role;
    }

    // Fetch unread counts for the sidebar badges
    let unreadNoticeCount = 0;
    let unreadInquiryCount = 0;
    let unreadBookingCount = 0;
    if (user) {
        try {
            const dbUser = await db.user.findUnique({
                where: { clerkId: user.id },
                include: {
                    adminWorkspace: { select: { id: true } },
                    teacherWorkspaces: { select: { id: true } },
                    studentWorkspaces: { select: { id: true } },
                }
            });
            if (dbUser) {
                const adminWsIds = dbUser.adminWorkspace ? [dbUser.adminWorkspace.id] : [];
                const teacherWsIds = dbUser.teacherWorkspaces.map(w => w.id);
                const studentWsIds = dbUser.studentWorkspaces.map(w => w.id);

                const orConditions: any[] = [{ targetType: "SPECIFIC_USER", targetUserId: dbUser.id }];
                if (dbUser.role === "SUPER_ADMIN" || dbUser.role === "ADMIN") {
                    orConditions.push({ targetType: "ALL_ADMINS" });
                    if (adminWsIds.length) orConditions.push({ targetType: "WORKSPACE_ADMINS", targetWorkspaceId: { in: adminWsIds } });
                }
                if (dbUser.role === "TEACHER") {
                    orConditions.push({ targetType: "ALL_TEACHERS" });
                    if (teacherWsIds.length) orConditions.push({ targetType: "WORKSPACE_TEACHERS", targetWorkspaceId: { in: teacherWsIds } });
                }
                if (dbUser.role === "STUDENT") {
                    orConditions.push({ targetType: "ALL_STUDENTS" });
                    if (studentWsIds.length) orConditions.push({ targetType: "WORKSPACE_STUDENTS", targetWorkspaceId: { in: studentWsIds } });
                }

                // Get IDs this user has already read, then count unread
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const readRecords = await (db as any).noticeRead.findMany({
                    where: { userId: dbUser.id },
                    select: { noticeId: true }
                });
                const readIds = (readRecords as { noticeId: string }[]).map(r => r.noticeId);
                unreadNoticeCount = await db.notice.count({
                    where: {
                        OR: orConditions,
                        ...(readIds.length > 0 ? { id: { notIn: readIds } } : {})
                    }
                });

                // Add pending inquiries for super admins
                if (dbUser.role === "SUPER_ADMIN") {
                    unreadInquiryCount = await db.inquiry.count({
                        where: { status: "PENDING" }
                    });
                    unreadBookingCount = await db.callBooking.count({
                        where: { isRead: false }
                    });
                }
            }
        } catch (e) { /* fail silently for sidebar */ }
    }

    const primaryEmail = user?.emailAddresses[0]?.emailAddress || "";
    const developerEmail = process.env.DEVELOPER_EMAIL || "";

    return (
        <div className="h-full relative antialiased">
            <div className="hidden h-[100dvh] md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
                <Sidebar
                    role={role}
                    email={primaryEmail}
                    developerEmail={developerEmail}
                    unreadNoticeCount={unreadNoticeCount}
                    unreadInquiryCount={unreadInquiryCount}
                    unreadBookingCount={unreadBookingCount}
                />
            </div>
            <main className="md:pl-72 pb-16 md:pb-0 min-h-[100dvh] relative transition-all duration-300">
                <Topbar />
                <div className="p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
                    {children}
                </div>
                {/* We'll assume MobileBottomNav might need the role later, or we can just pass it directly. */}
                <MobileBottomNav
                    role={role}
                    email={primaryEmail}
                    developerEmail={developerEmail}
                    unreadNoticeCount={unreadNoticeCount}
                    unreadInquiryCount={unreadInquiryCount}
                    unreadBookingCount={unreadBookingCount}
                />
            </main>
        </div>
    );
}
