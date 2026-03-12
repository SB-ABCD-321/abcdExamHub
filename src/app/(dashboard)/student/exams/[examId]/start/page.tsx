import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, PlayCircle, ShieldAlert, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function ExamStartPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params;
    const examId = params.examId;

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: { studentWorkspaces: true }
    });

    if (!dbUser) return <div>User not found.</div>;

    // Fetch exam with ALL allowed students to determine access mode
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            allowedStudents: {
                select: { id: true }
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

    // Access Control:
    // If students are assigned → only those students can access
    // If no students assigned → anyone with the link (+ password if set) can take it
    const hasAssignedStudents = exam.allowedStudents.length > 0;
    const isDirectlyAllowed = exam.allowedStudents.some(s => s.id === dbUser.id);

    if (!exam.isPublic && hasAssignedStudents && !isDirectlyAllowed) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground mt-2 max-w-md">You are not in the allowed participants list for this exam. Please contact the examiner.</p>
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

                <CardFooter className="px-8 pb-10 flex flex-col gap-8 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl border-t mt-4 pt-8">
                    <div className="text-center w-full space-y-2">
                        <h4 className="text-lg font-bold">Choose Your Exam Experience</h4>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                            Select the layout that best suits your testing preference. Both modes follow the same grading system.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 w-full">
                        {/* Premium Mode Option */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-primary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 h-full shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <Badge className="bg-indigo-600 text-white border-none text-[10px] font-black uppercase tracking-widest">Recommended</Badge>
                                </div>
                                <h5 className="font-bold text-base mb-2">Premium Mode</h5>
                                <p className="text-xs text-muted-foreground mb-6 flex-1">Advanced navigation map, auto-save, focus mode, and tab-switching detection for a focused session.</p>
                                <Link href={`/exam/${exam.id}`} className="w-full">
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                                        Launch Premium
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Classic Mode Option */}
                        <div className="relative flex flex-col bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 h-full shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500 group-hover:text-primary transition-colors">
                                    <Clock className="w-5 h-5" />
                                </div>
                            </div>
                            <h5 className="font-bold text-base mb-2">Classic Mode</h5>
                            <p className="text-xs text-muted-foreground mb-6 flex-1">Traditional vertical scroll layout. Simple, familiar, and distraction-free for those who prefer the original format.</p>
                            <Link href={`/student/exams/${exam.id}/take`} className="w-full">
                                <Button variant="outline" className="w-full font-bold h-11 rounded-xl border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95">
                                    Start Classic
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
