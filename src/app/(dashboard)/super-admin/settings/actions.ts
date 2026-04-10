"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { uploadToCloudinary } from "@/app/actions/upload";

export async function updateSiteSettings(formData: FormData) {
    try {
        let settings = await db.siteSetting.findFirst() as any;
        if (!settings) {
            settings = await db.siteSetting.create({ data: { siteName: "ABCD Exam Hub" } }) as any;
        }

        const logoFile = formData.get("logoFile") as File;
        const faviconFile = formData.get("faviconFile") as File;
        const aboutUsImageFile = formData.get("aboutUsImageFile") as File;
        const heroRightImageFile = formData.get("heroRightImageFile") as File;

        let logoUrl = formData.get("logoUrl") as string;
        let faviconUrl = formData.get("faviconUrl") as string;
        let aboutUsImageUrl = formData.get("aboutUsImageUrl") as string;
        let heroRightImageUrl = formData.get("heroRightImageUrl") as string;

        if (logoFile && logoFile.size > 0) {
            logoUrl = await uploadToCloudinary(logoFile, "branding") as string;
        }
        if (faviconFile && faviconFile.size > 0) {
            faviconUrl = await uploadToCloudinary(faviconFile, "branding") as string;
        }
        if (aboutUsImageFile && aboutUsImageFile.size > 0) {
            aboutUsImageUrl = await uploadToCloudinary(aboutUsImageFile, "marketing") as string;
        }
        if (heroRightImageFile && heroRightImageFile.size > 0) {
            heroRightImageUrl = await uploadToCloudinary(heroRightImageFile, "marketing") as string;
        }

        const data = {
            siteName: (formData.get("siteName") as string) ?? settings.siteName,
            siteDescription: (formData.get("siteDescription") as string) ?? settings.siteDescription,
            logoUrl: logoUrl ?? settings.logoUrl,
            faviconUrl: faviconUrl ?? settings.faviconUrl,
            primaryColor: (formData.get("primaryColor") as string) ?? settings.primaryColor,
            secondaryColor: (formData.get("secondaryColor") as string) ?? settings.secondaryColor,
            bannerText: (formData.get("bannerText") as string) ?? settings.bannerText,
            mobileNo: (formData.get("mobileNo") as string) ?? settings.mobileNo,
            whatsappNo: (formData.get("whatsappNo") as string) ?? settings.whatsappNo,
            email: (formData.get("email") as string) ?? settings.email,
            location: (formData.get("location") as string) ?? settings.location,
            facebookUrl: (formData.get("facebookUrl") as string) ?? settings.facebookUrl,
            twitterUrl: (formData.get("twitterUrl") as string) ?? settings.twitterUrl,
            linkedinUrl: (formData.get("linkedinUrl") as string) ?? settings.linkedinUrl,
            instagramUrl: (formData.get("instagramUrl") as string) ?? settings.instagramUrl,
            youtubeUrl: (formData.get("youtubeUrl") as string) ?? settings.youtubeUrl,
            threadsUrl: (formData.get("threadsUrl") as string) ?? settings.threadsUrl,
            tiktokUrl: (formData.get("tiktokUrl") as string) ?? settings.tiktokUrl,
            githubUrl: (formData.get("githubUrl") as string) ?? settings.githubUrl,
            heroTopTitle: (formData.get("heroTopTitle") as string) ?? settings.heroTopTitle,
            heroTitle: (formData.get("heroTitle") as string) ?? settings.heroTitle,
            heroSubtitle: (formData.get("heroSubtitle") as string) ?? settings.heroSubtitle,
            heroVideoUrl: (formData.get("heroVideoUrl") as string) ?? settings.heroVideoUrl,
            heroRightImageUrl: heroRightImageUrl ?? settings.heroRightImageUrl,
            aboutUsTitle: (formData.get("aboutUsTitle") as string) ?? settings.aboutUsTitle,
            aboutUsText: (formData.get("aboutUsText") as string) ?? settings.aboutUsText,
            aboutUsImageUrl: aboutUsImageUrl ?? settings.aboutUsImageUrl,
            whyUsText: (formData.get("whyUsText") as string) ?? settings.whyUsText,
            footerText: (formData.get("footerText") as string) ?? settings.footerText,
            footerDescription: (formData.get("footerDescription") as string) ?? settings.footerDescription,
            pricingTitle: (formData.get("pricingTitle") as string) ?? settings.pricingTitle,
            pricingSubtitle: (formData.get("pricingSubtitle") as string) ?? settings.pricingSubtitle,
            showHeroStats: formData.get("showHeroStats") === "on",
            statExamsCount: formData.get("statExamsCount") ? parseInt(formData.get("statExamsCount") as string) : null,
            statTeachersCount: formData.get("statTeachersCount") ? parseInt(formData.get("statTeachersCount") as string) : null,
            statWorkspacesCount: formData.get("statWorkspacesCount") ? parseInt(formData.get("statWorkspacesCount") as string) : null,
            trialDays: formData.get("trialDays") ? parseInt(formData.get("trialDays") as string) : settings.trialDays,
            trialMaxStudents: formData.get("trialMaxStudents") ? parseInt(formData.get("trialMaxStudents") as string) : settings.trialMaxStudents,
            trialMaxTeachers: formData.get("trialMaxTeachers") ? parseInt(formData.get("trialMaxTeachers") as string) : settings.trialMaxTeachers,
            trialMaxExams: formData.get("trialMaxExams") ? parseInt(formData.get("trialMaxExams") as string) : settings.trialMaxExams,
            trialAiLimit: formData.get("trialAiLimit") ? parseInt(formData.get("trialAiLimit") as string) : settings.trialAiLimit,
            freeMaxStudents: formData.get("freeMaxStudents") ? parseInt(formData.get("freeMaxStudents") as string) : settings.freeMaxStudents,
            freeMaxTeachers: formData.get("freeMaxTeachers") ? parseInt(formData.get("freeMaxTeachers") as string) : settings.freeMaxTeachers,
            freeMaxExams: formData.get("freeMaxExams") ? parseInt(formData.get("freeMaxExams") as string) : settings.freeMaxExams,
            freeMaxStudentsPerExam: formData.get("freeMaxStudentsPerExam") ? parseInt(formData.get("freeMaxStudentsPerExam") as string) : settings.freeMaxStudentsPerExam,
            freeAiLimit: formData.get("freeAiLimit") ? parseInt(formData.get("freeAiLimit") as string) : settings.freeAiLimit,
            freeAiQuestionsPerRequest: formData.get("freeAiQuestionsPerRequest") ? parseInt(formData.get("freeAiQuestionsPerRequest") as string) : settings.freeAiQuestionsPerRequest,
            freeMaxQuestions: formData.get("freeMaxQuestions") ? parseInt(formData.get("freeMaxQuestions") as string) : settings.freeMaxQuestions,
            freeMaxConcurrentExams: formData.get("freeMaxConcurrentExams") ? parseInt(formData.get("freeMaxConcurrentExams") as string) : settings.freeMaxConcurrentExams,
            isGstEnabled: formData.get("isGstEnabled") === "on",
            gstRate: formData.get("gstRate") ? parseFloat(formData.get("gstRate") as string) : settings.gstRate,
            resultDetailedAccessDays: formData.get("resultDetailedAccessDays") ? parseInt(formData.get("resultDetailedAccessDays") as string) : settings.resultDetailedAccessDays,
            platformGstNumber: (formData.get("platformGstNumber") as string) ?? settings.platformGstNumber,
            platformPanNumber: (formData.get("platformPanNumber") as string) ?? settings.platformPanNumber,
            platformLegalName: (formData.get("platformLegalName") as string) ?? settings.platformLegalName,
            platformAddress: (formData.get("platformAddress") as string) ?? settings.platformAddress,
            heroTitleFontSize: formData.get("heroTitleFontSize") ? parseInt(formData.get("heroTitleFontSize") as string) : settings.heroTitleFontSize,
            heroTitleMobileFontSize: formData.get("heroTitleMobileFontSize") ? parseInt(formData.get("heroTitleMobileFontSize") as string) : settings.heroTitleMobileFontSize,
            aboutBadge: (formData.get("aboutBadge") as string) ?? settings.aboutBadge,
            aboutFeatures: formData.get("aboutFeatures") ? JSON.parse(formData.get("aboutFeatures") as string) : settings.aboutFeatures,
            processBadge: (formData.get("processBadge") as string) ?? settings.processBadge,
            processTitle: (formData.get("processTitle") as string) ?? settings.processTitle,
            processSteps: formData.get("processSteps") ? JSON.parse(formData.get("processSteps") as string) : settings.processSteps,
            faqBadge: (formData.get("faqBadge") as string) ?? settings.faqBadge,
            contactBadge: (formData.get("contactBadge") as string) ?? settings.contactBadge,
            enterpriseTitle: (formData.get("enterpriseTitle") as string) ?? settings.enterpriseTitle,
            enterpriseDescription: (formData.get("enterpriseDescription") as string) ?? settings.enterpriseDescription,
            pricingPromoTitle: (formData.get("pricingPromoTitle") as string) ?? settings.pricingPromoTitle,
            pricingPromoDescription: (formData.get("pricingPromoDescription") as string) ?? settings.pricingPromoDescription,
            servicesHeroTitle: (formData.get("servicesHeroTitle") as string) ?? settings.servicesHeroTitle,
            servicesHeroSubtitle: (formData.get("servicesHeroSubtitle") as string) ?? settings.servicesHeroSubtitle,
            pricingBadge: (formData.get("pricingBadge") as string) ?? settings.pricingBadge,
            aiConsultantBadge: (formData.get("aiConsultantBadge") as string) ?? settings.aiConsultantBadge,
            servicesBadge: (formData.get("servicesBadge") as string) ?? settings.servicesBadge,
            servicesTypingTexts: formData.get("servicesTypingTexts") ? JSON.parse(formData.get("servicesTypingTexts") as string) : settings.servicesTypingTexts,
            unifiedBadge: (formData.get("unifiedBadge") as string) ?? settings.unifiedBadge,
            engineeringBadge: (formData.get("engineeringBadge") as string) ?? settings.engineeringBadge,
        };


        await db.siteSetting.update({
            where: { id: settings.id },
            data,
        });

        revalidatePath("/");
        revalidatePath("/pricing");
        revalidatePath("/services");
        revalidatePath("/super-admin/settings");

        return { success: true };
    } catch (error: any) {
        console.error("Failed updating settings:", error);
        return { success: false, error: error.message };
    }
}

export async function addBanner(formData: FormData) {
    try {
        const imageFile = formData.get("imageFile") as File;
        let imageUrl = formData.get("imageUrl") as string;
        const title = formData.get("title") as string;
        const subtitle = formData.get("subtitle") as string;
        const linkUrl = formData.get("linkUrl") as string;

        if (imageFile && imageFile.size > 0) {
            imageUrl = await uploadToCloudinary(imageFile, "banners") as string;
        }

        if (!imageUrl) throw new Error("Image URL or file is required");

        await db.banner.create({
            data: {
                imageUrl,
                title,
                subtitle,
                linkUrl,
                order: (await db.banner.count()) + 1,
            }
        });

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteBanner(id: string) {
    try {
        await db.banner.delete({ where: { id } });
        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateBannerStatus(id: string, isActive: boolean) {
    try {
        await db.banner.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addFaq(formData: FormData) {
    try {
        const question = formData.get("question") as string;
        const answer = formData.get("answer") as string;
        const order = parseInt(formData.get("order") as string) || 0;

        if (!question || !answer) throw new Error("Question and Answer are required");

        await db.faq.create({
            data: {
                question,
                answer,
                order,
            }
        });

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteFaq(id: string) {
    try {
        await db.faq.delete({ where: { id } });
        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
export async function upsertDynamicPage(formData: FormData) {
    try {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const slug = formData.get("slug") as string;
        const content = formData.get("content") as string;
        const isActive = formData.get("isActive") === "true";

        if (!title || !slug || !content) throw new Error("Title, Slug and Content are required");

        if (id) {
            if (!(db as any).dynamicPage) throw new Error("DynamicPage model not found in Prisma client");
            await (db as any).dynamicPage.update({
                where: { id },
                data: { title, slug, content, isActive }
            });
        } else {
            if (!(db as any).dynamicPage) throw new Error("DynamicPage model not found in Prisma client");
            await (db as any).dynamicPage.create({
                data: { title, slug, content, isActive }
            });
        }

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteDynamicPage(id: string) {
    try {
        if (!(db as any).dynamicPage) throw new Error("DynamicPage model not found in Prisma client");
        await (db as any).dynamicPage.delete({ where: { id } });
        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addAdvantage(formData: FormData) {
    try {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const order = parseInt(formData.get("order") as string) || 0;

        if (!title || !description) throw new Error("Title and Description are required");

        await (db as any).advantage.create({
            data: { title, description, order }
        });

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteAdvantage(id: string) {
    try {
        await (db as any).advantage.delete({ where: { id } });
        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addService(formData: FormData) {
    try {
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const iconName = formData.get("iconName") as string;
        const iconColor = formData.get("iconColor") as string;
        const isPrimary = formData.get("isPrimary") === "true";
        const order = parseInt(formData.get("order") as string) || 0;
        const features = (formData.get("features") as string)?.split(",").map(f => f.trim()).filter(Boolean) || [];

        if (!title || !description) throw new Error("Title and Description are required");

        await (db as any).service.create({
            data: {
                title,
                description,
                iconName,
                iconColor,
                isPrimary,
                features,
                order
            }
        });

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        revalidatePath("/services");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateService(formData: FormData) {
    try {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const iconName = formData.get("iconName") as string;
        const iconColor = formData.get("iconColor") as string;
        const isPrimary = formData.get("isPrimary") === "true";
        const order = parseInt(formData.get("order") as string) || 0;
        const features = (formData.get("features") as string)?.split(",").map(f => f.trim()).filter(Boolean) || [];

        if (!id) throw new Error("Service ID is required");
        if (!title || !description) throw new Error("Title and Description are required");

        await (db as any).service.update({
            where: { id },
            data: {
                title,
                description,
                iconName,
                iconColor,
                isPrimary,
                features,
                order
            }
        });

        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        revalidatePath("/services");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteService(id: string) {
    try {
        await (db as any).service.delete({ where: { id } });
        revalidatePath("/");
        revalidatePath("/super-admin/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
