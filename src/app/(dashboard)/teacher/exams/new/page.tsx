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
import { Save, AlertTriangle } from "lucide-react";
import { AutoSaveForm } from "@/components/shared/AutoSaveForm";
import { AutoQuestionGenerator } from "@/components/shared/AutoQuestionGenerator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default async function CreateExamPage(props: { searchParams: Promise<{ error?: string, mode?: string, max?: string }> }) {
    const searchParams = await props.searchParams;
    const mode = searchParams.mode || 'manual';
    const isAutoMode = mode === 'auto';
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

    // Fetch students
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

    // Map Topics for Generator
    const topicMap = new Map();
    availableQuestions.forEach(q => {
        if (!topicMap.has(q.topicId)) {
            topicMap.set(q.topicId, { id: q.topicId, name: q.topic?.name || 'Unknown', max: 0 });
        }
        topicMap.get(q.topicId).max += 1;
    });
    const availableTopics = Array.from(topicMap.values());

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
        const accessType = formData.get("accessType") as string || "WORKSPACE_PRIVATE";
        const password = formData.get("password") as string || null;
        const creationMode = formData.get("creationMode") as string || "manual";

        if (accessType === "OPEN_GUEST" && (!password || password.trim() === "")) {
            redirect(`/teacher/exams/new?error=missing_password&mode=${creationMode}`);
        }

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

        // Process Questions (Auto Generate OR Manual)
        const autoGenConfigStr = formData.get("autoGenConfig") as string;
        let finalQuestionIds: string[] = [];

        if (creationMode === "auto" && autoGenConfigStr) {
            try {
                const config = JSON.parse(autoGenConfigStr) as {topicId: string, quantity: number}[];
                
                config.forEach(rule => {
                    const topicQs = availableQuestions.filter(q => q.topicId === rule.topicId);
                    // Shuffle array safely outside React
                    for (let i = topicQs.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [topicQs[i], topicQs[j]] = [topicQs[j], topicQs[i]];
                    }
                    const picked = topicQs.slice(0, rule.quantity).map(q => q.id);
                    finalQuestionIds.push(...picked);
                });
            } catch (e) {
                 redirect(`/teacher/exams/new?error=auto_gen_failed&mode=${creationMode}`);
            }
        } else {
            // Extract IDs from hidden fields
            finalQuestionIds = (formData.get("selectedQuestionIds") as string || "").split(",").filter(Boolean);
        }

        // Strictly enforce deduplication on all picked question IDs
        finalQuestionIds = Array.from(new Set(finalQuestionIds));

        if (finalQuestionIds.length === 0) {
            redirect(`/teacher/exams/new?error=no_questions&mode=${creationMode}`);
        }

        const selectedStudentIds = (formData.get("selectedStudentIds") as string || "").split(",").filter(Boolean);

        // Check workspace exam limit
        const workspace = await db.workspace.findUnique({
            where: { id: primaryWorkspaceId },
            include: { _count: { select: { exams: true } } }
        });

        if (workspace && workspace._count.exams >= workspace.maxExams) {
            redirect(`/teacher/exams?error=limit_reached&max=${workspace.maxExams}`);
        }

        const newExam = await db.exam.create({
            data: {
                title,
                description,
                contactInfo: contactInfo || null,
                passMarks,
                marksPerQuestion,
                negativeMarksEnabled: negativeMarksEnabled,
                negativeMarksValue: isNaN(negativeMarksValue) ? 0 : negativeMarksValue,
                duration,
                startTime: startTime,
                endTime: endTime,
                isPublic: accessType === "GLOBAL_PUBLIC" || accessType === "OPEN_GUEST",
                accessType: accessType as any,
                password: password || null,
                resultPublishMode: resultPublishMode as any,
                customPublishDate: customPublishDate,
                showCorrectAnswers: showCorrectAnswers,
                showDetailedLog: showDetailedLog,
                allowPdfDownload: allowPdfDownload,
                examExperience: examExperience as any,
                workspaceId: primaryWorkspaceId,
                authorId: dbUser!.id,
                allowedStudents: {
                    connect: selectedStudentIds.map(id => ({ id }))
                }
            } as any
        });

        await db.examQuestion.createMany({
            data: finalQuestionIds.map(qId => ({
                examId: newExam.id,
                questionId: qId
            }))
        });

        const { revalidatePath } = require("next/cache");
        revalidatePath("/teacher/exams");
        revalidatePath("/teacher/exams/new");

        redirect(`/teacher/exams?success=created`);
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {isAutoMode ? "Quick Auto-Assessment" : "Schedule New Exam"}
                </h1>
                <p className="text-muted-foreground">
                    {isAutoMode 
                        ? "Configure topics and quantities to instantly generate an exam using the question bank." 
                        : "Define core exam parameters and manually build your assessment."}
                </p>
            </div>

            {searchParams.error === 'no_questions' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">Cannot create exam without questions! Please select minimum 1 question.</p>
                </div>
            )}
            
            {searchParams.error === 'missing_password' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">A Passphrase is strictly required when creating an Open/Guest exam. Please set a password below.</p>
                </div>
            )}

            {searchParams.error === 'auto_gen_failed' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="font-bold text-sm">Auto-Generation failed. Please try adding the chapter rules again.</p>
                </div>
            )}

            {searchParams.error === 'limit_reached' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 rounded-xl p-4 mb-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm">Workspace Exam Limit Reached</p>
                        <p className="text-xs font-medium">You have hit your max capacity of {searchParams.max} exams for this workspace plan.</p>
                    </div>
                </div>
            )}

            <Card className="border-none shadow-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-zinc-800 p-8">
                    <CardTitle className="text-xl font-bold">Exam Configuration</CardTitle>
                    <CardDescription>Fill in the required details to launch your assessment.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pb-12">
                    <form action={createExam} className="space-y-8">
                        <AutoSaveForm storageKey="exam-create-draft" />

                        <div className="space-y-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                                <h3 className="font-bold text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-[0.2em]">General Details</h3>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-bold text-sm">Exam Title (Required)</Label>
                                    <Input id="title" name="title" required placeholder="E.g., Mid-Term Mathematics II" className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration" className="font-bold text-sm">Time Limit (Minutes)</Label>
                                    <Input id="duration" name="duration" type="number" min={1} required placeholder="60" className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="font-bold text-sm">Instructions</Label>
                                <Textarea id="description" name="description" placeholder="Brief standard instructions for students..." className="min-h-[100px] rounded-xl border-slate-200 dark:border-zinc-800" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="passMarks" className="font-bold text-sm">Pass Marks Target</Label>
                                    <Input id="passMarks" name="passMarks" type="number" min={0} required placeholder="40" className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="marksPerQuestion" className="font-bold text-sm">Marks per Question</Label>
                                    <Input id="marksPerQuestion" name="marksPerQuestion" type="number" step="0.5" defaultValue="1" min={0} required className="h-12 rounded-xl border-slate-200 dark:border-zinc-800" />
                                </div>
                            </div>
                        </div>

                        {/* Questions Section (Core) */}
                        <div className="space-y-6 pt-4">
                            {isAutoMode ? (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/30">
                                    <h3 className="font-bold text-xs text-indigo-800 dark:text-indigo-300 uppercase tracking-[0.2em] mb-4">Exam Generation Rules</h3>
                                    <AutoQuestionGenerator topics={availableTopics} />
                                </div>
                            ) : (
                                <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-[2rem] border border-slate-200 dark:border-zinc-800">
                                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-[0.2em] mb-4">Manual Selection</h4>
                                    <QuestionSelector questions={availableQuestions} storageKey="exam-create-draft" />
                                </div>
                            )}
                        </div>

                        {/* Hidden input to preserve mode on server action */}
                        <input type="hidden" name="creationMode" value={mode} />

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
                                                <Input id="startTime" name="startTime" type="datetime-local" className="h-12 rounded-xl" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endTime" className="font-bold text-xs">End Date & Time (Optional)</Label>
                                                <Input id="endTime" name="endTime" type="datetime-local" className="h-12 rounded-xl" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Exam Experience Mode */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Exam Experience</h4>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-xs">Student Interface Mode</Label>
                                            <Select name="examExperience" defaultValue="PREMIUM">
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
                                                <Checkbox id="negativeMarksEnabled" name="negativeMarksEnabled" suppressHydrationWarning />
                                                <Label htmlFor="negativeMarksEnabled" className="text-sm cursor-pointer">Enable Penalty</Label>
                                            </div>
                                            <div className="flex-1 max-w-[200px]">
                                                <Select name="negativeMarksValue" defaultValue="0">
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
                                                <Select name="resultPublishMode" defaultValue="INSTANT">
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
                                                <Input id="customPublishDate" name="customPublishDate" type="datetime-local" className="h-12 rounded-xl" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 pt-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="showDetailedLog" name="showDetailedLog" defaultChecked />
                                                <Label htmlFor="showDetailedLog" className="text-sm cursor-pointer italic">Allow students to see full results breakdown & download PDF</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="showCorrectAnswers" name="showCorrectAnswers" defaultChecked />
                                                <Label htmlFor="showCorrectAnswers" className="text-sm cursor-pointer italic">Show correct options in review</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="allowPdfDownload" name="allowPdfDownload" defaultChecked />
                                                <Label htmlFor="allowPdfDownload" className="text-sm cursor-pointer italic">Allow students to download PDF of results</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Participants & Access */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Access Control & Participants</h4>
                                        <div className="bg-slate-50 dark:bg-zinc-900 rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-zinc-800">
                                            <RadioGroup name="accessType" defaultValue="WORKSPACE_PRIVATE" className="gap-6">
                                                <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors border-2 border-transparent">
                                                    <RadioGroupItem value="SELECTED_STUDENTS" id="acc_selected" className="mt-1" />
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="acc_selected" className="font-bold text-sm cursor-pointer">Selected Students Only</Label>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Only workspace students explicitly selected below can take this exam.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors border-2 border-transparent">
                                                    <RadioGroupItem value="WORKSPACE_PRIVATE" id="acc_private" className="mt-1" />
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="acc_private" className="font-bold text-sm cursor-pointer">Workspace Private (Default)</Label>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Any student actively enrolled in this workspace has full access.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors border-2 border-transparent">
                                                    <RadioGroupItem value="GLOBAL_PUBLIC" id="acc_public" className="mt-1" />
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="acc_public" className="font-bold text-sm cursor-pointer">Global Public (Login Required)</Label>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Any valid logged-in user on the entire platform can take it if they have the link.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30">
                                                    <RadioGroupItem value="OPEN_GUEST" id="acc_open" className="mt-1" />
                                                    <div className="grid gap-1.5">
                                                        <Label htmlFor="acc_open" className="font-black text-sm text-indigo-700 dark:text-indigo-400 cursor-pointer uppercase tracking-wide">Open / Guest Global</Label>
                                                        <p className="text-xs text-indigo-900/70 dark:text-indigo-300 font-bold leading-relaxed">No login required! Just a link and a password. Automatically collects Full Name & Mobile Number from walk-in users.</p>
                                                    </div>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                        <StudentSelector students={workspaceStudents} />
                                    </div>

                                    {/* Security */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Entry Security</h4>
                                        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-900/50 mb-4">
                                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed"><AlertTriangle className="w-4 h-4 inline mr-1 mb-0.5"/> A Passphrase is <b>MANDATORY</b> if you select Open/Guest Access.</p>
                                        </div>
                                        <PasswordInput id="password" name="password" placeholder="Passphrase for private or guest exams" className="h-12 rounded-xl" />
                                        <Input id="contactInfo" name="contactInfo" placeholder="Support Email / Phone for this exam" className="h-12 rounded-xl" />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                            <Button type="submit" size="lg" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                                Create & Launch Assessment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
