"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function submitExam(examId: string, studentId: string, answers: Record<string, string>, timeTaken: number) {
    if (!examId || !studentId) return { success: false }

    try {
        // 1. Fetch Exam Settings and all correct Answers securely from DB to prevent client tampering
        const exam = await db.exam.findUnique({
            where: { id: examId },
            select: {
                marksPerQuestion: true,
                negativeMarksEnabled: true,
                negativeMarksValue: true,
                duration: true,
                endTime: true,
            }
        });

        if (!exam) return { success: false };

        // 1b. Server-side validation: Prevent time-tampering
        // If the student claims to take more time than duration (with a small 30s buffer for network lag)
        const maxAllowedSeconds = (exam.duration * 60) + 30;
        if (timeTaken > maxAllowedSeconds) {
            console.warn(`Tamper Detected: Student ${studentId} claimed ${timeTaken}s for ${exam.duration}min exam.`);
            timeTaken = maxAllowedSeconds; // Force the cap
        }

        // If the exam has ended, reject submissions older than a 2-minute grace period
        if (exam.endTime) {
            const now = new Date();
            const gracePeriod = 2 * 60 * 1000; // 2 minutes
            if (now.getTime() > (exam.endTime.getTime() + gracePeriod)) {
                return { success: false, error: "Exam window has closed" };
            }
        }

        const examQuestions = await db.examQuestion.findMany({
            where: { examId },
            include: { question: true }
        })

        if (!examQuestions || examQuestions.length === 0) return { success: false }

        // 2. Grade internal logic
        let score = 0
        examQuestions.forEach(eq => {
            const studentAnswerStr = answers[eq.questionId]
            if (studentAnswerStr === eq.question.correctAnswer) {
                score += exam.marksPerQuestion
            } else if (studentAnswerStr) {
                // Answered but wrong - check for negative marks
                if (exam.negativeMarksEnabled) {
                    score -= exam.negativeMarksValue
                }
            }
        })

        // 3. Create Result Model and DELETE Draft in a transaction
        const [result] = await db.$transaction([
            db.examResult.create({
                data: {
                    score,
                    timeTaken,
                    examId,
                    studentId,
                    answers: answers as any
                }
            }),
            db.examDraft.deleteMany({
                where: { examId, studentId }
            })
        ]);

        revalidatePath("/student")
        revalidatePath("/student/exams")
        return { success: true, resultId: result.id };
    } catch (error) {
        console.error("Exam Submission Error:", error);
        return { success: false };
    }
}
