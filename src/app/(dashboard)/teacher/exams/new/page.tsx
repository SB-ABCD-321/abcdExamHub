import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionSelector } from "@/components/shared/QuestionSelector";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { StudentSelector } from "@/components/shared/StudentSelector";

export default async function CreateExamPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            teacherWorkspaces: {
                include: {
                    questions: { orderBy: { createdAt: "desc" } },
                    students: true
                }
            }
        }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return <div>Unauthorized</div>;
    }

    // Define workspace
    let workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN") {
        const adminWorkspace = await db.workspace.findUnique({ where: { adminId: dbUser.id } });
        if (adminWorkspace) workspaceIds.push(adminWorkspace.id);
    }

    if (workspaceIds.length === 0) return <div>No active workspaces context found.</div>;

    const primaryWorkspaceId = workspaceIds[0];

    const isPureTeacher = dbUser.role === "TEACHER";

    const questionWhereClause = isPureTeacher ? {
        OR: [
            { workspaceId: primaryWorkspaceId, authorId: dbUser.id },
            { isPublic: true }
        ]
    } : {
        OR: [
            { workspaceId: primaryWorkspaceId },
            { isPublic: true }
        ]
    };

    // Fetch available questions from this workspace to attach to the exam
    const availableQuestions = await db.question.findMany({
        where: questionWhereClause,
        include: { topic: true },
        orderBy: { createdAt: "desc" },
    });

    // Fetch students for the primary workspace directly from DB
    // This ensures we get students regardless of whether the user is a teacher or admin
    const primaryWorkspace = await db.workspace.findUnique({
        where: { id: primaryWorkspaceId },
        include: {
            students: {
                select: { id: true, firstName: true, lastName: true, email: true },
                orderBy: { firstName: 'asc' }
            }
        }
    });
    const workspaceStudents = primaryWorkspace?.students || [];

    async function createExam(formData: FormData) {
        "use server";

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const contactInfo = formData.get("contactInfo") as string;
        const passMarks = parseFloat(formData.get("passMarks") as string);
        const marksPerQuestion = parseFloat(formData.get("marksPerQuestion") as string);
        const negativeMarksEnabled = formData.get("negativeMarksEnabled") === "on";
        const negativeMarksValue = parseFloat(formData.get("negativeMarksValue") as string);
        const duration = parseInt(formData.get("duration") as string);
        const isPublic = formData.get("isPublic") === "on";
        const password = formData.get("password") as string || null;

        const resultPublishMode = formData.get("resultPublishMode") as string || "INSTANT";
        const customPublishDateStr = formData.get("customPublishDate") as string;
        const showCorrectAnswers = formData.get("showCorrectAnswers") === "on";
        const showDetailedLog = formData.get("showDetailedLog") === "on";

        const startTimeStr = formData.get("startTime") as string;
        const endTimeStr = formData.get("endTime") as string;

        const startTime = startTimeStr ? new Date(startTimeStr) : null;
        const endTime = endTimeStr ? new Date(endTimeStr) : null;
        const customPublishDate = customPublishDateStr ? new Date(customPublishDateStr) : null;

        // Extract all question IDs checked in the form
        const selectedQuestionIds = Array.from(formData.entries())
            .filter(([key, val]) => key.startsWith("question_") && val === "on")
            .map(([key]) => key.replace("question_", ""));

        // Extract student IDs
        const selectedStudentIds = Array.from(formData.entries())
            .filter(([key, val]) => key.startsWith("student_") && val === "on")
            .map(([key]) => key.replace("student_", ""));

        if (selectedQuestionIds.length === 0) return; // Must have questions

        // Check workspace exam limit
        const workspace = await db.workspace.findUnique({
            where: { id: primaryWorkspaceId },
            include: { _count: { select: { exams: true } } }
        });

        if (workspace && workspace._count.exams >= workspace.maxExams) {
            // Ideally we'd show a toast, but this is a server action redirecting or returning.
            // For now, redirect with an error param.
            redirect(`/teacher/exams?error=limit_reached&max=${workspace.maxExams}`);
        }

        const newExam = await db.exam.create({
            data: {
                title,
                description,
                contactInfo,
                passMarks,
                marksPerQuestion,
                negativeMarksEnabled,
                negativeMarksValue: isNaN(negativeMarksValue) ? 0 : negativeMarksValue,
                duration,
                startTime,
                endTime,
                isPublic,
                password,
                resultPublishMode: resultPublishMode as any,
                customPublishDate,
                showCorrectAnswers,
                showDetailedLog,
                workspaceId: primaryWorkspaceId,
                authorId: dbUser!.id,
                allowedStudents: {
                    connect: selectedStudentIds.map(id => ({ id }))
                }
            } as any
        });

        // Link questions to the exam in a high-performance batch
        await db.examQuestion.createMany({
            data: selectedQuestionIds.map(qId => ({
                examId: newExam.id,
                questionId: qId
            }))
        });

        redirect(`/teacher/exams?success=created`);
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Schedule New Exam</h1>
                <p className="text-muted-foreground">Define exam parameters and select questions from the bank.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Exam Configuration</CardTitle>
                    <CardDescription>Configure branding and delivery settings for this test.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createExam} className="space-y-6" suppressHydrationWarning>

                        <div className="space-y-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 mb-4">
                                <h3 className="font-bold text-sm text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">1. General Details</h3>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Exam Title (Required)</Label>
                                    <Input id="title" name="title" required placeholder="E.g., Mid-Term Mathematics II" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="passMarks" className="relative">
                                        Pass Marks Target
                                        <span className="text-xs text-muted-foreground absolute right-0 block">Total points based on Qs</span>
                                    </Label>
                                    <Input id="passMarks" name="passMarks" type="number" min={0} required placeholder="40" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Instructions / Description</Label>
                                <Textarea id="description" name="description" placeholder="Brief standard instructions for the students undertaking this exam..." />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Time Limit (Minutes)</Label>
                                    <Input id="duration" name="duration" type="number" min={1} required placeholder="60" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactInfo">Custom Support Contact</Label>
                                    <Input id="contactInfo" name="contactInfo" placeholder="teacher_name@institute.edu" />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Date & Time (Optional)</Label>
                                    <Input id="startTime" name="startTime" type="datetime-local" className="font-mono text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Date & Time (Optional)</Label>
                                    <Input id="endTime" name="endTime" type="datetime-local" className="font-mono text-sm" />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="isPublic" name="isPublic" />
                                <Label htmlFor="isPublic" className="font-normal cursor-pointer text-sm">
                                    Make this Exam Public (Can be taken by any registered student on the platform)
                                </Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Access Password (Optional)</Label>
                                <PasswordInput 
                                    id="password" 
                                    name="password" 
                                    placeholder="Passphrase for private exams" 
                                    className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                                />
                                <p className="text-[10px] text-muted-foreground italic">If set, users will need this password to start the exam. Recommended for private tests.</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 mb-4">
                                <h3 className="font-bold text-sm text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">2. Marking System</h3>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="marksPerQuestion">Marks per Question</Label>
                                    <Input id="marksPerQuestion" name="marksPerQuestion" type="number" step="0.5" defaultValue="1" min={0} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="negativeMarksValue">Negative Mark Value</Label>
                                    <Select name="negativeMarksValue" defaultValue="0">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select penalty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0 (No Penalty)</SelectItem>
                                            <SelectItem value="0.25">0.25 Pts</SelectItem>
                                            <SelectItem value="0.5">0.5 Pts</SelectItem>
                                            <SelectItem value="1">1 Pt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="negativeMarksEnabled" name="negativeMarksEnabled" />
                                <Label htmlFor="negativeMarksEnabled" className="font-normal cursor-pointer text-sm">
                                    Enable Negative Marking (Deduct penalty points for incorrect answers)
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 mb-4">
                                <h3 className="font-bold text-sm text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">3. Result Publishing Settings</h3>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="resultPublishMode">Publish Mode</Label>
                                    <Select name="resultPublishMode" defaultValue="INSTANT">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select publish mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INSTANT">Instant (Right after submission)</SelectItem>
                                            <SelectItem value="EXAM_END">Exam End Time (After the exam closes)</SelectItem>
                                            <SelectItem value="CUSTOM">Custom Date & Time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customPublishDate">Custom Publish Date (If selected Custom)</Label>
                                    <Input id="customPublishDate" name="customPublishDate" type="datetime-local" className="font-mono text-sm" />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox id="showDetailedLog" name="showDetailedLog" defaultChecked />
                                <Label htmlFor="showDetailedLog" className="font-normal cursor-pointer text-sm">
                                    Show Detailed Log (Students can see exactly what they selected vs the correct answers)
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox id="showCorrectAnswers" name="showCorrectAnswers" defaultChecked />
                                <Label htmlFor="showCorrectAnswers" className="font-normal cursor-pointer text-sm">
                                    Show Correct Answers (If disabled, they only see if they were right/wrong locally)
                                </Label>
                            </div>
                        </div>


                        <div className="space-y-4 pt-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 mb-4">
                                <h3 className="font-bold text-sm text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">4. Select Questions</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">Select questions from the bank. The total marks will be calculated dynamically.</p>
                            <QuestionSelector questions={availableQuestions} />
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 mb-4">
                                <h3 className="font-bold text-sm text-indigo-800 dark:text-indigo-300 uppercase tracking-widest">5. Assign Participants</h3>
                            </div>
                            <p className="text-xs text-muted-foreground">Select which students are allowed to take this exam. If left blank, no one will be able to take it unless it is marked Public.</p>
                            <StudentSelector students={workspaceStudents} />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" size="lg" className="w-full">Create & Publish Exam</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
