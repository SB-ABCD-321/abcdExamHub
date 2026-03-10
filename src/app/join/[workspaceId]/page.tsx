import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { joinWorkspaceAction } from "./actions";

export default async function JoinWorkspacePage(props: { params: Promise<{ workspaceId: string }> }) {
    const params = await props.params;
    const workspaceId = params.workspaceId;

    const { userId } = await auth();

    // If not logged in, Clerk will eventually handle it or we force a redirect to sign-in with a callback
    if (!userId) {
        // Construct the full return URL so Clerk sends them back here after signup/login
        const returnUrl = encodeURIComponent(`/join/${workspaceId}`);
        redirect(`/sign-in?redirect_url=${returnUrl}`);
    }

    // Lookup the workspace
    const workspace = await db.workspace.findUnique({
        where: { id: workspaceId },
        include: { students: true }
    });

    if (!workspace) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
                <Card className="max-w-md w-full text-center p-6">
                    <CardTitle className="text-destructive mb-2">Invalid Link</CardTitle>
                    <CardDescription>This workspace invitation link is invalid or has expired.</CardDescription>
                    <Link href="/dashboard" className="mt-4 block">
                        <Button variant="outline">Back to Home</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    // Get the current db user
    const dbUser = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!dbUser) {
        return <div>Error loading user profile.</div>;
    }

    // Check if the user is ALREADY a student in this workspace
    const isAlreadyMember = workspace.students.some(student => student.id === dbUser.id);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">ABCD Exam Hub</h1>
                <p className="text-muted-foreground mt-2">Workspace Invitation</p>
            </div>

            <Card className="max-w-md w-full shadow-lg border-primary/20">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                        {workspace.logoUrl ? (
                            <img src={workspace.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                        ) : (
                            <Building2 className="w-8 h-8 text-primary" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">{workspace.name}</CardTitle>
                    <CardDescription className="mt-2 text-base">
                        {workspace.description || "You have been invited to join this institute as a student."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    {isAlreadyMember ? (
                        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl flex items-center gap-3 border border-green-500/20">
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">You are already a member of this workspace.</p>
                        </div>
                    ) : (
                        <div className="bg-muted p-4 rounded-xl text-sm text-center">
                            By joining, you will be able to access private mock tests and notices published by the teachers of this institute.
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    {isAlreadyMember ? (
                        <Link href="/student" className="w-full">
                            <Button className="w-full">Go to Dashboard</Button>
                        </Link>
                    ) : (
                        <form action={joinWorkspaceAction} className="w-full">
                            <input type="hidden" name="workspaceId" value={workspace.id} />
                            <input type="hidden" name="userId" value={dbUser.id} />
                            <Button type="submit" className="w-full text-base py-6">
                                Accept Invitation & Join
                            </Button>
                        </form>
                    )}
                    <Link href="/dashboard" className="w-full">
                        <Button variant="ghost" className="w-full text-muted-foreground">
                            Cancel
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
