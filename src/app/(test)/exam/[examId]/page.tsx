import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AssessmentTerminal } from "@/components/assessment/AssessmentTerminal";
import { PasswordGate } from "@/components/exam/PasswordGate";
import { submitExam } from "./actions";

export default async function StudentExamPage(
    props: { 
        params: Promise<{ examId: string }>;
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    }
) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const params = await props.params;
    const searchParams = await props.searchParams;
    const isTest = searchParams.test === 'true';

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) redirect("/dashboard");

    const exam = await db.exam.findUnique({
        where: { id: params.examId },
        include: {
            workspace: {
                include: {
                    admin: { select: { id: true, firstName: true, lastName: true } }
                }
            },
            allowedStudents: { select: { id: true } },
            questions: {
                include: {
                    question: true
                }
            }
        }
    });

    if (!exam) return <div className="p-12 text-center">Exam not found.</div>;

    // Access Control based on 4 types
    const isEnrolledInWorkspace = dbUser.studentWorkspaces.some(ws => ws.id === exam.workspaceId);
    
    // Testing Permissions
    const isAuthor = (exam as any).authorId === dbUser.id;
    const workspaceAdminId = (exam as any).workspace?.admin?.id;
    const isWorkspaceAdmin = workspaceAdminId === dbUser.id;
    const isSuperAdmin = dbUser.role === "SUPER_ADMIN";
    const canTest = isAuthor || isWorkspaceAdmin || isSuperAdmin;

    let isAuthorized = true;

    if (exam.accessType === "SELECTED_STUDENTS") {
        const isDirectlyAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);
        if (!isEnrolledInWorkspace || !isDirectlyAllowed) isAuthorized = false;
    } else if (exam.accessType === "WORKSPACE_PRIVATE") {
        if (!isEnrolledInWorkspace) isAuthorized = false;
    } else if (exam.accessType === "GLOBAL_PUBLIC") {
        isAuthorized = true;
    } else if (exam.accessType === "OPEN_GUEST") {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        if (!(isTest && canTest)) {
            return <div className="p-12 text-center text-red-500 font-bold">Unauthorized access attempt.</div>;
        }
    }

    const cookieStore = await cookies();
    const isUnlocked = cookieStore.has(`unlocked_${exam.id}`);

    // Absolute password enforcement: If an exam has a password, EVERY student must pass it.
    if ((exam as any).password && !isUnlocked) {
        return <PasswordGate examId={exam.id} title={exam.title} />;
    }

    const existingResult = isTest ? null : await db.examResult.findFirst({
        where: { examId: exam.id, studentId: dbUser.id }
    });

    if (existingResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Exam Already Taken</h1>
                <p className="text-muted-foreground mb-6">You submitted this on {new Date(existingResult.createdAt).toLocaleDateString()}.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <a href={`/student/results/${existingResult.id}`}>
                        <button className="h-11 px-6 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                            View Result
                        </button>
                    </a>
                </div>
            </div>
        );
    }

    const clientQuestions = exam.questions.map(eq => ({
        id: eq.question.id,
        text: eq.question.text,
        imageUrl: eq.question.imageUrl,
        options: eq.question.options
    }));

    const wsName = (exam.workspace as any).siteName || (exam.workspace as any).name || "Assessment Center";

    return (
        <AssessmentTerminal
            exam={{
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                passMarks: exam.passMarks,
                workspaceName: wsName
            }}
            questions={clientQuestions}
            studentId={dbUser.id}
            mode={isTest ? "TEST" : "LIVE"}
            exitUrl={isTest ? "/teacher/exams" : "/student/exams"}
            onFinish={async (answers, timeTaken) => {
                "use server";
                if (isTest) {
                    return { success: true, redirectUrl: "/teacher/exams" };
                }
                return await submitExam(exam.id, dbUser.id, answers, timeTaken);
            }}
        />
    );
}
