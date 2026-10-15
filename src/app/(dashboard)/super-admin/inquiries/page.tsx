import { db } from "@/lib/prisma";
import { InquiryManager } from "@/components/shared/InquiryManager";
import { DashboardPage, DashboardHeader, DashboardMetricCard } from "@/components/layout/DashboardTemplate";
import { MessageCircle, Clock, Phone, TrendingUp } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function InquiriesPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({ where: { clerkId: userId } });
    if (!dbUser || dbUser.role !== "SUPER_ADMIN") redirect("/dashboard");

    const inquiries = await db.inquiry.findMany({
        orderBy: { createdAt: "desc" }
    });

    // Analytical metrics calculations
    const totalInquiries = inquiries.length;
    const pendingCount = inquiries.filter(i => i.status === "PENDING").length;
    const processedCount = totalInquiries - pendingCount;
    const phoneLeadsCount = inquiries.filter(i => !!i.phone).length;
    const phoneRate = totalInquiries > 0 ? Math.round((phoneLeadsCount / totalInquiries) * 100) : 0;
    const resolutionRate = totalInquiries > 0 ? Math.round((processedCount / totalInquiries) * 100) : 100;

    return (
        <DashboardPage>
            {/* Standardized Dashboard Template Header */}
            <DashboardHeader
                title={<>Client Leads & <span className="text-primary font-black">Inquiries</span></>}
                subtitle="Review, audit, and follow up with prospective institutions, enterprise demo requests, and inbound leads."
            />

            {/* HIGH-DENSITY ANALYTICAL NUMERIC KPI METRIC CARDS */}
            <div className="grid gap-3.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                <DashboardMetricCard
                    title="Total Leads"
                    value={totalInquiries}
                    subtitle={`${pendingCount} pending review • ${processedCount} processed`}
                    icon={<MessageCircle className="size-4 text-primary" />}
                    badge={
                        pendingCount > 0 ? (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                                {pendingCount} Pending
                            </span>
                        ) : (
                            <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Up to Date
                            </span>
                        )
                    }
                />

                <DashboardMetricCard
                    title="Pending Queue"
                    value={pendingCount}
                    subtitle={pendingCount > 0 ? "Awaiting administrator response" : "All submissions audited"}
                    icon={<Clock className="size-4 text-amber-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {pendingCount > 0 ? "Action Required" : "Zero Backlog"}
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Direct Phone Leads"
                    value={phoneLeadsCount}
                    subtitle={`${phoneRate}% contact phone numbers provided`}
                    icon={<Phone className="size-4 text-emerald-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {phoneLeadsCount} Hot Leads
                        </span>
                    }
                />

                <DashboardMetricCard
                    title="Resolution Rate"
                    value={`${resolutionRate}%`}
                    subtitle={`${processedCount} client leads acknowledged`}
                    icon={<TrendingUp className="size-4 text-indigo-500" />}
                    badge={
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Telemetry
                        </span>
                    }
                />
            </div>

            {/* INQUIRY MANAGEMENT TERMINAL */}
            <div className="w-full">
                <InquiryManager inquiries={inquiries} />
            </div>
        </DashboardPage>
    );
}
