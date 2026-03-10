import { db } from "@/lib/prisma";
import { InquiryManager } from "@/components/shared/InquiryManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const runtime = "nodejs";

export default async function InquiriesPage() {
    const inquiries = await db.inquiry.findMany({
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Inquiries <span className="text-primary">and Leads</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Review and manage incoming inquiries from prospective institutes and clients.
                </p>
            </div>

            <InquiryManager inquiries={inquiries} />
        </div>
    );
}
