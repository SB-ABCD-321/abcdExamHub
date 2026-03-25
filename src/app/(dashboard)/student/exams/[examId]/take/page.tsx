import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExamTaker } from "./ExamTaker";

export default async function TakeExamPage(props: { params: Promise<{ examId: string }>, searchParams: Promise<{ mode?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const examId = params.examId;
    const modeParam = searchParams.mode;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) return <div>User not found.</div>;

    // Fetch the exam AND fully include questions BUT explicitly DO NOT forward the 'correctAnswer' to the client component.
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            allowedStudents: {
                select: { id: true }
            },
            questions: {
                include: {
                    question: {
                        select: {
                            id: true,
                            text: true,
                            options: true,
                            imageUrl: true
                            // IMPORTANT: We do NOT select `correctAnswer` here so it never reaches the browser.
                        }
                    }
                }
            }
        }
    });

    if (!exam) return redirect("/student/exams");

    // Access Control:
    // If students are assigned → only those students can access
    // If no students assigned → anyone with the link (+ password if set) can take it
    const hasAssignedStudents = exam.allowedStudents.length > 0;
    const isDirectlyAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);

    if (!exam.isPublic && hasAssignedStudents && !isDirectlyAllowed) {
        return redirect("/student/exams");
    }

    // Workspace restrictions check constraint
    const ws = exam.workspace as any;
    
    // Check trial expiration
    if (ws.trialExpiresAt && new Date(ws.trialExpiresAt) < new Date()) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Workspace Trial Expired</h1>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm">The institution hosting this exam has an expired subscription trial. Access is temporarily suspended.</p>
                <Link href="/student/exams">
                    <button className="h-11 px-8 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm">
                        Browse Other Exams
                    </button>
                </Link>
            </div>
        );
    }

    // Check concurrency limits
    const maxConcurrent = ws.maxConcurrentExams ?? 100;
    
    // Count drafts for the whole workspace
    const workspaceDraftsCount = await db.examDraft.count({
        where: { exam: { workspaceId: ws.id } }
    });

    // Check if user already has an active draft
    const existingDraft = await db.examDraft.findUnique({
        where: { examId_studentId: { examId: exam.id, studentId: dbUser.id } }
    });

    if (!existingDraft && workspaceDraftsCount >= maxConcurrent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Platform at Capacity</h1>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm">This exam&apos;s institution has reached its maximum concurrent examinee limit. Please try again later.</p>
                <Link href="/student/exams">
                    <button className="h-11 px-8 rounded-xl font-bold text-sm border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all text-slate-700 dark:text-slate-300">
                        Go Back
                    </button>
                </Link>
            </div>
        );
    }

    // Check if they already took it. 
    // Usually exams are one-time attempt. If we want multiple attempts, remove this block.
    // For this app, let's enforce single attempts per exam instance.
    const existingResult = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <h1 className="text-2xl font-bold mb-2">Exam Already Taken</h1>
                <p className="text-muted-foreground mb-6">You have already submitted this exam on {new Date(existingResult.createdAt).toLocaleDateString()}.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <a href={`/student/results/${existingResult.id}`}>
                        <button className="h-11 px-6 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                            View Result Status
                        </button>
                    </a>
                    <a href="/student/exams">
                        <button className="h-11 px-6 rounded-xl font-bold text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                            Browse Exams
                        </button>
                    </a>
                    <a href="/student">
                        <button className="h-11 px-6 rounded-xl font-bold text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">
                            Dashboard
                        </button>
                    </a>
                </div>
            </div>
        );
    }

    // Flatten nested relational data before passing to client component
    const sanitizedQuestions = exam.questions.map(eq => eq.question);

    // Shuffle questions slightly so students next to each other have different orders
    const shuffledQuestions = sanitizedQuestions.sort(() => Math.random() - 0.5);

    const examExperience = (exam as any).examExperience || "BOTH";
    let activeMode = modeParam;
    
    if (examExperience === "CLASSIC") activeMode = "classic";
    if (examExperience === "PREMIUM") activeMode = "premium";

    if (!activeMode && examExperience === "BOTH") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
                <h1 className="text-4xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">Choose Your Experience</h1>
                <p className="text-muted-foreground mb-12 text-lg">Select how you want to interact with this exam.</p>
                <div className="grid sm:grid-cols-2 gap-6 max-w-2xl w-full">
                    <Link href={`?mode=classic`}>
                        <div className="cursor-pointer border-2 hover:border-primary border-slate-200 dark:border-zinc-800 rounded-[2rem] p-8 transition-all text-left bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl h-full flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                                <div className="w-8 h-8 flex flex-col gap-1.5">
                                    <div className="w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                    <div className="w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                    <div className="w-3/4 h-2 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Classic Flow</h3>
                            <p className="text-sm text-muted-foreground font-medium">Standard top-to-bottom scroll view. Best for quick reviewing and larger screens.</p>
                        </div>
                    </Link>
                    <Link href={`?mode=premium`}>
                        <div className="cursor-pointer border-2 hover:border-indigo-500 rounded-[2rem] p-8 transition-all text-left bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900 shadow-sm hover:shadow-xl border-indigo-100 dark:border-indigo-900/50 h-full flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center mb-6">
                                <div className="w-8 h-8 flex flex-col gap-2 items-center justify-center">
                                    <div className="w-full h-3.5 bg-indigo-500 dark:bg-indigo-400 rounded-sm" />
                                    <div className="flex gap-2 w-full justify-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-600" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-3 text-indigo-700 dark:text-indigo-400">Premium Focus</h3>
                            <p className="text-sm text-indigo-900/60 dark:text-indigo-200/60 font-medium">One question at a time. Distraction-free pagination style for maximum focus.</p>
                        </div>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4">
            {/* The ExamTaker component is a Client Component managing state */}
            <ExamTaker
                examId={exam.id}
                title={exam.title}
                durationMinutes={exam.duration}
                questions={shuffledQuestions}
                studentId={dbUser.id}
                mode={activeMode as any}
            />
        </div>
    );
}
