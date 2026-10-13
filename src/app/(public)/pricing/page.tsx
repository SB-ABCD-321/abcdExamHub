import PricingContent from "./pricing-content";
import { getPricingPlans, getPricingSettings } from "@/actions/pricing";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
    const [plans, settings] = await Promise.all([
        getPricingPlans(),
        getPricingSettings()
    ]);

    return (
        <PricingContent
            initialPlans={plans as any}
            initialSettings={settings as any}
        />
    );
}
