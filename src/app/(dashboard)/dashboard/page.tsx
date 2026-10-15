import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AccountSetupLoader from "@/components/layout/AccountSetupLoader";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    let dbUser = await db.user.findUnique({
        where: {
            clerkId: userId
        }
    });

    if (!dbUser) {
        // Fallback: If webhook hasn't fired yet, attempt immediate provisioning from Clerk user profile
        try {
            const clerkUser = await currentUser();
            if (clerkUser) {
                const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress || "";
                if (primaryEmail) {
                    const stubUser = await db.user.findUnique({ where: { email: primaryEmail } });
                    if (stubUser) {
                        dbUser = await db.user.update({
                            where: { id: stubUser.id },
                            data: {
                                clerkId: userId,
                                firstName: clerkUser.firstName || stubUser.firstName || "",
                                lastName: clerkUser.lastName || stubUser.lastName || "",
                                imageUrl: clerkUser.imageUrl || stubUser.imageUrl || "",
                            }
                        });
                    } else {
                        dbUser = await db.user.create({
                            data: {
                                clerkId: userId,
                                email: primaryEmail,
                                firstName: clerkUser.firstName || "",
                                lastName: clerkUser.lastName || "",
                                imageUrl: clerkUser.imageUrl || "",
                                role: "STUDENT"
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.error("Dashboard fallback user provisioning error:", e);
        }
    }

    if (!dbUser) {
        // Render lively, automated account setup loading screen
        return <AccountSetupLoader />;
    }

    // Redirect to respective role dashboards
    switch (dbUser.role) {
        case "SUPER_ADMIN":
            redirect("/super-admin");
        case "ADMIN":
            redirect("/admin");
        case "TEACHER":
            redirect("/teacher");
        case "STUDENT":
        default:
            redirect("/student");
    }
}
