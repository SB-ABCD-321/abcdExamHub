import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileDown, Calendar, ChevronRight, Scale, ShieldCheck, ClipboardCheck, Info } from "lucide-react";

export default async function PolicyPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    
    // Fetch all active pages for navigation
    const allPages = (db as any).dynamicPage ? await (db as any).dynamicPage.findMany({
        where: { isActive: true },
        select: { id: true, title: true, slug: true },
        orderBy: { createdAt: 'asc' }
    }) : [];

    const page = allPages.find((p: any) => p.slug === params.slug);

    if (!page) {
        // Double check in DB just in case
        const dbPage = (db as any).dynamicPage ? await (db as any).dynamicPage.findUnique({
            where: { slug: params.slug },
        }) : null;
        if (!dbPage || !dbPage.isActive) notFound();
    }

    // Re-fetch the full page data if needed
    const pageData = (db as any).dynamicPage ? await (db as any).dynamicPage.findUnique({
        where: { slug: params.slug },
    }) : null;

    if (!pageData) notFound();

    const getIcon = (title: string) => {
        const lower = title.toLowerCase();
        if (lower.includes('privacy')) return <ShieldCheck className="w-4 h-4" />;
        if (lower.includes('terms')) return <Scale className="w-4 h-4" />;
        if (lower.includes('refund')) return <ClipboardCheck className="w-4 h-4" />;
        return <Info className="w-4 h-4" />;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 pt-32 pb-20 font-sans">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12">
                
                {/* Desktop Side Navigation */}
                <aside className="md:col-span-3 lg:col-span-3 hidden md:block">
                    <div className="sticky top-40 space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                <span className="w-4 h-[1px] bg-slate-200" /> Platform Policies
                            </h3>
                            <nav className="space-y-1">
                                {allPages.map((navPage: any) => (
                                    <Link 
                                        key={navPage.id}
                                        href={`/policies/${navPage.slug}`}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all group relative overflow-hidden",
                                            params.slug === navPage.slug 
                                                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                                : "text-slate-500 hover:text-primary hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                        )}
                                    >
                                        {getIcon(navPage.title)}
                                        {navPage.title}
                                        {params.slug !== navPage.slug && (
                                            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                        )}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Need Clarity?</h4>
                            <p className="text-[10px] font-semibold text-slate-500 leading-relaxed mb-4">
                                For any questions regarding our legal framework, please reach out to our compliance department.
                            </p>
                            <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Support Hub</Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="md:col-span-9 lg:col-span-9 space-y-12">
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                                    <span className="w-8 h-[2px] bg-primary rounded-full" /> 
                                    Institutional Governance
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                                    {pageData.title}
                                </h1>
                                <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Effective: {new Date(pageData.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Active Version
                                    </span>
                                </div>
                            </div>

                            {pageData.fileUrl && (
                                <a 
                                    href={pageData.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-4 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-200 dark:shadow-none"
                                >
                                    <FileDown className="w-4 h-4" /> Download Official PDF
                                </a>
                            )}
                        </div>

                        <div className="w-full h-[1px] bg-zinc-100 dark:bg-zinc-800" />
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none prose-h1:text-2xl prose-h1:font-black prose-h2:text-xl prose-h2:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed text-justify">
                        <div dangerouslySetInnerHTML={{ __html: pageData.content.replace(/\n/g, '<br/>') }} />
                    </div>

                    <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-[10px] font-bold text-slate-400 text-center sm:text-left leading-relaxed max-w-md uppercase tracking-widest">
                            © {new Date().getFullYear()} ABCD Exam Hub. All rights reserved. These documents are subject to periodic updates.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary h-10 px-6 rounded-xl border border-primary/20 flex items-center justify-center hover:bg-primary/5 transition-all">Homepage</span>
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

