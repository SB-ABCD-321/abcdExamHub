import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function StudentExamLayout({
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
            console.error("Clerk API Response Error", error);
        }
    }

    if (!user) {
        redirect("/sign-in");
    }

    // Sync user to database (Replicated from dashboard layout for security and consistency)
    const primaryEmail = user.emailAddresses[0]?.emailAddress || "";
    let dbUser = await db.user.findUnique({ where: { clerkId: user.id } });

    if (!dbUser) {
        dbUser = await db.user.create({
            data: {
                clerkId: user.id,
                email: primaryEmail,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                imageUrl: user.imageUrl || "",
                role: "STUDENT"
            }
        });
    }

    // Force profile completion
    if (!(dbUser as any).isProfileComplete) {
        redirect("/profile-setup");
    }

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 antialiased overflow-hidden">
            {children}
        </div>
    );
}
