"use server"

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitExamAction(examId: string, answers: Record<string, string>, timeTakenSeconds: number) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!dbUser) {
        throw new Error("User profile missing");
    }

    const examSettings = await db.exam.findUnique({
        where: { id: examId },
        select: {
            marksPerQuestion: true,
            negativeMarksEnabled: true,
            negativeMarksValue: true,
            resultPublishMode: true
        }
    });

    if (!examSettings) {
        throw new Error("Exam settings not found");
    }

    // Fetch all the genuine correct answers securely on the server
    const examQuestions = await db.examQuestion.findMany({
        where: { examId },
        include: {
            question: {
                select: {
                    id: true,
                    correctAnswer: true // Fetching the hidden correct answer
                }
            }
        }
    });

    // Calculate score
    let score = 0;

    examQuestions.forEach(eq => {
        const studentAnswer = answers[eq.question.id];

        if (studentAnswer === eq.question.correctAnswer) {
            score += examSettings.marksPerQuestion;
        } else if (studentAnswer) {
            // Student answered, but it was wrong. Deduct if enabled.
            if (examSettings.negativeMarksEnabled) {
                score -= examSettings.negativeMarksValue;
            }
        }
    });

    // Wrap the duplicate check and registration in a transaction to prevent race conditions
    // Using custom transaction to safely prevent double submission during high-concurrency 
    const result = await db.$transaction(async (tx: any) => {
        const existingResult = await tx.examResult.findFirst({
            where: { examId, studentId: dbUser.id }
        });

        if (existingResult) {
            return existingResult;
        }

        return await tx.examResult.create({
            data: {
                score,
                timeTaken: timeTakenSeconds,
                answers: answers,
                examId,
                studentId: dbUser.id
            }
        });
    });

    // If we just got the existing result back from the transaction closure, we can safely exit
    if (result.timeTaken !== timeTakenSeconds && result.score !== score) {
       // Optional: We could log that a duplicate was caught here
    }

    // Revalidate routes
    revalidatePath("/student");
    revalidatePath("/student/exams");
    revalidatePath("/student/results");

    // Return success payload so client can redirect dynamically
    return { 
        success: true, 
        resultPublishMode: examSettings.resultPublishMode, 
        newResultId: result.id 
    };
}
