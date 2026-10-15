import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const revalidate = 300;

export default async function PoliciesIndexPage() {
    const firstPage = (db as any).dynamicPage
        ? await (db as any).dynamicPage.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "asc" }
        })
        : null;

    if (firstPage?.slug) {
        redirect(`/policies/${firstPage.slug}`);
    }

    redirect("/policies/terms-conditions");
}
