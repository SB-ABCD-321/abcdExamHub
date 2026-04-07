import { Suspense } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getLatestWorkspaceRequest } from "@/actions/workspace-request";
import { db } from "@/lib/prisma";
import RequestFormContent from "./request-form-content";


export default async function WorkspaceRequestPage() {
    const { userId } = await auth();
    if (!userId) {
        // Redirect to sign in with return URL
        return redirect("/sign-in?redirect_url=/pricing/request");
    }

    const clerkUser = await currentUser();
    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    
    if (!dbUser) {
        // This should normally not happen if they are logged in via middleware
        return <div>User not found in system.</div>;
    }

    const existingRequest = await getLatestWorkspaceRequest(userId);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pt-28 pb-20 px-6 font-sans antialiased">
            <div className="container mx-auto max-w-5xl">
                <Suspense fallback={<div className="h-[600px] bg-slate-100 dark:bg-zinc-900 animate-pulse rounded-[3rem]" />}>
                    <RequestFormContent 
                        existingRequest={JSON.parse(JSON.stringify(existingRequest))}
                        userEmail={clerkUser?.emailAddresses[0]?.emailAddress || ""}
                        userName={`${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim()}
                        userId={dbUser.id} // NOW USING UUID
                    />
                </Suspense>
            </div>
        </div>
    );
}


