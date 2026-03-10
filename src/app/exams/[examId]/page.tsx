import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, CheckCircle2 } from "lucide-react";

export default async function ExamIntroPage({ params }: { params: { examId: string } }) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const { examId } = await params;

    const exam = await db.exam.findUnique({
        where: { id: examId },
        include: {
            workspace: true,
            _count: { select: { questions: true } }
        }
    });

    if (!exam) return <div>Exam not found.</div>;

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full border-primary/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

                <CardHeader className="text-center pb-8 pt-10">
                    <Badge className="w-fit mx-auto mb-4">{exam.workspace.name}</Badge>
                    <CardTitle className="text-3xl md:text-4xl font-extrabold">{exam.title}</CardTitle>
                    <CardDescription className="text-base mt-2 max-w-lg mx-auto">
                        {exam.description || "Please read the instructions carefully before starting the exam."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="grid sm:grid-cols-3 gap-6 mb-8 pt-4 border-t">
                    <div className="flex flex-col items-center justify-center text-center p-4 bg-background rounded-xl border">
                        <Clock className="h-6 w-6 text-primary mb-2" />
                        <div className="font-semibold">{exam.duration} Mins</div>
                        <div className="text-xs text-muted-foreground mt-1">Time Limit</div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center p-4 bg-background rounded-xl border">
                        <FileText className="h-6 w-6 text-primary mb-2" />
                        <div className="font-semibold">{exam._count.questions}</div>
                        <div className="text-xs text-muted-foreground mt-1">Total Questions</div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center p-4 bg-background rounded-xl border">
                        <CheckCircle2 className="h-6 w-6 text-primary mb-2" />
                        <div className="font-semibold">{exam.passMarks} Pts</div>
                        <div className="text-xs text-muted-foreground mt-1">Required to Pass</div>
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-4 border-t bg-muted/10 p-6">
                    <p className="text-sm text-center text-muted-foreground max-w-md mx-auto">
                        Once you start the exam, the timer will begin. Ensure you have a stable internet connection.
                    </p>

                    {/* In a real implementation this would Navigate to the Active Exam view */}
                    <Button size="lg" className="w-full sm:w-auto px-12 h-14 text-lg">
                        Begin Assessment Now
                    </Button>

                    {exam.contactInfo && (
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            For support contact: {exam.contactInfo}
                        </p>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    )
}
