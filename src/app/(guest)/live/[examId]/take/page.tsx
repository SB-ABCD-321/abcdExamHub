import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { AssessmentTerminal } from "@/components/assessment/AssessmentTerminal";

export default async function GuestExamTakePage(props: { params: Promise<{ examId: string }> }) {
    const { examId } = await props.params;

    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            questions: {
                include: { question: true }
            }
        }
    });

    if (!exam || exam.status !== "ACTIVE" || (exam as any).accessType !== "OPEN_GUEST") {
        return notFound();
    }

    // Verify Guest Cookie
    const cookieStore = await cookies();
    const guestCookie = cookieStore.get(`guest_exam_${examId}`);
    
    // Check if the user is a logged-in platform user via Clerk
    // We fetch this so we can attribute their grade to their real account instead of a pure guest account.
    const { userId } = await auth();
    let dbUser = null;
    
    if (userId) {
        dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    }

    // If they don't have a guest cookie, they MUST be sent back to enter the password,
    // regardless of whether they have a platform account or not.
    if (!guestCookie) {
        redirect(`/live/${examId}`);
    }

    let guestData = null;
    if (guestCookie) {
        try {
            guestData = JSON.parse(guestCookie.value);
        } catch(e) {
            redirect(`/live/${examId}`);
        }
    }

    // Convert questions to client format
    const targetQuestions = exam.questions.map(eq => ({
        id: eq.question.id,
        text: eq.question.text,
        options: eq.question.options,
        imageUrl: eq.question.imageUrl
    }));

    // If we have a logged-in user taking an OPEN exam, pass their real ID as the studentId
    // If it's a pure guest, pass a temporary string since AssessmentTerminal requires a string prop, 
    // but the API backend will handle the real nullification.
    const terminalStudentId = dbUser?.id || "GUEST";

    return (
        <AssessmentTerminal
            exam={{
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                passMarks: exam.passMarks,
                workspaceName: exam.workspace.name
            }}
            questions={targetQuestions}
            studentId={terminalStudentId}
            exitUrl={`/live/${examId}`}
            onFinish={async (answers, timeTaken) => {
                "use server";
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/guest-exam/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        examId: exam.id,
                        answers,
                        timeTaken,
                        studentId: dbUser?.id || null,     // Pass real ID if logged in
                        guestName: guestData?.name || null, // Pass guest name if walk-in
                        guestMobile: guestData?.mobile || null,
                        guestCookieAuth: guestCookie?.value // Pass cookie value for API auth verification
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return {  
                        success: true, 
                        redirectUrl: data.redirectUrl || `/live/${exam.id}/thank-you` 
                    };
                }
                
                return { success: false, error: "Failed to submit assessment" };
            }}
        />
    );
}
