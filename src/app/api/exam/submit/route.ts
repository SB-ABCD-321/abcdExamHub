import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const { examId, studentId, answers, timeTaken } = await req.json();

        if (!examId || !studentId) {
            return NextResponse.json({ success: false }, { status: 400 });
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
