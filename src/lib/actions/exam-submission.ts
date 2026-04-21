import { db } from "@/lib/prisma";

export interface GuestSubmissionPayload {
    examId: string;
    answers: Record<string, string>;
    timeTaken: number;
    studentId?: string | null;
    guestName?: string | null;
    guestMobile?: string | null;
}

export async function submitGuestExam(payload: GuestSubmissionPayload) {
    const { examId, answers, timeTaken, studentId, guestName, guestMobile } = payload;

    // Basic validation
    if (!examId || typeof timeTaken !== 'number' || !answers) {
        throw new Error("Invalid submission payload");
    }

    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: { questions: { include: { question: true } } }
    });

    if (!exam) {
        throw new Error("Exam not found");
    }

    // Ensure exam is OPEN_GUEST
    if (exam.accessType !== "OPEN_GUEST") {
        throw new Error("Unauthorized access type: Exam is not configured for Guest entry.");
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

    const finalScore = rawScore;

    // Security check: Either it's a valid logged-in student, OR they provided valid Guest data
    if (!studentId && (!guestName || !guestMobile)) {
        throw new Error("Missing identity credentials for submission.");
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
    // Logged-in students get handled intelligently by AssessmentTerminal, Guests to thank-you page
    let redirectUrl = undefined;
    if (!studentId) {
        redirectUrl = `/live/${exam.id}/thank-you`;
    }

    return {
        success: true,
        redirectUrl,
        resultPublishMode: studentId ? exam.resultPublishMode : undefined,
        newResultId: newResult.id,
        resultId: newResult.id
    };
}
