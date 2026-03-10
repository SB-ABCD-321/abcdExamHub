import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ResultsClientSection } from "@/components/shared/ResultsClientSection";

export default async function StudentResultsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser) return <div>User not found.</div>;

    const results = await db.examResult.findMany({
        where: { studentId: dbUser.id },
        include: {
            exam: {
                include: {
                    workspace: true,
                    questions: {
                        include: {
                            question: true
                        }
                    },
                    _count: { select: { questions: true } }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-10 pb-16">
            <div className="flex flex-col gap-2 relative z-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Performance <span className="text-primary">Vault</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Your archived assessment history and merit outcomes. Track your path to mastery.
                    </p>
                </div>
            </div>


            <ResultsClientSection results={results} />
        </div>
    );
}
