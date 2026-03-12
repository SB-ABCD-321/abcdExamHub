"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { KeyRound, ArrowRight, Loader2, Lock } from "lucide-react";
import { verifyExamPassword } from "@/actions/exam";
import { toast } from "sonner";

interface PasswordGateProps {
    examId: string;
    title: string;
}

export function PasswordGate({ examId, title }: PasswordGateProps) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await verifyExamPassword(examId, password);
            if (result.success) {
                toast.success("Access granted!");
                // The layout/page will re-render due to revalidatePath
            } else {
                toast.error(result.error || "Invalid password");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="text-center p-8 pb-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/10 animate-pulse">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Protected Content</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-zinc-400 font-medium italic mt-2">
                        "{title}" is a password-protected exam.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <PasswordInput
                                icon={<Lock className="w-4 h-4" />}
                                placeholder="Enter Exam Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 rounded-2xl bg-slate-100/50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-amber-500/20 transition-all font-mono font-bold shadow-sm"
                            />
                            <p className="text-[10px] text-center text-slate-400 font-medium italic mt-4">
                                Contact the examiner if you do not have the password.
                            </p>
                        </div>

                        <Button 
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold tracking-widest shadow-xl shadow-black/10 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>Verify Access <ArrowRight className="w-5 h-5" /></>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
