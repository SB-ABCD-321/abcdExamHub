import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function PolicyPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const page = (db as any).dynamicPage ? await (db as any).dynamicPage.findUnique({
        where: { slug: params.slug },
    }) : null;

    if (!page || !page.isActive) {
        notFound();
    }

    return (
        <div className="pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6 font-sans">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                            {page.title}
                        </h1>
                        <div className="h-1 w-20 bg-primary rounded-full" />
                    </div>

                    <div className="prose prose-zinc dark:prose-invert max-w-none prose-h1:hidden prose-p:text-zinc-500 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-strong:text-foreground font-medium italic">
                        {/* Render content - assuming markdown or simple text for now */}
                        <div dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
