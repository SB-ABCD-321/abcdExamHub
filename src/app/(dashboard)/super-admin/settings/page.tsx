import { db } from "@/lib/prisma";
import GlobalSettingsForm from "./settings-form";

export default async function GlobalSettingsPage() {
    let settings = await db.siteSetting.findFirst();
    if (!settings) {
        settings = await db.siteSetting.create({ data: { siteName: "ABCD Exam Hub" } });
    }

    const banners = (db as any).banner ? await (db as any).banner.findMany({ orderBy: { order: 'asc' } }) : [];
    const faqs = (db as any).faq ? await (db as any).faq.findMany({ orderBy: { order: 'asc' } }) : [];
    const pricingPlans = (db as any).pricingPlan ? await (db as any).pricingPlan.findMany({ orderBy: { order: 'asc' } }) : [];
    const advantages = (db as any).advantage ? await (db as any).advantage.findMany({ orderBy: { order: 'asc' } }) : [];
    const services = (db as any).service ? await (db as any).service.findMany({ orderBy: { order: 'asc' } }) : [];
    const dynamicPages = (db as any).dynamicPage ? await (db as any).dynamicPage.findMany({ orderBy: { createdAt: 'asc' } }) : [];
    const userGuides = (db as any).userGuide ? await (db as any).userGuide.findMany({
        orderBy: [
            { role: 'asc' },
            { order: 'asc' }
        ]
    }) : [];

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <GlobalSettingsForm
                initialSettings={settings}
                banners={banners}
                faqs={faqs}
                pricingPlans={pricingPlans}
                advantages={advantages}
                services={services}
                dynamicPages={dynamicPages}
                userGuides={userGuides}
            />
        </div>
    )
}
