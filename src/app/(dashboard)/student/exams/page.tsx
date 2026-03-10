import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExamClientSection } from "@/components/shared/ExamClientSection";
import { BookOpen } from "lucide-react";

export default async function StudentExamsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser) return <div>User not found.</div>;

    // 1. Fetch Drafts (In Progress)
    const draftExams = await db.examDraft.findMany({
        where: { studentId: dbUser.id },
        include: {
            exam: {
                include: {
                    workspace: true,
                    author: true,
                    _count: { select: { questions: true } }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });

    const draftIds = draftExams.map(d => d.examId);

    // 2. Fetch History (Results)
    const historyExams = await db.examResult.findMany({
        where: { studentId: dbUser.id },
        include: {
            exam: {
                include: {
                    workspace: true,
                    author: true,
                    _count: { select: { questions: true } }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const historyIds = historyExams.map(h => h.examId);

    // 3. Fetch Available (Not in drafts or history)
    const availableExams = await (db.exam as any).findMany({
        where: {
            AND: [
                {
                    OR: [
                        { isPublic: true },
                        { allowedStudents: { some: { id: dbUser.id } } }
                    ]
                },
                { id: { notIn: [...draftIds, ...historyIds] } },
                { status: "ACTIVE" }
            ]
        },

        include: {
            workspace: true,
            author: true,
            _count: { select: { questions: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-10 pb-16">
            <div className="flex flex-col gap-2 relative z-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                        Exam <span className="text-primary">Terminal</span>
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                        Launch new assessments, pick up where you left off, or review your historical performance data.
                    </p>
                </div>
            </div>


            <ExamClientSection
                availableExams={availableExams}
                draftExams={draftExams.map(d => ({ ...d.exam, draftId: d.id }))}
                historyExams={historyExams}
            />
        </div>
    );
}
