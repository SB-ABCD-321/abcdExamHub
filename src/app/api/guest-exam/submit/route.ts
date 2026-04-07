import { NextResponse } from "next/server";
import { submitGuestExam } from "@/lib/actions/exam-submission";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Pass data to the shared action
        const result = await submitGuestExam({
            examId: body.examId,
            answers: body.answers,
            timeTaken: body.timeTaken,
            studentId: body.studentId,
            guestName: body.guestName,
            guestMobile: body.guestMobile
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("GUEST_EXAM_SUBMIT_API_ERROR", error);
        return NextResponse.json({ 
            error: error.message || "Internal Server Error" 
        }, { status: error.message?.includes("Unauthorized") ? 403 : 500 });
    }
}

