import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, BarChart3, Medal, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/prisma";

export default async function GuestThankYouPage(props: { params: Promise<{ examId: string }> }) {
    const { examId } = await props.params;
    
    const exam = await db.exam.findUnique({
        where: { id: examId },
        select: { title: true }
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 selection:bg-indigo-500/30">
            <div className="w-full max-w-2xl">
                {/* Success Banner */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] overflow-hidden border border-slate-100 dark:border-zinc-800/60 p-8 sm:p-12 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                    
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                        Exam Submitted Successfully!
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium text-lg mb-2">
                        Your responses for <span className="font-bold text-slate-700 dark:text-slate-300">{exam?.title || "the assessment"}</span> have been securely recorded.
                    </p>
                    <p className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mt-6">
                        You may now close this window.
                    </p>
                </div>

                {/* Promotional Upsell */}
                <div className="mt-8 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2.5rem] p-1 border-4 border-white/50 dark:border-zinc-800/50 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-3xl rounded-full group-hover:bg-white/20 transition-all duration-700"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 blur-3xl rounded-full group-hover:bg-white/20 transition-all duration-700"></div>
                    
                    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-[2.2rem] p-8 sm:p-10 relative z-10 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <Lock className="w-5 h-5 text-indigo-100" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Unlock Your Full Results</h2>
                        </div>
                        
                        <p className="text-indigo-100/90 font-medium mb-8 leading-relaxed max-w-lg">
                            As a guest, your results are stored securely but hidden. Create a free account  to instantly unlock your performance data and see how you stacked up against others.
                        </p>

                        <div className="grid sm:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center gap-2">
                                <BarChart3 className="w-6 h-6 text-indigo-200" />
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Deep Analytics</span>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center gap-2">
                                <Medal className="w-6 h-6 text-amber-300" />
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Merit Rank</span>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center text-center gap-2">
                                <FileText className="w-6 h-6 text-emerald-300" />
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">PDF Report</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/sign-up" className="flex-1">
                                <Button className="w-full h-14 rounded-xl bg-white text-indigo-700 hover:bg-slate-50 font-black tracking-widest uppercase transition-all shadow-xl shadow-black/10">
                                    Create Free Account
                                </Button>
                            </Link>
                            <Link href="/sign-in" className="flex-1">
                                <Button variant="outline" className="w-full h-14 rounded-xl font-bold tracking-widest uppercase bg-white/10 hover:bg-white/20 text-white border-white/20 transition-all flex items-center justify-center gap-2">
                                    Existing User Log In <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
