import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, BookOpen, ClipboardList, Target, Cpu, FileQuestion, GraduationCap } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function TeacherGuidePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== Role.TEACHER) redirect("/dashboard");

    const dynamicGuides = await db.userGuide.findMany({
        where: { role: Role.TEACHER },
        orderBy: [{ order: "asc" }]
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Teacher <span className="text-primary">Guide</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Comprehensive documentation on authoring questions, creating exams, and utilizing AI assistance.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-zinc-200 shadow-sm dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            Academic Operations
                        </CardTitle>
                        <CardDescription>
                            Learn how to build your academic content library and assess student performance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {/* Dynamic Guides from DB */}
                            {dynamicGuides.map((guide, index) => (
                                <AccordionItem key={guide.id} value={`dynamic-${index}`}>
                                    <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                            {guide.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                        <div
                                            className="prose dark:prose-invert max-w-none text-sm"
                                            dangerouslySetInnerHTML={{ __html: guide.content }}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}

                            {/* Legacy Content Fallback */}
                            {dynamicGuides.length === 0 && (
                                <>
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                Building the Question Bank
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Question Bank</strong> is your central repository. Questions created here can be reused across any number of future exams.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Manual Creation:</strong> You can author multiple-choice questions from scratch, defining custom alternatives and selecting the single correct answer.</li>
                                                <li><strong>Categorization:</strong> Ensure you label your questions accurately to make them easy to discover when assembling an exam.</li>
                                                <li><strong>Visibility:</strong> Questions authored in your Workspace are isolated and cannot be seen by Teachers in other Workspaces.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-2">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="w-4 h-4 text-muted-foreground" />
                                                Using AI Generation
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                To accelerate content creation, you can ask the ABCD Exam Hub's built-in <strong>Gemini AI</strong> to generate bulk questions for you.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>Inside the Question Bank, select the <strong>Generate Options</strong> command.</li>
                                                <li>Enter a specific topic (e.g. "Photosynthesis") and a desired difficulty level.</li>
                                                <li>The AI will generate valid multiple choice alternatives. Review them carefully before saving them to the bank.</li>
                                                <li><strong>Credit Limits:</strong> Your AI usage is restricted by your Workspace Admin. If you run out of credits, you must manually author questions or contact your Administrator.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-3">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                                                Creating and Managing Exams
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Exams</strong> tab is where you assemble questions into formally graded assessments.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Exam Parameters:</strong> You define the strict timing windows (Start/End times), passing thresholds, total duration limits, and scoring rubrics (including optional negative marking).</li>
                                                <li><strong>Visibility Toggle:</strong> An exam must explicitly be toggled to <strong>Visible</strong> before any Student can access it. Use the hidden state for drafting.</li>
                                                <li><strong>Question Selection:</strong> Add questions to the exam directly from your Question Bank using the integrated search panel.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-4">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Target className="w-4 h-4 text-muted-foreground" />
                                                Reviewing Results
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                Once an exam has commenced, you monitor participation and review submissions.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Real-time Tracking:</strong> Navigate to the specific Exam details page to track how many students have submitted.</li>
                                                <li><strong>Submission Analysis:</strong> Click on an individual student's log to review exactly which questions they answered correctly or incorrectly.</li>
                                                <li><strong>Pass/Fail Status:</strong> The platform automatically calculates their score and final status based on the passing threshold you defined.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </>
                            )}
                        </Accordion>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-primary/20 bg-primary/5 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-primary font-bold">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm font-medium">
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <span className="text-primary font-bold block mb-1">Preview Exams</span>
                                Always do a dry run of your exam configuration to ensure questions are rendering clearly before toggling visibility for the Students.
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <span className="text-primary font-bold block mb-1">Verify AI Accuracy</span>
                                The AI model can occasionally introduce subtle hallucinations. Always double check AI-generated answers for factual soundness before committing them to the exam.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
