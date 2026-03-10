import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const dbUser = await db.user.findUnique({
        where: {
            clerkId: userId
        }
    });

    if (!dbUser) {
        // If they just signed up and webhook hasn't fired yet, or webhook failed
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <h2 className="text-2xl font-bold">Setting up your account...</h2>
                <p className="text-muted-foreground">Please refresh the page in a few moments.</p>
            </div>
        );
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
