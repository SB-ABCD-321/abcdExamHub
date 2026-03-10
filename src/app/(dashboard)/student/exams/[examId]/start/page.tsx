import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, PlayCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function ExamStartPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params;
    const examId = params.examId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
    });

    if (!dbUser) return <div>User not found.</div>;

    // Fetch exam with relation to check if student is allowed
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            allowedStudents: {
                where: { id: dbUser.id }
            },
            _count: { select: { questions: true } }
        }
    });

    if (!exam) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Exam Not Found</h2>
                <p className="text-muted-foreground mt-2">This exam does not exist or has been removed.</p>
                <Link href="/student/exams" className="mt-6">
                    <Button variant="outline">Back to Exams</Button>
                </Link>
            </div>
        );
    }

    // Security check: If exam isn't public, and student isn't in the allowed list, block them.
    if (!exam.isPublic && exam.allowedStudents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md">You do not have permission to take this private exam. Please contact the workspace admin.</p>
                <Link href="/student/exams" className="mt-6">
                    <Button variant="outline">Back to Exams</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-8">
                <Link href="/student/exams" className="text-sm text-primary hover:underline font-medium">
                    &larr; Back to all tests
                </Link>
            </div>

            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="text-center space-y-4 pb-8">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold">{exam.title}</CardTitle>
                        <CardDescription className="text-base mt-2 max-w-xl mx-auto">
                            {exam.description || "Get ready to start your mock test."}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted text-center p-4 rounded-xl">
                            <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-bold text-lg">{exam.duration} Min</p>
                        </div>
                        <div className="bg-muted text-center p-4 rounded-xl">
                            <p className="w-5 h-5 mx-auto mb-2 text-muted-foreground flex items-center justify-center font-bold">#</p>
                            <p className="text-sm text-muted-foreground">Questions</p>
                            <p className="font-bold text-lg">{exam._count.questions}</p>
                        </div>
                        <div className="bg-muted text-center p-4 rounded-xl">
                            <p className="w-5 h-5 mx-auto mb-2 text-muted-foreground flex items-center justify-center font-bold">🎯</p>
                            <p className="text-sm text-muted-foreground">Pass Mark</p>
                            <p className="font-bold text-lg">{exam.passMarks}</p>
                        </div>
                        <div className="bg-muted text-center p-4 rounded-xl">
                            <p className="w-5 h-5 mx-auto mb-2 text-muted-foreground flex items-center justify-center font-bold">🏢</p>
                            <p className="text-sm text-muted-foreground">Provider</p>
                            <p className="font-bold text-sm truncate px-1" title={exam.workspace.name}>{exam.workspace.name}</p>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex flex-col gap-2">
                        <h4 className="font-semibold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-primary" />
                            Exam Instructions
                        </h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>The timer will start immediately after clicking "Begin Exam".</li>
                            <li>Do not refresh the page during the exam.</li>
                            <li>The exam will auto-submit when the duration expires.</li>
                            <li>Once submitted, you cannot retake this specific attempt instance.</li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="px-8 pb-8 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-b-xl border-t mt-4 pt-6">
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                        Are you ready to begin? Ensure you have a stable connection.
                    </p>
                    <Link href={`/student/exams/${exam.id}/take`} className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto font-bold px-8">
                            Begin Exam Now
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
