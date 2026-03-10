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
    });

    if (!dbUser) return <div>User not found.</div>;

    // Fetch the exam AND fully include questions BUT explicitly DO NOT forward the 'correctAnswer' to the client component.
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            allowedStudents: {
                where: { id: dbUser.id }
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

    // Security check: If exam isn't public, and student isn't in the allowed list, block them.
    if (!exam.isPublic && exam.allowedStudents.length === 0) {
        return redirect("/student/exams");
    }

    // Check if they already took it. 
    // Usually exams are one-time attempt. If we want multiple attempts, remove this block.
    // For this app, let's enforce single attempts per exam instance.
    const existingResult = await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        // Redirect to their result explicitly if they try to retake
        return redirect(`/student/results`);
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
            />
        </div>
    );
}
