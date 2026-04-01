import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { examId, answers, timeTaken, studentId, guestName, guestMobile, guestCookieAuth } = body;

        // Basic validation
        if (!examId || typeof timeTaken !== 'number' || !answers) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const exam = await db.exam.findUnique({
            where: { id: examId },
            include: { questions: { include: { question: true } } }
        });

        if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

        // Ensure exam is OPEN_GUEST
        if (exam.accessType !== "OPEN_GUEST") {
            return NextResponse.json({ error: "Unauthorized access type" }, { status: 403 });
        }

        // Calculate Score
        let rawScore = 0;
        let correctCount = 0;
        let incorrectCount = 0;

        exam.questions.forEach((eq) => {
            const q = eq.question;
            const submittedAnswer = answers[q.id];

            if (submittedAnswer) {
                if (submittedAnswer === q.correctAnswer) {
                    rawScore += exam.marksPerQuestion;
                    correctCount++;
                } else {
                    if (exam.negativeMarksEnabled) {
                        rawScore -= exam.negativeMarksValue;
                    }
                    incorrectCount++;
                }
            }
        });

        const finalScore = Math.max(0, rawScore);

        // Security check: Either it's a valid logged-in student, OR they provided valid Guest data
        if (!studentId && (!guestName || !guestMobile)) {
             return NextResponse.json({ error: "Missing identity credentials" }, { status: 401 });
        }

        // Create the ExamResult
        const resultData: any = {
            score: finalScore,
            timeTaken,
            answers,
            examId
        };

        if (studentId) {
            resultData.studentId = studentId;
        } else {
            resultData.guestName = guestName;
            resultData.guestMobile = guestMobile;
        }

        const newResult = await db.examResult.create({
            data: resultData
        });

        // Determine Redirect URLs based on user type
        // Logged-in students get sent to real results page, Guests to thank-you page
        const redirectUrl = studentId 
            ? `/student/results/${newResult.id}`
            : `/live/${exam.id}/thank-you`;

        return NextResponse.json({ 
            success: true, 
            redirectUrl,
            resultId: newResult.id
        });

    } catch (error) {
        console.error("GUEST_EXAM_SUBMIT_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
