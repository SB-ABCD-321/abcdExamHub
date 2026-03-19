import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        // 🔒 AUTH GUARD — must be a signed-in user
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { examId, studentId, answers, timeTaken } = await req.json();

        if (!examId || !studentId) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        // 🔒 OWNERSHIP GUARD — the authenticated user must match the studentId to prevent spoofing
        const dbUser = await db.user.findUnique({
            where: { clerkId },
            select: { id: true }
        });

        if (!dbUser) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (dbUser.id !== studentId) {
            return NextResponse.json({ success: false, error: "Forbidden: You cannot submit on behalf of another user" }, { status: 403 });
        }

        // Prevent double-submission
        const existingResult = await db.examResult.findFirst({
            where: { examId, studentId }
        });

        if (existingResult) {
            return NextResponse.json({ success: true, resultId: existingResult.id });
        }

        // Fetch exam settings for scoring
        const exam = await db.exam.findUnique({
            where: { id: examId },
            select: {
                marksPerQuestion: true,
                negativeMarksEnabled: true,
                negativeMarksValue: true
            }
        });

        if (!exam) {
            return NextResponse.json({ success: false }, { status: 404 });
        }

        const examQuestions = await db.examQuestion.findMany({
            where: { examId },
            include: { question: true }
        });

        if (!examQuestions || examQuestions.length === 0) {
            return NextResponse.json({ success: false }, { status: 404 });
        }

        // Grade
        let score = 0;
        examQuestions.forEach(eq => {
            const studentAnswer = (answers as Record<string, string>)?.[eq.questionId];
            if (studentAnswer === eq.question.correctAnswer) {
                score += exam.marksPerQuestion;
            } else if (studentAnswer) {
                if (exam.negativeMarksEnabled) {
                    score -= exam.negativeMarksValue;
                }
            }
        });

        // Create result
        const result = await db.examResult.create({
            data: {
                score,
                timeTaken: timeTaken || 0,
                examId,
                studentId,
                answers: (answers || {}) as any
            }
        });

        revalidatePath("/student");
        revalidatePath("/student/exams");

        return NextResponse.json({ success: true, resultId: result.id });
    } catch (error) {
        console.error("Beacon Submit Error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
