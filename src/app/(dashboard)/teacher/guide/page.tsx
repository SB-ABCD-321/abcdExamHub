import { GuidePage } from "@/components/shared/GuidePage";
import { Role } from "@prisma/client";
import { getGuideByRole } from "@/actions/guide";
import { db } from "@/lib/prisma";

export default async function TeacherGuide() {
    const guide = await getGuideByRole(Role.TEACHER);
    const settings = await db.siteSetting.findFirst();

    return (
        <GuidePage
            title={guide.title}
            description={guide.description || ""}
            icon={guide.icon}
            items={guide.items}
            whatsapp={settings?.whatsappNo || ""}
        />
    );
}
