import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ExamTaker } from "./ExamTaker";

export default async function TakeExamPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params;
    const examId = params.examId;

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
                <div className="bg-muted p-6 rounded-xl w-full max-w-sm mb-8">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Your Score</p>
                    <p className="text-4xl font-black mb-2">{existingResult.score} / {exam.questions.length}</p>
                    <p className="font-medium text-sm">
                        {existingResult.score >= exam.passMarks ? (
                            <span className="text-green-600 dark:text-green-500">Passed successfully</span>
                        ) : (
                            <span className="text-destructive">Failed to meet passing criteria ({exam.passMarks})</span>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    <a href={`/student/results/${existingResult.id}`}>
                        <button className="h-11 px-6 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                            View Result
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

    return (
        <div className="px-4">
            {/* The ExamTaker component is a Client Component managing state */}
            <ExamTaker
                examId={exam.id}
                title={exam.title}
                durationMinutes={exam.duration}
                questions={shuffledQuestions}
                studentId={dbUser.id}
            />
        </div>
    );
}
