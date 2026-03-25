import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, BarChart } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ThankYouPage(props: { params: Promise<{ examId: string }> }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-lg" />
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-slate-900 dark:text-white">Exam Successfully Submitted!</h1>
            <p className="text-muted-foreground mb-8 text-lg">Thank you for completing the assessment. Your answers have been securely saved.</p>
            <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/student">
                    <Button size="lg" className="rounded-xl font-bold px-8 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Home className="mr-2 w-5 h-5" /> Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
