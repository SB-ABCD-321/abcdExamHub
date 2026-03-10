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

    // Attempt to prevent double-submission
    const existingResult = await db.examResult.findFirst({
        where: { examId, studentId: dbUser.id }
    });

    if (existingResult) {
        redirect(`/student/results`);
    }

    const examSettings = await db.exam.findUnique({
        where: { id: examId },
        select: {
            marksPerQuestion: true,
            negativeMarksEnabled: true,
            negativeMarksValue: true
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

    // Record the result
    const result = await db.examResult.create({
        data: {
            score,
            timeTaken: timeTakenSeconds,
            answers: answers,
            examId,
            studentId: dbUser.id
        }
    });

    // Revalidate routes
    revalidatePath("/student");
    revalidatePath("/student/exams");
    revalidatePath("/student/results");

    // Send them to a specific result receipt route 
    redirect(`/student/results/${result.id}`);
}
