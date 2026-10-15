import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/prisma";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
    ]);
}

export const getSiteSettings = cache(
    unstable_cache(
        async () => {
            try {
                return await withTimeout(
                    db.siteSetting.findFirst().catch(() => null),
                    2500,
                    null
                );
            } catch (error) {
                return null;
            }
        },
        ["site-settings"],
        { revalidate: 300, tags: ["site-settings"] }
    )
);

export const getPublicNavData = cache(
    unstable_cache(
        async () => {
            try {
                const queryPromise = Promise.all([
                    db.siteSetting.findFirst().catch(() => null),
                    (db as any).navbarItem
                        ? (db as any).navbarItem.findMany({
                              where: { isActive: true },
                              orderBy: { order: "asc" },
                          }).catch(() => [])
                        : Promise.resolve([]),
                    (db as any).dynamicPage
                        ? (db as any).dynamicPage.findMany({
                              where: { isActive: true },
                              select: { title: true, slug: true },
                          }).catch(() => [])
                        : Promise.resolve([]),
                ]);

                const [settings, navbarItems, dynamicPages] = await withTimeout(
                    queryPromise,
                    2500,
                    [null, [], []]
                );

                return { settings, navbarItems, dynamicPages };
            } catch (error) {
                return { settings: null, navbarItems: [], dynamicPages: [] };
            }
        },
        ["public-nav-data"],
        { revalidate: 300, tags: ["public-nav-data", "site-settings"] }
    )
);
