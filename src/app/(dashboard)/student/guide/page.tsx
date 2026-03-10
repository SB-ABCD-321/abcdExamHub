import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, ClipboardList, Target, BookOpen, Clock, Activity } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function StudentGuidePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== Role.STUDENT) redirect("/dashboard");

    const dynamicGuides = await db.userGuide.findMany({
        where: { role: Role.STUDENT },
        orderBy: [{ order: "asc" }]
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Student <span className="text-primary">Guide</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    A complete walkthrough on how to take exams and review your academic progress.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-zinc-200 shadow-sm dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Platform Usage
                        </CardTitle>
                        <CardDescription>
                            Everything you need to know about the examination lifecycle.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {/* Dynamic Guides from DB */}
                            {dynamicGuides.map((guide, index) => (
                                <AccordionItem key={guide.id} value={`dynamic-${index}`}>
                                    <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-4 h-4 text-muted-foreground" />
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
                                                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                                                Finding and Accessing Exams
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Exams</strong> tab lists all active assessments created by the faculty in your institute workspaces.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Dashboard View:</strong> Your primary dashboard provides quick shortcuts to Upcoming Exams right from the front page.</li>
                                                <li><strong>Availability Windows:</strong> Exams are strictly timed. You must initiate the exam before its designated "End Time". If the clock expires, you will miss the assignment.</li>
                                                <li><strong>Instructions:</strong> Clicking on an exam will first reveal important instructions (e.g., negative marking penalties). Read them carefully before pressing Start.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-2">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                Taking the Exam
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                Once you begin an exam, you enter a locked assessment flow.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Countdown Timer:</strong> The system enforces a strict duration limit. The clock does not pause if you refresh your browser or leave the page.</li>
                                                <li><strong>Auto-Submission:</strong> If the timer hits 0:00, your progress will be automatically saved and submitted immediately.</li>
                                                <li><strong>Confirmation:</strong> If you finish early, review all your answers before explicitly clicking the Submit button. You cannot retry an exam once submitted.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-3">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Target className="w-4 h-4 text-muted-foreground" />
                                                Reviewing Results
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                Upon completing an exam, you can track your historical performance.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Immediate Feedback:</strong> Depending on the teacher's settings, your score and pass/fail status are generated immediately. Navigate to the <strong>Results</strong> tab to view your log.</li>
                                                <li><strong>Answer Key Analysis:</strong> Click into an individual result card to review exactly which choices were correct and which you missed. Use this diagnostic view to improve your understanding of the curriculum.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-4">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Activity className="w-4 h-4 text-muted-foreground" />
                                                Multi-Workspace Support
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                If you are enrolled in multiple different institutes (Workspaces) on the ABCD Exam Hub, your dashboard automatically aggregates all your active assignments.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>You don't need to sign out and sign back in to switch contexts.</li>
                                                <li>However, notice that Results and Exams will be labeled by the Workspace that authored them to maintain organization.</li>
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
                                <span className="text-primary font-bold block mb-1">Check Your Notifications</span>
                                If a teacher extends a deadline, publishes a new exam, or releases graded results, you may receive a system Notice outlining the change.
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <span className="text-primary font-bold block mb-1">Stable Internet Connection</span>
                                Ensure you are on a robust Wi-Fi connection when taking long exams to prevent desynchronization from the timer server.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
