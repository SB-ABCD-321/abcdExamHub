import SupportContent from "./support-content";
import { getSupportSettings } from "./actions";

export const revalidate = 300;

export default async function SupportPage() {
    const settings = await getSupportSettings();
    return (
        <SupportContent initialSettings={settings} />
    );
}
