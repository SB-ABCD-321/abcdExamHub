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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Save } from "lucide-react";
import { AutoSaveForm } from "@/components/shared/AutoSaveForm";

export default async function EditExamPage(props: { params: Promise<{ examId: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    // We await params due to Next 15 dynamic router changes
    const params = await props.params;
    const examId = params.examId;

    const dbUser = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            teacherWorkspaces: {
                include: {
                    questions: { orderBy: { createdAt: "desc" } },
                    students: true
                }
            },
            adminWorkspace: true
        }
    });

    if (!dbUser || (dbUser.role !== "TEACHER" && dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
        return <div>Unauthorized</div>;
    }

    // Fetch the exam
    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            questions: true,
            allowedStudents: true
        }
    });

    if (!exam) {
        return <div className="p-8 text-center text-red-500 font-semibold">Exam not found.</div>;
    }

    // Security check
    const isAdminOfThisWorkspace = dbUser.adminWorkspace?.id === exam.workspaceId;
    if (dbUser.role === "TEACHER" && (exam as any).authorId !== dbUser.id) {
        return <div className="p-8 text-center text-red-500 font-semibold">Access Denied: You did not author this exam.</div>;
    }
    if (dbUser.role === "ADMIN" && !isAdminOfThisWorkspace) {
        return <div className="p-8 text-center text-red-500 font-semibold">Access Denied: You do not manage this workspace.</div>;
    }

    // Define workspace
    let workspaceIds = dbUser.teacherWorkspaces.map(w => w.id);
    if (dbUser.role === "ADMIN" && dbUser.adminWorkspace) {
        workspaceIds.push(dbUser.adminWorkspace.id);
    }

    if (workspaceIds.length === 0 && dbUser.role !== "SUPER_ADMIN") return <div>No active workspaces context found.</div>;

    const isPureTeacher = dbUser.role === "TEACHER";

    const questionWhereClause = isPureTeacher ? {
        OR: [
            { workspaceId: exam.workspaceId, authorId: dbUser.id },
            { isPublic: true }
        ]
    } : {
        OR: [
            { workspaceId: exam.workspaceId },
            { isPublic: true }
        ]
    };

    // Fetch available questions from this workspace to attach to the exam
    const availableQuestions = await db.question.findMany({
        where: questionWhereClause,
        include: { topic: true },
        orderBy: { createdAt: "desc" },
    });

    let workspaceStudents = dbUser.teacherWorkspaces.find(w => w.id === exam.workspaceId)?.students || [];
    if (dbUser.role === "SUPER_ADMIN") {
        const ws = await db.workspace.findUnique({
            where: { id: exam.workspaceId },
            include: { students: true }
        });
        if (ws) {
            workspaceStudents = ws.students;
        }
    }

    // Arrays for fast lookup
    const existingQuestionIds = exam.questions.map(eq => eq.questionId);
    const existingStudentIds = exam.allowedStudents.map(s => s.id);

    async function updateExam(formData: FormData) {
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
        const allowPdfDownload = formData.get("allowPdfDownload") === "on";
        const examExperience = formData.get("examExperience") as string || "PREMIUM";

        const startTimeStr = formData.get("startTime") as string;
        const endTimeStr = formData.get("endTime") as string;

        const startTime = startTimeStr ? new Date(startTimeStr) : null;
        const endTime = endTimeStr ? new Date(endTimeStr) : null;
        const customPublishDate = customPublishDateStr ? new Date(customPublishDateStr) : null;

        // Extract IDs from hidden fields (works even if collapsed)
        const selectedQuestionIds = (formData.get("selectedQuestionIds") as string || "").split(",").filter(Boolean);
        if (selectedQuestionIds.length === 0) return; // Must have questions

        const updateData: any = {
            title,
            description,
            passMarks,
            marksPerQuestion,
            duration,
            contactInfo,
            negativeMarksEnabled,
            negativeMarksValue: isNaN(negativeMarksValue) ? 0 : negativeMarksValue,
            startTime,
            endTime,
            isPublic,
            password,
            resultPublishMode: resultPublishMode as any,
            customPublishDate,
            showCorrectAnswers,
            showDetailedLog,
            allowPdfDownload,
            examExperience: examExperience as any
        };

        const selectedStudentIds = (formData.get("selectedStudentIds") as string || "").split(",").filter(Boolean);
        updateData.allowedStudents = {
            set: selectedStudentIds.map(id => ({ id }))
        };

        // Update exam details and resync students
        await db.exam.update({
            where: { id: examId },
            data: updateData
        });

        // Delete all old question links
        await db.examQuestion.deleteMany({
            where: { examId: examId }
        });

        // Link new questions to the exam in a high-performance batch
        await db.examQuestion.createMany({
            data: selectedQuestionIds.map(qId => ({
                examId: examId,
                questionId: qId
            }))
        });

        redirect(`/teacher/exams?success=updated`);
    }

    const formatDateForInput = (date: Date | null) => {
        if (!date) return "";
        // Use a consistent ISO format but slice it for datetime-local
        // To avoid hydration mismatch, we'll keep it simple or suppress warning
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Exam</h1>
                <p className="text-muted-foreground">Modify core parameters and update questions for this assessment.</p>
            </div>

            <Card className="border-none shadow-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8">
                    <CardTitle className="text-xl font-bold">Exam Configuration</CardTitle>
                    <CardDescription>Update the branding and delivery settings for your test.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pb-12">
                    <form action={updateExam} className="space-y-8">
                        <AutoSaveForm storageKey={`exam-edit-draft-${exam.id}`} />

                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                <h3 className="font-bold text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-[0.2em]">General Details</h3>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-bold text-sm">Exam Title (Required)</Label>
                                    <Input id="title" name="title" required defaultValue={exam.title} placeholder="E.g., Mid-Term Mathematics II" className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="font-bold text-sm">Time Limit (Minutes)</Label>
                                    <Input id="duration" name="duration" type="number" min={1} required defaultValue={exam.duration} placeholder="60" className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-bold text-sm">Instructions</Label>
                                <Textarea id="description" name="description" defaultValue={exam.description || ""} placeholder="Brief standard instructions for students..." className="min-h-[100px] rounded-xl border-slate-200 dark:border-zinc-800" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="passMarks" className="font-bold text-sm">Pass Marks Target</Label>
                                    <Input id="passMarks" name="passMarks" type="number" min={0} required defaultValue={exam.passMarks} placeholder="40" className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="marksPerQuestion" className="font-bold text-sm">Marks per Question</Label>
                                    <Input id="marksPerQuestion" name="marksPerQuestion" type="number" step="0.5" defaultValue={exam.marksPerQuestion} min={0} required className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                            </div>
                        </div>

                        {/* Questions Section (Core) */}
                        <div className="space-y-4 pt-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                <h3 className="font-bold text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-[0.2em]">Select Questions</h3>
                            </div>
                            <QuestionSelector questions={availableQuestions} initialSelected={existingQuestionIds} storageKey={`exam-edit-draft-${exam.id}`} />
                        </div>

                        {/* Advanced Options Accordion */}
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="advanced" className="border-none">
                                <AccordionTrigger className="flex items-center gap-2 group hover:no-underline px-4 py-3 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-800 transition-all">
                                    <div className="flex items-center gap-2" suppressHydrationWarning>
                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center border border-slate-200 dark:border-zinc-800 group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors" suppressHydrationWarning>
                                            <Save className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm uppercase tracking-widest" suppressHydrationWarning>Advanced Options & Participation</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-6 space-y-8 px-2" forceMount>
                                    <input type="hidden" name="advanced_options_present" value="true" />
                                    
                                    {/* Timing */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Scheduling</h4>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="startTime" className="font-bold text-xs">Start Date & Time (Optional)</Label>
                                                <Input id="startTime" name="startTime" type="datetime-local" defaultValue={formatDateForInput(exam.startTime)} className="h-12 rounded-xl" suppressHydrationWarning />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endTime" className="font-bold text-xs">End Date & Time (Optional)</Label>
                                                <Input id="endTime" name="endTime" type="datetime-local" defaultValue={formatDateForInput(exam.endTime)} className="h-12 rounded-xl" suppressHydrationWarning />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exam Experience Mode */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Exam Experience</h4>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-xs">Student Interface Mode</Label>
                                            <Select name="examExperience" defaultValue={(exam as any).examExperience || "PREMIUM"}>
                                                <SelectTrigger className="h-12 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BOTH">Student Can Choose (Classic / Premium)</SelectItem>
                                                    <SelectItem value="PREMIUM">Enforce Premium Mode</SelectItem>
                                                    <SelectItem value="CLASSIC">Enforce Classic Mode</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Negative Marking */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Negative Marking</h4>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="negativeMarksEnabled" name="negativeMarksEnabled" defaultChecked={exam.negativeMarksEnabled} suppressHydrationWarning />
                                                <Label htmlFor="negativeMarksEnabled" className="text-sm cursor-pointer">Enable Penalty</Label>
                                            </div>
                                            <div className="flex-1 max-w-[200px]">
                                                <Select name="negativeMarksValue" defaultValue={exam.negativeMarksValue.toString()}>
                                                    <SelectTrigger className="h-10 rounded-xl">
                                                        <SelectValue placeholder="Penalty Amount" />
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
                                    </div>

                                    {/* Result Publishing */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Result Publishing</h4>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="font-bold text-xs">Publish Mode</Label>
                                                <Select name="resultPublishMode" defaultValue={exam.resultPublishMode}>
                                                    <SelectTrigger className="h-12 rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="INSTANT">Instant (After submission)</SelectItem>
                                                        <SelectItem value="EXAM_END">Exam End Time</SelectItem>
                                                        <SelectItem value="CUSTOM">Custom Date & Time</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="font-bold text-xs">Custom Date (if selected)</Label>
                                                <Input id="customPublishDate" name="customPublishDate" type="datetime-local" defaultValue={formatDateForInput(exam.customPublishDate)} className="h-12 rounded-xl" suppressHydrationWarning />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="showDetailedLog" name="showDetailedLog" defaultChecked={exam.showDetailedLog} suppressHydrationWarning />
                                                <Label htmlFor="showDetailedLog" className="text-sm cursor-pointer italic">Allow students to see full results breakdown</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="showCorrectAnswers" name="showCorrectAnswers" defaultChecked={exam.showCorrectAnswers} suppressHydrationWarning />
                                                <Label htmlFor="showCorrectAnswers" className="text-sm cursor-pointer italic">Show correct options in review</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="allowPdfDownload" name="allowPdfDownload" defaultChecked={(exam as any).allowPdfDownload} suppressHydrationWarning />
                                                <Label htmlFor="allowPdfDownload" className="text-sm cursor-pointer italic">Allow students to download PDF of results</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Participants */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Assigned Participants</h4>
                                        <div className="flex items-center space-x-2 mb-4">
                                            <Checkbox id="isPublic" name="isPublic" defaultChecked={exam.isPublic} suppressHydrationWarning />
                                            <Label htmlFor="isPublic" className="font-bold text-sm text-indigo-600 cursor-pointer">Make this Exam Public (Ignore individual assignments)</Label>
                                        </div>
                                        <StudentSelector students={workspaceStudents} initialSelectedIds={existingStudentIds} storageKey={`exam-edit-draft-${exam.id}`} />
                                    </div>

                                    {/* Security */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Access Security</h4>
                                        <PasswordInput id="password" name="password" defaultValue={exam.password || ""} placeholder="Passphrase for private exams" className="h-12 rounded-xl" />
                                        <Input id="contactInfo" name="contactInfo" defaultValue={exam.contactInfo || ""} placeholder="Contact email for support" className="h-12 rounded-xl" />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                            <Button type="submit" size="lg" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                                Update & Save Assessment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}