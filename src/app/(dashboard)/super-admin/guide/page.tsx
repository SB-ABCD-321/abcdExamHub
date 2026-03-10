// Main guide for platform management
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookMarked, Shield, Building2, Terminal, Users, Cpu, Settings } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function SuperAdminGuidePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== Role.SUPER_ADMIN) redirect("/dashboard");

    const isDeveloper = dbUser.email === process.env.DEVELOPER_EMAIL;
    const dynamicGuides = await db.userGuide.findMany({
        where: { role: Role.SUPER_ADMIN },
        orderBy: [{ order: "asc" }]
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-16">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Super Admin <span className="text-primary">Guide</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Comprehensive A to Z documentation on managing the ABCD Exam Hub platform.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-zinc-200 shadow-sm dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Platform Operations
                        </CardTitle>
                        <CardDescription>
                            Detailed instructions for managing users, workspaces, and system limits.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {/* Dynamic Guides from DB */}
                            {dynamicGuides.map((guide, index) => (
                                <AccordionItem key={guide.id} value={`dynamic-${index}`}>
                                    <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-4 h-4 text-muted-foreground" />
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

                            {/* Legacy/Static Guides (Optional: only if DB is empty or as base guides) */}
                            {dynamicGuides.length === 0 && (
                                <>
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                                How to Manage Workspaces
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Workspaces</strong> tab allows you to monitor all registered institutes on the platform.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Viewing Stats:</strong> Each workspace card displays the total number of registered Teachers, Students, and Exams created.</li>
                                                <li><strong>Applying Restrictions:</strong> Click on the AI Limit / Settings badge to open the <strong>Workspace Configuration</strong> modal.</li>
                                                <li><strong>Capacity Limits:</strong> You can define the maximum number of Teachers and Students allowed in that workspace. If they exceed this limit, the system will block them from adding new users.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-2">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Cpu className="w-4 h-4 text-muted-foreground" />
                                                Managing AI Credits
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                AI Question Generation is a premium feature. As a Super Admin, you control how many generations each workspace is allowed to perform.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li>Inside the <strong>Workspaces</strong> configuration modal, you will see a field for <strong>AI Limit</strong>.</li>
                                                <li>Enter a strict numerical limit, or check the <strong>Unlimited</strong> toggle to remove the restriction entirely.</li>
                                                <li>Once a workspace receives their total allocation, their Workspace Admin can distribute those credits among their individual teachers.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-3">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                User Roles & Demotions
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                The <strong>Users</strong> tab lists every individual who has authenticated with the platform, regardless of their workspace.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Global Search:</strong> Use the search bar to locate a user by name or email.</li>
                                                <li><strong>Action Menu:</strong> Click the three dots (...) next to a user to manage their privileges.</li>
                                                <li><strong>Demotion:</strong> If a Workspace Admin is behaving maliciously, you can instantly revoke their powers and demote them to a standard Student.</li>
                                                <li><strong>Deletion:</strong> You can permanently delete a user from the platform, which will purge all their exam records.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="item-4">
                                        <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Settings className="w-4 h-4 text-muted-foreground" />
                                                Platform Settings & Notices
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                            <p>
                                                Use the <strong>Site Settings</strong> tab to modify global configuration like pricing plans or contact parameters.
                                            </p>
                                            <ul className="list-disc pl-5 space-y-2">
                                                <li><strong>Global Notices:</strong> In the <strong>Notices</strong> tab, you can broadcast urgent messages.</li>
                                                <li><strong>Targeting:</strong> You can choose to target ALL users on the platform, or restrict the notice to only be visible to Workspace Admins or Teachers.</li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </>
                            )}

                            {/* Developer Only Section */}
                            {isDeveloper && (
                                <AccordionItem value="developer-only">
                                    <AccordionTrigger className="text-left font-semibold text-base py-4 hover:no-underline hover:text-primary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Terminal className="w-4 h-4 text-muted-foreground" />
                                            Developer Privileges
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed space-y-4 pt-2 pb-6 px-1">
                                        <p>
                                            Certain critical actions are reserved EXCLUSIVELY for the original platform Developer. Standard Super Admins cannot perform these actions.
                                        </p>
                                        <ul className="list-disc pl-5 space-y-2">
                                            <li><strong>Super Admin Promotion:</strong> Only the developer can elevate another user to the Super Admin role.</li>
                                            <li><strong>Developer Dashboard:</strong> The hidden Developer Dashboard provides access to cache clearing, direct database synchronizations, and system log exports.</li>
                                            <li>If you encounter an issue that requires a system reset, you must contact the platform developer.</li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
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
                                <span className="text-primary font-bold block mb-1">Check Usage Regularly</span>
                                Monitor the AI consumption of your workspaces to ensure they aren't exhausting the platform's Gemini budget.
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <span className="text-primary font-bold block mb-1">Respond to Inquiries</span>
                                Keep an eye on the Inquiries and Bookings tabs. Unread messages will display a red notification badge on the sidebar.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
