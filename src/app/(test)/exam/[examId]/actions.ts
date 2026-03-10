"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function saveExamDraft(examId: string, studentId: string, answers: Record<string, string>, timeLeft: number, currentIndex: number, flaggedQuestions: string[], tabSwitches: number) {
    if (!examId || !studentId) return { success: false };

    try {
        await db.examDraft.upsert({
            where: {
                examId_studentId: { examId, studentId }
            },
            update: {
                answers: answers as any,
                timeLeft,
                lastActiveIndex: currentIndex,
                flaggedQuestions: JSON.stringify(flaggedQuestions),
                tabSwitches
            },
            create: {
                examId,
                studentId,
                answers: answers as any,
                timeLeft,
                lastActiveIndex: currentIndex,
                flaggedQuestions: JSON.stringify(flaggedQuestions),
                tabSwitches
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Draft Save Error:", error);
        return { success: false };
    }
}

export async function submitExam(examId: string, studentId: string, answers: Record<string, string>, timeTaken: number) {
    if (!examId || !studentId) return { success: false }

    try {
        // 1. Fetch Exam and all correct Answers securely from DB to prevent client tampering
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
                score += 1
            }
        })

        // 3. Create Result Model and DELETE Draft in a transaction
        await db.$transaction([
            db.examResult.create({
                data: {
                    score,
                    timeTaken,
                    examId,
                    studentId
                }
            }),
            db.examDraft.deleteMany({
                where: { examId, studentId }
            })
        ]);

        revalidatePath("/student")
        revalidatePath("/student/exams")
        return { success: true };
    } catch (error) {
        console.error("Exam Submission Error:", error);
        return { success: false };
    }
}
