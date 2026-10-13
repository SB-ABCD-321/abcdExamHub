import SupportContent from "./support-content";
import { getSupportSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
    const settings = await getSupportSettings();
    return (
        <SupportContent initialSettings={settings} />
    );
}
