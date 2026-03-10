// Guide page for Workspace Admins
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, Users, QrCode, Cpu, Settings, GraduationCap } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function WorkspaceAdminGuidePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== Role.ADMIN) redirect("/dashboard");

    const dynamicGuides = await db.userGuide.findMany({
        where: { role: Role.ADMIN },
        orderBy: [{ order: "asc" }]
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Workspace Admin <span className="text-primary">Guide</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Comprehensive documentation on managing your institute's teachers, students, and resources.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-zinc-200 shadow-sm dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Institute Operations
                        </CardTitle>
                        <CardDescription>
                            Learn how to invite users, manage rosters, and allocate AI credits.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {/* Dynamic Guides from DB */}
                            {dynamicGuides.map((guide, index) => (
                                <AccordionItem key={guide.id} value={`dynamic-${index}`}>
                                    <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Settings className="w-4 h-4 text-muted-foreground" />
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
                                                <QrCode className="w-4 h-4 text-muted-foreground" />
                                                Inviting New Users
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Invites</strong> tab is where you generate secure enrollment links for your faculty and student body.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Generate Links:</strong> You can create specialized invitation links that automatically assign the correct role (Teacher or Student) upon registration.</li>
                                                <li><strong>Capacity Limits:</strong> Be aware of your Workspace's maximum capacity. If you invite more Teachers or Students than your plan allows, they will be blocked from joining. Contact the Super Admin to raise your limits.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-2">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                Managing Teachers
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Teachers</strong> tab provides a roster of all active faculty members in your institute.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Review Activity:</strong> View how many questions, exams, and AI queries each teacher has performed.</li>
                                                <li><strong>Remove Access:</strong> If a teacher leaves your institute, you can remove them from the roster directly from this table.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-3">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="w-4 h-4 text-muted-foreground" />
                                                Allocating AI Credits
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                Your Workspace has a shared pool of AI credits granted by the Super Admin. You must distribute these credits wisely among your teachers.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>Inside the <strong>Teachers</strong> roster, click the AI action button to open the allocation modal.</li>
                                                <li>Set a strict numerical limit preventing a single teacher from monopolizing the Workspace's entire AI budget.</li>
                                                <li>Teachers will be blocked from generating new AI questions once they hit their personal assigned limit.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-4">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                                Monitoring Students
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Students</strong> tab lists all enrolled learners.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Performance Tracking:</strong> Quickly glance at the number of exams a student has participated in.</li>
                                                <li><strong>Roster Management:</strong> Safely remove inactive or graduated students to free up space against your Workspace capacity limit.</li>
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
                                <span className="text-primary font-bold block mb-1">Track Notice Board</span>
                                Check the Notices tab frequently. Super Admins may broadcast important updates.
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <span className="text-primary font-bold block mb-1">Capacity Planning</span>
                                If you are approaching your Max Student limit, consider removing inactive legacy accounts before a new enrollment season.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
