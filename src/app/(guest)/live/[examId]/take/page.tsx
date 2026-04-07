import { db } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { AssessmentTerminal } from "@/components/assessment/AssessmentTerminal";
import { submitGuestExam } from "@/lib/actions/exam-submission";


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

    const concurrentLimit = (exam.workspace as any).maxStudentsPerExam ?? 100;
    const currentSubmissions = await db.examResult.count({
        where: { examId: exam.id }
    });
    
    // Also include active exam drafts to prevent over-subscription before submission
    const activeDrafts = await db.examDraft.count({
        where: { examId: exam.id }
    });

    if ((currentSubmissions + activeDrafts) >= concurrentLimit) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Exam at Capacity</h1>
                <p className="text-muted-foreground font-medium mb-8 max-w-sm">This exam has reached its maximum participant limit set by the workspace administrator. Please try again later.</p>
            </div>
        );
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

                try {
                    const result = await submitGuestExam({
                        examId: exam.id,
                        answers,
                        timeTaken,
                        studentId: dbUser?.id || null,
                        guestName: guestData?.name || null,
                        guestMobile: guestData?.mobile || null
                    });

                    return result;
                } catch (error: any) {
                    console.error("GUEST_EXAM_SUBMISSION_ACTION_ERROR", error);
                    return { success: false, error: error.message || "Failed to submit assessment" };
                }
            }}

        />
    );
}
