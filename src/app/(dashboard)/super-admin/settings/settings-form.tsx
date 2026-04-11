"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Trash2, Plus, GripVertical, Settings2, Globe, Megaphone, Contact, Play,
    HelpCircle, CreditCard, ShieldCheck, Zap, ImagePlus, ArrowRight,
    Facebook, Twitter, Linkedin, Instagram, Youtube, Github,
    Smartphone, MessageCircle, X, FileText, Globe2, BookMarked,
    ChevronRight, BookOpen, Building2, Terminal, GraduationCap,
    Star, Sparkles, Compass, Rocket, AlertCircle,
    History as HistoryIcon
} from "lucide-react";
import {
    updateSiteSettings, addBanner, deleteBanner, updateBannerStatus, addFaq, deleteFaq,
    upsertDynamicPage, deleteDynamicPage, addAdvantage, deleteAdvantage, addService, updateService, deleteService
} from "./actions";
import { cn } from "@/lib/utils";
import { getIconByName } from "@/lib/icons";
import Link from "next/link";

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19.25 19.25L15.35 15.35M17.15 17.15C18.65 15.65 19.25 13.6 18.95 11.55C18.45 8.1 15.65 5.3 12.2 4.8C10.15 4.5 8.1 5.1 6.6 6.6C5.1 8.1 4.5 10.15 4.8 12.2C5.3 15.65 8.1 18.45 11.55 18.95C13.6 19.25 15.65 18.65 17.15 17.15Z" />
    </svg>
);

import { PricingPlanForm } from "@/components/super-admin/pricing-form";
import { deletePricingPlan } from "@/actions/pricing";
import { UserGuideManager } from "@/components/super-admin/UserGuideManager";
import { DEFAULT_GUIDES } from "@/lib/guide-defaults";

function SocialLinkInput({
    name,
    label,
    defaultValue,
    icon: Icon,
    placeholder
}: {
    name: string;
    label: string;
    defaultValue: string;
    icon: any;
    placeholder?: string;
}) {
    const [value, setValue] = useState(defaultValue || "");

    return (
        <div className="space-y-2 group">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 opacity-70" /> {label}
                </span>
                {value && (
                    <button
                        type="button"
                        onClick={() => setValue("")}
                        className="text-red-500 transition-opacity hover:underline"
                    >
                        Clear
                    </button>
                )}
            </Label>
            <Input
                name={name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder || `https://${label.toLowerCase()}.com/username`}
                className="bg-background border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 h-9 text-xs"
            />
        </div>
    );
}

export default function GlobalSettingsForm({
    initialSettings,
    banners,
    faqs,
    pricingPlans,
    advantages,
    services,
    dynamicPages,
    userGuides,
}: {
    initialSettings: any;
    banners: any[];
    faqs: any[];
    pricingPlans: any[];
    advantages: any[];
    services: any[];
    dynamicPages: any[];
    userGuides: any[];
}) {
    const [isPending, startTransition] = useTransition();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [siteName, setSiteName] = useState(initialSettings?.siteName || "");
    const [footerDescription, setFooterDescription] = useState(initialSettings?.footerDescription || "");
    const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || "");
    const [faviconUrl, setFaviconUrl] = useState(initialSettings?.faviconUrl || "");
    const [aboutUsImageUrl, setAboutUsImageUrl] = useState(initialSettings?.aboutUsImageUrl || "");
    const [heroRightImageUrl, setHeroRightImageUrl] = useState(initialSettings?.heroRightImageUrl || "");
    const [aboutFeatures, setAboutFeatures] = useState<string[]>(Array.isArray(initialSettings?.aboutFeatures) ? initialSettings.aboutFeatures : []);
    const [processSteps, setProcessSteps] = useState<any[]>(Array.isArray(initialSettings?.processSteps) ? initialSettings.processSteps : []);
    const [servicesTypingTexts, setServicesTypingTexts] = useState<string[]>(Array.isArray(initialSettings?.servicesTypingTexts) ? initialSettings.servicesTypingTexts : ["Exam Solution", "Question Making", "AI Using"]);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const aboutUsInputRef = useRef<HTMLInputElement>(null);
    const heroRightInputRef = useRef<HTMLInputElement>(null);

    async function handleSettingsSubmit(formData: FormData) {
        const logoFile = formData.get("logoFile") as File;
        const faviconFile = formData.get("faviconFile") as File;
        const aboutUsImageFile = formData.get("aboutUsImageFile") as File;
        const heroRightImageFile = formData.get("heroRightImageFile") as File;

        // Validation limits
        const LOGO_LIMIT = 2 * 1024 * 1024; // 2MB
        const FAVICON_LIMIT = 512 * 1024; // 512KB
        const ABOUT_LIMIT = 5 * 1024 * 1024; // 5MB
        const HERO_LIMIT = 2 * 1024 * 1024; // 2MB

        if (logoFile && logoFile.size > LOGO_LIMIT) {
            toast.error("Logo must be smaller than 2MB");
            return;
        }

        if (faviconFile && faviconFile.size > 0) {
            if (faviconFile.size > FAVICON_LIMIT) {
                toast.error("Favicon must be smaller than 512KB");
                return;
            }
            if (!faviconFile.type.includes("image/x-icon") && !faviconFile.type.includes("image/png") && !faviconFile.type.includes("image/vnd.microsoft.icon")) {
                toast.error("Favicon must be .ico or .png format");
                return;
            }
        }

        if (aboutUsImageFile && aboutUsImageFile.size > ABOUT_LIMIT) {
            toast.error("About Us image must be smaller than 5MB");
            return;
        }

        if (heroRightImageFile && heroRightImageFile.size > HERO_LIMIT) {
            toast.error("Hero illustration must be smaller than 2MB");
            return;
        }

        startTransition(async () => {
            const res = await updateSiteSettings(formData);
            if (res?.success) {
                toast.success("Settings updated successfully.");
            } else {
                toast.error(res?.error || "Failed to update settings.");
            }
        });
    }

    const tabStyles = "rounded-xl px-4 py-2 text-xs font-bold tracking-tight transition-all data-[state=active]:bg-zinc-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-zinc-950 flex items-center gap-2";

    if (!isMounted) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 font-sans">
                    Site <span className="text-primary">Management</span>
                </h1>
                <p className="text-muted-foreground font-medium text-sm md:text-base max-w-xl">
                    Configure global platform intelligence and marketing visibility.
                </p>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b overflow-hidden">
                    <div className="overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                        <TabsList className="bg-transparent h-auto p-0 flex gap-2 min-w-max">
                            <TabsTrigger value="branding" className={tabStyles}>
                                <Settings2 className="w-4 h-4" /> Branding
                            </TabsTrigger>
                            <TabsTrigger value="marketing" className={tabStyles}>
                                <Megaphone className="w-4 h-4" /> Marketing
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className={tabStyles}>
                                <Contact className="w-4 h-4" /> Contacts
                            </TabsTrigger>
                            <TabsTrigger value="faq" className={tabStyles}>
                                <HelpCircle className="w-4 h-4" /> FAQ
                            </TabsTrigger>
                            <TabsTrigger value="pricing" className={tabStyles}>
                                <CreditCard className="w-4 h-4" /> Pricing
                            </TabsTrigger>
                            <TabsTrigger value="trials" className={tabStyles}>
                                <Zap className="w-4 h-4" /> Workspace Trials
                            </TabsTrigger>
                            <TabsTrigger value="freeplan" className={tabStyles}>
                                <Zap className="w-4 h-4" /> Free Plan
                            </TabsTrigger>
                            <TabsTrigger value="advantages" className={tabStyles}>
                                <ShieldCheck className="w-4 h-4" /> Why Us
                            </TabsTrigger>
                            <TabsTrigger value="services" className={tabStyles}>
                                <Zap className="w-4 h-4" /> Services
                            </TabsTrigger>
                            <TabsTrigger value="pages" className={tabStyles}>
                                <FileText className="w-4 h-4" /> Pages
                            </TabsTrigger>
                            <TabsTrigger value="guides" className={tabStyles}>
                                <BookMarked className="w-4 h-4" /> User Guides
                            </TabsTrigger>
                            <TabsTrigger value="policies" className={tabStyles}>
                                <ShieldCheck className="w-4 h-4" /> Platform Policies
                            </TabsTrigger>
                            <TabsTrigger value="billing" className={tabStyles}>
                                <CreditCard className="w-4 h-4" /> Platform Billing
                            </TabsTrigger>
                            <TabsTrigger value="offline-payments" className={tabStyles}>
                                <CreditCard className="w-4 h-4" /> Offline Payments
                            </TabsTrigger>
                            <TabsTrigger value="advanced" className={tabStyles}>
                                <Settings2 className="w-4 h-4" /> Advanced Content
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        form="settings-form"
                        className="bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 font-bold px-8 h-10 rounded-xl shadow-sm w-full md:w-auto"
                    >
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                <form id="settings-form" action={handleSettingsSubmit} className="space-y-8">
                    <TabsContent value="branding" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Brand Identity</CardTitle>
                                <CardDescription className="text-xs font-medium">Fundamental configuration for platform appearance.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-2 group">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                                            Platform Name
                                            {siteName && (
                                                <button type="button" onClick={() => setSiteName("")} className="text-[10px] text-red-500 hover:underline transition-opacity">Clear</button>
                                            )}
                                        </Label>
                                        <Input
                                            name="siteName"
                                            value={siteName}
                                            onChange={(e) => setSiteName(e.target.value)}
                                            className="bg-background border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Footer Description</Label>
                                        <Textarea
                                            name="footerDescription"
                                            value={footerDescription}
                                            onChange={(e) => setFooterDescription(e.target.value)}
                                            placeholder="The ultimate digital assessment platform..."
                                            className="bg-background border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 h-24 resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Primary (Gold)</Label>
                                            <Input name="primaryColor" type="color" defaultValue={initialSettings?.primaryColor || "#D4AF37"} className="h-10 cursor-pointer p-1" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Secondary (Black)</Label>
                                            <Input name="secondaryColor" type="color" defaultValue={initialSettings?.secondaryColor || "#000000"} className="h-10 cursor-pointer p-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-6 pt-6 border-t font-sans">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-2"><ImagePlus className="w-3.5 h-3.5" /> Platform Logo</span>
                                                {logoUrl && (
                                                    <button type="button" onClick={() => setLogoUrl("")} className="text-[10px] text-red-500 hover:underline transition-opacity">Clear Current Logo</button>
                                                )}
                                            </Label>
                                            <div className="flex items-center gap-4">
                                                {logoUrl && (
                                                    <div className="w-16 h-16 rounded-lg border bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center p-2">
                                                        <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-1">
                                                    <Input
                                                        ref={logoInputRef}
                                                        name="logoFile"
                                                        type="file"
                                                        accept="image/*"
                                                        className="bg-background cursor-pointer h-10 py-1.5 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { if (logoInputRef.current) logoInputRef.current.value = ""; }}
                                                        className="text-[9px] text-zinc-500 hover:text-zinc-700 underline"
                                                    >
                                                        Clear Selection
                                                    </button>
                                                </div>
                                            </div>
                                            <Input name="logoUrl" type="hidden" value={logoUrl} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-2"><ImagePlus className="w-3.5 h-3.5" /> Favicon Asset</span>
                                                {faviconUrl && (
                                                    <button type="button" onClick={() => setFaviconUrl("")} className="text-[10px] text-red-500 hover:underline transition-opacity">Clear Current Favicon</button>
                                                )}
                                            </Label>
                                            <div className="flex items-center gap-4">
                                                {faviconUrl && (
                                                    <div className="w-10 h-10 rounded border bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center p-1.5">
                                                        <img src={faviconUrl} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-1">
                                                    <Input
                                                        ref={faviconInputRef}
                                                        name="faviconFile"
                                                        type="file"
                                                        accept="image/x-icon,image/png"
                                                        className="bg-background cursor-pointer h-10 py-1.5 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { if (faviconInputRef.current) faviconInputRef.current.value = ""; }}
                                                        className="text-[9px] text-zinc-500 hover:text-zinc-700 underline"
                                                    >
                                                        Clear Selection
                                                    </button>
                                                </div>
                                            </div>
                                            <Input name="faviconUrl" type="hidden" value={faviconUrl} />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-400">
                                            <Globe className="w-4 h-4" /> Social Connectivity
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <SocialLinkInput name="facebookUrl" label="Facebook" defaultValue={initialSettings?.facebookUrl} icon={Facebook} />
                                            <SocialLinkInput name="twitterUrl" label="Twitter (X)" defaultValue={initialSettings?.twitterUrl} icon={X} />
                                            <SocialLinkInput name="linkedinUrl" label="LinkedIn" defaultValue={initialSettings?.linkedinUrl} icon={Linkedin} />
                                            <SocialLinkInput name="instagramUrl" label="Instagram" defaultValue={initialSettings?.instagramUrl} icon={Instagram} />
                                            <SocialLinkInput name="youtubeUrl" label="YouTube" defaultValue={initialSettings?.youtubeUrl} icon={Youtube} />
                                            <SocialLinkInput name="githubUrl" label="GitHub" defaultValue={initialSettings?.githubUrl} icon={Github} />
                                            <SocialLinkInput name="tiktokUrl" label="TikTok" defaultValue={initialSettings?.tiktokUrl} icon={TikTokIcon} />
                                            <SocialLinkInput name="threadsUrl" label="Threads" defaultValue={initialSettings?.threadsUrl} icon={ThreadsIcon} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="marketing" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Marketing & Narrative</CardTitle>
                                <CardDescription className="text-xs font-medium">Messaging used to attract and convert users.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Hero Badge / Top Title</Label>
                                        <Input name="heroTopTitle" defaultValue={(initialSettings as any)?.heroTopTitle} placeholder="Smart Exam Solutions" className="bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-2"><ImagePlus className="w-3.5 h-3.5" /> Hero Right Image</span>
                                            {heroRightImageUrl && (
                                                <button type="button" onClick={() => setHeroRightImageUrl("")} className="text-[10px] text-red-500 hover:underline transition-opacity">Clear Current Image</button>
                                            )}
                                        </Label>
                                        <div className="flex items-center gap-4">
                                            {heroRightImageUrl && (
                                                <div className="w-16 h-16 rounded-lg border bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center p-2">
                                                    <img src={heroRightImageUrl} alt="Hero Preview" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            )}
                                            <Input name="heroRightImageFile" type="file" accept="image/*" className="bg-background cursor-pointer h-10 py-1.5 flex-1" />
                                        </div>
                                        <Input name="heroRightImageUrl" type="hidden" value={heroRightImageUrl} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Hero Section Title</Label>
                                        <Input name="heroTitle" defaultValue={initialSettings?.heroTitle} className="bg-background" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Desktop Font Size (px)</Label>
                                            <Input name="heroTitleFontSize" type="number" defaultValue={(initialSettings as any)?.heroTitleFontSize || 80} className="bg-background" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Mobile Font Size (px)</Label>
                                            <Input name="heroTitleMobileFontSize" type="number" defaultValue={(initialSettings as any)?.heroTitleMobileFontSize || 40} className="bg-background" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Hero Subtitle / Description</Label>
                                    <Textarea name="heroSubtitle" defaultValue={initialSettings?.heroSubtitle} className="min-h-[100px] resize-none" />
                                </div>
                                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t">
                                    <div className="col-span-3 mb-2 space-y-1">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Hero Stats Configuration</Label>
                                        <div className="flex items-center gap-2 mt-2">
                                            <input type="checkbox" id="showHeroStats" name="showHeroStats" defaultChecked={initialSettings?.showHeroStats !== false} className="w-4 h-4 cursor-pointer accent-primary" />
                                            <Label htmlFor="showHeroStats" className="text-sm cursor-pointer">Show Dynamic Stats on Landing Page</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Leave counts blank below to use actual dynamic database numbers.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Override Exams Count</Label>
                                        <Input name="statExamsCount" type="number" defaultValue={initialSettings?.statExamsCount || ""} placeholder="Auto" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Override Teachers Count</Label>
                                        <Input name="statTeachersCount" type="number" defaultValue={initialSettings?.statTeachersCount || ""} placeholder="Auto" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Override Workspaces Count</Label>
                                        <Input name="statWorkspacesCount" type="number" defaultValue={initialSettings?.statWorkspacesCount || ""} placeholder="Auto" />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-8 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pricing Section Title</Label>
                                        <Input name="pricingTitle" defaultValue={initialSettings?.pricingTitle} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pricing Section Subtitle</Label>
                                        <Input name="pricingSubtitle" defaultValue={initialSettings?.pricingSubtitle} />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-8 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">About Us Section Title</Label>
                                        <Input name="aboutUsTitle" defaultValue={initialSettings?.aboutUsTitle} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-2"><ImagePlus className="w-3.5 h-3.5" /> About Section Image</span>
                                            {aboutUsImageUrl && (
                                                <button type="button" onClick={() => setAboutUsImageUrl("")} className="text-[10px] text-red-500 hover:underline transition-opacity">Clear Current Image</button>
                                            )}
                                        </Label>
                                        <div className="flex items-center gap-4">
                                            {aboutUsImageUrl && (
                                                <div className="w-16 h-16 rounded-lg border bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center p-2">
                                                    <img src={aboutUsImageUrl} alt="About Preview" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            )}
                                            <Input name="aboutUsImageFile" type="file" accept="image/*" className="bg-background cursor-pointer h-10 py-1.5 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 flex-1" />
                                        </div>
                                        <Input name="aboutUsImageUrl" type="hidden" value={aboutUsImageUrl} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Detailed About Us Text</Label>
                                    <Textarea name="aboutUsText" defaultValue={initialSettings?.aboutUsText} className="min-h-[150px] resize-none" />
                                </div>

                                <div className="pt-8 border-t space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Play className="w-4 h-4 text-primary" />
                                        <h4 className="text-sm font-bold uppercase tracking-widest">Hero Background Banners</h4>
                                    </div>
                                    <BannerManager banners={banners} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="contacts" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Global Communication</CardTitle>
                                <CardDescription className="text-xs font-medium">Contact information displayed throughout the ecosystem.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-8 pt-6 border-t font-sans">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Official Support Email</Label>
                                    <Input name="email" defaultValue={initialSettings?.email} type="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contact Phone / Mobile</Label>
                                    <Input name="mobileNo" defaultValue={initialSettings?.mobileNo} type="tel" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">WhatsApp Business No</Label>
                                    <Input name="whatsappNo" defaultValue={initialSettings?.whatsappNo} />
                                </div>
                                <div className="sm:col-span-2 space-y-2 border-t pt-4">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Headquarters Address</Label>
                                    <Textarea name="location" defaultValue={initialSettings?.location} className="resize-none border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trials" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Workspace Trial Defaults</CardTitle>
                                <CardDescription className="text-xs font-medium">Define the limits automatically granted to newly joined institute workspaces.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Trial Expiration (Days)</Label>
                                        <Input name="trialDays" type="number" defaultValue={initialSettings?.trialDays ?? 7} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Max Included Students</Label>
                                        <Input name="trialMaxStudents" type="number" defaultValue={initialSettings?.trialMaxStudents ?? 50} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Max Included Teachers</Label>
                                        <Input name="trialMaxTeachers" type="number" defaultValue={initialSettings?.trialMaxTeachers ?? 1} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Max Total Exams</Label>
                                        <Input name="trialMaxExams" type="number" defaultValue={initialSettings?.trialMaxExams ?? 5} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Monthly AI Credit Limits</Label>
                                        <Input name="trialAiLimit" type="number" defaultValue={initialSettings?.trialAiLimit ?? 10} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="freeplan" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Free Plan Settings</CardTitle>
                                <CardDescription className="text-xs font-medium">Define capabilities for forever-free workspaces.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Students (Total)</Label>
                                        <Input name="freeMaxStudents" type="number" defaultValue={initialSettings?.freeMaxStudents ?? 50} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Teachers (Total)</Label>
                                        <Input name="freeMaxTeachers" type="number" defaultValue={initialSettings?.freeMaxTeachers ?? 1} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Exams (Total)</Label>
                                        <Input name="freeMaxExams" type="number" defaultValue={initialSettings?.freeMaxExams ?? 3} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Max Questions (Total)</Label>
                                        <Input name="freeMaxQuestions" type="number" defaultValue={initialSettings?.freeMaxQuestions ?? 100} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Join Limit per Exam</Label>
                                        <Input name="freeMaxStudentsPerExam" type="number" defaultValue={initialSettings?.freeMaxStudentsPerExam ?? 20} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Concurrent Platform Uses</Label>
                                        <Input name="freeMaxConcurrentExams" type="number" defaultValue={initialSettings?.freeMaxConcurrentExams ?? 20} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Credits (Monthly)</Label>
                                        <Input name="freeAiLimit" type="number" defaultValue={initialSettings?.freeAiLimit ?? 3} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2 border-t pt-4">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Questions per AI Prompt</Label>
                                        <Input name="freeAiQuestionsPerRequest" type="number" defaultValue={initialSettings?.freeAiQuestionsPerRequest ?? 10} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="policies" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-[2rem] overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-black tracking-tight">Performance & Archival Policies</CardTitle>
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Global system optimization and storage policies.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                <HistoryIcon className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-black tracking-wider">Performance Vault Archival</h3>
                                        </div>
                                        <div className="space-y-2 group">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detailed Access Duration (Days)</Label>
                                            <div className="relative">
                                                <Input 
                                                    name="resultDetailedAccessDays" 
                                                    type="number" 
                                                    defaultValue={initialSettings?.resultDetailedAccessDays || 30} 
                                                    className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-10 font-black text-sm"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Days</div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium italic mt-2 leading-relaxed">
                                                Defines how long students can view correct answers, forensic logs, and download PDFs after result publication.
                                                <br />
                                                <span className="text-indigo-500 font-bold">Standard performance metrics (Score/Rank) remain visible indefinitely.</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Zap className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Optimization Impact</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {[
                                                "Reduces primary database query complexity for legacy records.",
                                                "Decreases server-side PDF generation workload.",
                                                "Optimizes frontend rendering for historical result snapshots.",
                                                "Maintains long-term data integrity without performance degradation."
                                            ].map((benefit, i) => (
                                                <li key={i} className="flex gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mt-1 shrink-0" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Platform Billing & GST</CardTitle>
                                <CardDescription className="text-xs font-medium">Configure global tax rates and platform legal identification.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase tracking-wider">GST Compliance Toggle</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground mr-8">
                                            When enabled, all workspace payments will include the specified GST calculation. Platform-wide receipts will be generated with these details.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="isGstEnabled" name="isGstEnabled" defaultChecked={initialSettings?.isGstEnabled} className="w-5 h-5 cursor-pointer accent-primary" />
                                            <Label htmlFor="isGstEnabled" className="text-sm font-bold cursor-pointer">Enable GST</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Default GST Rate (%)</Label>
                                        <Input name="gstRate" type="number" step="0.01" defaultValue={initialSettings?.gstRate ?? 18} className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                        <p className="text-[10px] text-muted-foreground">Standard GST rate applied to all workspace plans.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Platform Legal Name</Label>
                                        <Input name="platformLegalName" defaultValue={initialSettings?.platformLegalName ?? ""} placeholder="e.g. ABCD SOLUTIONS PVT LTD" className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">GSTIN Number</Label>
                                        <Input name="platformGstNumber" defaultValue={initialSettings?.platformGstNumber ?? ""} placeholder="e.g. 22AAAAA0000A1Z5" className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="space-y-2 pt-4 border-t lg:border-t-0">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">PAN Number</Label>
                                        <Input name="platformPanNumber" defaultValue={initialSettings?.platformPanNumber ?? ""} placeholder="e.g. ABCDE1234F" className="bg-background h-11 border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                    <div className="sm:col-span-2 lg:col-span-2 space-y-2 pt-4 border-t lg:border-t-0">
                                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Registered Office Address</Label>
                                        <Textarea name="platformAddress" defaultValue={initialSettings?.platformAddress ?? ""} placeholder="Enter the full registered address of the platform owner..." className="min-h-[100px] resize-none border-zinc-200 focus:ring-1 focus:ring-zinc-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="offline-payments" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-white/50 backdrop-blur-md">
                            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black tracking-tight uppercase">Offline Payment Collection</CardTitle>
                                        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 italic">Configure the receiving accounts for manual workspace renewals</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6 font-sans">
                                <div className="grid sm:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-4 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                            <Label className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 uppercase tracking-wider">
                                                <span className="flex items-center gap-2 text-primary"><ImagePlus className="w-4 h-4" /> UPI QR Code</span>
                                            </Label>
                                            
                                            <div className="space-y-4">
                                                {initialSettings?.paymentUpiQrUrl && (
                                                    <div className="w-40 h-40 mx-auto rounded-2xl border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden bg-white flex items-center justify-center p-2 group relative">
                                                        <img src={initialSettings.paymentUpiQrUrl} alt="UPI QR Preview" className="w-full h-full object-contain" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Active QR</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="space-y-2">
                                                    <Input
                                                        name="paymentUpiQrFile"
                                                        type="file"
                                                        accept="image/*"
                                                        className="bg-white dark:bg-zinc-950 cursor-pointer h-11 py-2 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary/20 rounded-xl font-medium"
                                                    />
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">SVG / PNG / JPG • Clear & Readable</p>
                                                </div>
                                            </div>
                                            <Input name="paymentUpiQrUrl" type="hidden" value={initialSettings?.paymentUpiQrUrl || ""} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2 group">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Universal UPI ID (VPA)</Label>
                                                <Input 
                                                    name="paymentUpiId" 
                                                    defaultValue={initialSettings?.paymentUpiId || ""} 
                                                    placeholder="e.g. abcdexams@upi" 
                                                    className="bg-white dark:bg-zinc-950 h-14 border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-lg focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-300"
                                                />
                                            </div>

                                            <div className="space-y-2 group pt-4">
                                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Bank / Alternate Instructions</Label>
                                                <Textarea 
                                                    name="paymentBankDetails" 
                                                    defaultValue={initialSettings?.paymentBankDetails || ""} 
                                                    placeholder="Bank Name: HDFC&#10;Account No: 501000...&#10;IFSC: HDFC000..." 
                                                    className="bg-white dark:bg-zinc-950 min-h-[160px] border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm placeholder:text-slate-300"
                                                />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mt-2 ml-1">This text will be shown to admins during renewal checkout</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex gap-4">
                                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">Security Awareness</p>
                                                <p className="text-[10px] font-medium text-amber-800/80 dark:text-amber-200/60 leading-relaxed italic">
                                                    Ensure all bank details and UPI IDs are accurate. Workspace admins will see this information directly when initiating a premium renewal trial.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="advanced" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-bold">Advanced Content Control</CardTitle>
                                <CardDescription className="text-xs font-medium">Fine-tune badge labels, promotional headers, and complex site sections.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">About Us Badge</Label>
                                        <Input name="aboutBadge" defaultValue={initialSettings?.aboutBadge || "Our Legacy"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Process Badge</Label>
                                        <Input name="processBadge" defaultValue={initialSettings?.processBadge || "Our Process"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">FAQ Badge</Label>
                                        <Input name="faqBadge" defaultValue={initialSettings?.faqBadge || "Knowledge Base"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Contact Badge</Label>
                                        <Input name="contactBadge" defaultValue={initialSettings?.contactBadge || "Contact Us"} className="h-9 text-xs" />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Pricing Section Badge</Label>
                                        <Input name="pricingBadge" defaultValue={initialSettings?.pricingBadge || "Transparent SaaS Pricing"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">AI Consultant Badge</Label>
                                        <Input name="aiConsultantBadge" defaultValue={initialSettings?.aiConsultantBadge || "AI Consultant Beta"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Services Hero Badge</Label>
                                        <Input name="servicesBadge" defaultValue={initialSettings?.servicesBadge || "Our Capabilities"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Engineering Badge</Label>
                                        <Input name="engineeringBadge" defaultValue={initialSettings?.engineeringBadge || "ENGINEERING INTEGRITY"} className="h-9 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Unified Ecosystem Badge</Label>
                                        <Input name="unifiedBadge" defaultValue={initialSettings?.unifiedBadge || "THE UNIFIED ECOSYSTEM"} className="h-9 text-xs" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10 pt-4">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-400">
                                            <Star className="w-4 h-4" /> About Us Features
                                        </h4>
                                        <div className="space-y-3">
                                            {aboutFeatures.map((feat, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <Input 
                                                        value={feat} 
                                                        onChange={(e) => {
                                                            const newFeats = [...aboutFeatures];
                                                            newFeats[i] = e.target.value;
                                                            setAboutFeatures(newFeats);
                                                        }}
                                                        className="h-9 text-xs"
                                                    />
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => setAboutFeatures(aboutFeatures.filter((_, idx) => idx !== i))}
                                                        className="h-9 w-9 text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => setAboutFeatures([...aboutFeatures, "New Feature"])}
                                                className="w-full text-[10px] font-bold uppercase tracking-widest h-9"
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-2" /> Add Feature
                                            </Button>
                                            <Input name="aboutFeatures" type="hidden" value={JSON.stringify(aboutFeatures)} />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-400">
                                            <Rocket className="w-4 h-4" /> Process Section
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Main Title</Label>
                                                <Input name="processTitle" defaultValue={initialSettings?.processTitle || "From Setup to Success"} className="h-9 text-xs" />
                                            </div>
                                            <div className="space-y-4">
                                                {processSteps.map((step, i) => (
                                                    <div key={i} className="p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 space-y-3 relative">
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => setProcessSteps(processSteps.filter((_, idx) => idx !== i))}
                                                            className="absolute top-2 right-2 h-7 w-7 text-red-500"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div className="col-span-1 space-y-1">
                                                                <Label className="text-[9px] font-bold uppercase">Logo/Num</Label>
                                                                <Input 
                                                                    value={step.icon || ""} 
                                                                    onChange={(e) => {
                                                                        const newSteps = [...processSteps];
                                                                        newSteps[i] = { ...newSteps[i], icon: e.target.value };
                                                                        setProcessSteps(newSteps);
                                                                    }}
                                                                    placeholder="01"
                                                                    className="h-8 text-[10px]"
                                                                />
                                                            </div>
                                                            <div className="col-span-3 space-y-1">
                                                                <Label className="text-[9px] font-bold uppercase">Step Title</Label>
                                                                <Input 
                                                                    value={step.title || ""} 
                                                                    onChange={(e) => {
                                                                        const newSteps = [...processSteps];
                                                                        newSteps[i] = { ...newSteps[i], title: e.target.value };
                                                                        setProcessSteps(newSteps);
                                                                    }}
                                                                    className="h-8 text-[10px]"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[9px] font-bold uppercase">Description</Label>
                                                            <Textarea 
                                                                value={step.description || ""} 
                                                                onChange={(e) => {
                                                                    const newSteps = [...processSteps];
                                                                    newSteps[i] = { ...newSteps[i], description: e.target.value };
                                                                    setProcessSteps(newSteps);
                                                                }}
                                                                className="h-16 text-[10px] resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setProcessSteps([...processSteps, { icon: "01", title: "New Step", description: "" }])}
                                                    className="w-full text-[10px] font-bold uppercase tracking-widest h-9"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-2" /> Add Step
                                                </Button>
                                                <Input name="processSteps" type="hidden" value={JSON.stringify(processSteps)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-10 pt-8 border-t">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-400">
                                            <Building2 className="w-4 h-4" /> Enterprise & Promo
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Enterprise Card Title</Label>
                                                <Input name="enterpriseTitle" defaultValue={initialSettings?.enterpriseTitle || "Ready for Enterprise?"} className="h-9 text-xs" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Enterprise Description</Label>
                                                <Textarea name="enterpriseDescription" defaultValue={initialSettings?.enterpriseDescription} className="h-20 text-xs resize-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Pricing Promo (Free Tier) Title</Label>
                                                <Input name="pricingPromoTitle" defaultValue={initialSettings?.pricingPromoTitle || "Catalyst Explorer Pass"} className="h-9 text-xs" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Pricing Promo Description</Label>
                                                <Textarea name="pricingPromoDescription" defaultValue={initialSettings?.pricingPromoDescription} className="h-20 text-xs resize-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-bold flex items-center gap-2 text-zinc-400">
                                            <Globe2 className="w-4 h-4" /> Services Hero Text
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Services Page Hero Title</Label>
                                                <Input name="servicesHeroTitle" defaultValue={initialSettings?.servicesHeroTitle || "Next-Gen Online Exam Solution"} className="h-9 text-xs" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Services Hero Subtitle</Label>
                                                <Textarea name="servicesHeroSubtitle" defaultValue={initialSettings?.servicesHeroSubtitle} className="h-24 text-xs resize-none" />
                                            </div>
                                            <div className="space-y-3 pt-4 border-t">
                                                <Label className="text-[10px] font-bold text-slate-500 uppercase">Services Hero Typing Phrases</Label>
                                                {servicesTypingTexts.map((txt, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <Input 
                                                            value={txt} 
                                                            onChange={(e) => {
                                                                const newTexts = [...servicesTypingTexts];
                                                                newTexts[i] = e.target.value;
                                                                setServicesTypingTexts(newTexts);
                                                            }}
                                                            className="h-8 text-[10px]"
                                                        />
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => setServicesTypingTexts(servicesTypingTexts.filter((_, idx) => idx !== i))}
                                                            className="h-8 w-8 text-red-500"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setServicesTypingTexts([...servicesTypingTexts, "New Phrase"])}
                                                    className="w-full text-[9px] font-black uppercase tracking-widest h-8"
                                                >
                                                    <Plus className="w-3 h-3 mr-2" /> Add Phrase
                                                </Button>
                                                <Input name="servicesTypingTexts" type="hidden" value={JSON.stringify(servicesTypingTexts)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </CardContent>
                        </Card>
                    </TabsContent>
                </form>

                <TabsContent value="faq" className="mt-0 outline-none">
                    <FAQManager faqs={faqs} />
                </TabsContent>

                <TabsContent value="pricing" className="mt-0 outline-none">
                    <PricingManager plans={pricingPlans} />
                </TabsContent>

                <TabsContent value="pages" className="mt-0 outline-none">
                    <PagesManager pages={dynamicPages} />
                </TabsContent>

                <TabsContent value="advantages" className="mt-0 outline-none">
                    <AdvantageManager advantages={advantages} />
                </TabsContent>

                <TabsContent value="services" className="mt-0 outline-none">
                    <ServiceManager services={services} />
                </TabsContent>

                <TabsContent value="guides" className="mt-0 outline-none">
                    <UserGuideManager initialGuides={userGuides} staticDefaults={DEFAULT_GUIDES} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function BannerManager({ banners }: { banners: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Local state for the "New Banner" form to support "Clear" buttons
    const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
    const [newBannerUrl, setNewBannerUrl] = useState("");
    const [newBannerTitle, setNewBannerTitle] = useState("");
    const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
    const [newBannerLink, setNewBannerLink] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update preview when file or URL changes
    useEffect(() => {
        if (newBannerFile) {
            const url = URL.createObjectURL(newBannerFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (newBannerUrl) {
            setPreviewUrl(newBannerUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [newBannerFile, newBannerUrl]);

    async function handleAdd() {
        startTransition(async () => {
            const formData = new FormData();
            if (newBannerFile) formData.append("imageFile", newBannerFile);
            formData.append("imageUrl", newBannerUrl);
            formData.append("title", newBannerTitle);
            formData.append("subtitle", newBannerSubtitle);
            formData.append("linkUrl", newBannerLink);

            const res = await addBanner(formData);
            if (res.success) {
                toast.success("Banner deployed successfully.");
                setIsAdding(false);
                // Reset state
                setNewBannerFile(null);
                setNewBannerUrl("");
                setNewBannerTitle("");
                setNewBannerSubtitle("");
                setNewBannerLink("");
            } else {
                toast.error(res.error || "Failed to deploy banner.");
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this banner?")) return;
        startTransition(async () => {
            const res = await deleteBanner(id);
            if (res.success) toast.success("Banner deleted.");
            else toast.error("Failed to delete.");
        });
    }

    async function handleToggle(id: string, active: boolean) {
        startTransition(async () => {
            const res = await updateBannerStatus(id, active);
            if (res.success) toast.success("Status updated.");
            else toast.error("Failed to update status.");
        });
    }

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold">Production Banners</CardTitle>
                    <CardDescription className="text-xs font-medium">Manage image transitions for the hero background.</CardDescription>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "New Banner"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2"><ImagePlus className="w-3.5 h-3.5" /> Image File (Upload)</span>
                                    {newBannerFile && (
                                        <button type="button" onClick={() => { setNewBannerFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                    )}
                                </Label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "relative h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden",
                                        newBannerFile ? "border-primary/50 bg-primary/5" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 bg-background"
                                    )}
                                >
                                    {previewUrl && newBannerFile ? (
                                        <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Preview" />
                                    ) : (
                                        <ImagePlus className="w-8 h-8 text-zinc-300" />
                                    )}
                                    <div className="relative z-10 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-tight">{newBannerFile ? newBannerFile.name : "Click or Drop Image"}</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Max 5MB • JPG, PNG, WEBP</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setNewBannerFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> OR External URL</span>
                                    {newBannerUrl && (
                                        <button type="button" onClick={() => setNewBannerUrl("")} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                    )}
                                </Label>
                                <div className="space-y-4">
                                    <Input
                                        value={newBannerUrl}
                                        onChange={(e) => setNewBannerUrl(e.target.value)}
                                        placeholder="https://example.com/banner.jpg"
                                        className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                    />
                                    {previewUrl && !newBannerFile && (
                                        <div className="h-16 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm animate-in zoom-in-95">
                                            <img src={previewUrl} className="w-full h-full object-cover" alt="Remote Preview" onError={() => setPreviewUrl(null)} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                    Banner Title
                                    {newBannerTitle && (
                                        <button type="button" onClick={() => setNewBannerTitle("")} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                    )}
                                </Label>
                                <Input
                                    value={newBannerTitle}
                                    onChange={(e) => setNewBannerTitle(e.target.value)}
                                    placeholder="Special Offer 2024"
                                    className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                    Banner Subtitle
                                    {newBannerSubtitle && (
                                        <button type="button" onClick={() => setNewBannerSubtitle("")} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                    )}
                                </Label>
                                <Input
                                    value={newBannerSubtitle}
                                    onChange={(e) => setNewBannerSubtitle(e.target.value)}
                                    placeholder="Get 50% off on first workspace"
                                    className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" /> Action / Target Link (Optional)</span>
                                {newBannerLink && (
                                    <button type="button" onClick={() => setNewBannerLink("")} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                )}
                            </Label>
                            <Input
                                value={newBannerLink}
                                onChange={(e) => setNewBannerLink(e.target.value)}
                                placeholder="/pricing or https://example.com"
                                className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                            />
                        </div>

                        <Button
                            disabled={isPending || (!newBannerFile && !newBannerUrl)}
                            onClick={handleAdd}
                            className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {isPending ? "Syncing to Cloud..." : "Deploy to Production"}
                        </Button>
                    </div>
                )}

                {banners.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic text-xs">No banners deployed.</div>
                ) : (
                    <div className="divide-y">
                        {banners.map(banner => (
                            <div key={banner.id} className="flex items-center gap-6 p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group border-b last:border-0 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                <GripVertical className="w-4 h-4 text-zinc-300 opacity-0 group-hover:opacity-100 cursor-grab transition-opacity shrink-0" />
                                <div className="w-24 h-14 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 overflow-hidden flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                    <img src={banner.imageUrl} className="w-full h-full object-cover" alt="Banner" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-black tracking-tight truncate">{banner.title || "Untitled Operational Asset"}</p>
                                        {!banner.isActive && (
                                            <span className="text-[8px] font-black uppercase bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 px-2 py-0.5 rounded-full tracking-widest">Draft</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> {banner.imageUrl.length > 40 ? banner.imageUrl.substring(0, 40) + "..." : banner.imageUrl}</span>
                                        {banner.linkUrl && (
                                            <span className="flex items-center gap-1.5 text-primary"><ArrowRight className="w-3 h-3" /> {banner.linkUrl}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => handleToggle(banner.id, !banner.isActive)}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-9 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl transition-all",
                                            banner.isActive ? "border-green-500/20 bg-green-500/5 text-green-600 hover:bg-green-500/10" : "border-zinc-200 text-zinc-400 hover:bg-zinc-100"
                                        )}
                                    >
                                        {banner.isActive ? "Online" : "Offline"}
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(banner.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function FAQManager({ faqs }: { faqs: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Local state for the "New FAQ" form
    const [newQuestion, setNewQuestion] = useState("");
    const [newAnswer, setNewAnswer] = useState("");
    const [newOrder, setNewOrder] = useState("0");

    async function handleAdd() {
        if (!newQuestion || !newAnswer) {
            toast.error("Question and Answer are required.");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append("question", newQuestion);
            formData.append("answer", newAnswer);
            formData.append("order", newOrder);

            const res = await addFaq(formData);
            if (res.success) {
                toast.success("FAQ added to knowledge base.");
                setIsAdding(false);
                setNewQuestion("");
                setNewAnswer("");
                setNewOrder("0");
            } else {
                toast.error(res.error || "Failed to add FAQ.");
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this FAQ?")) return;
        startTransition(async () => {
            const res = await deleteFaq(id);
            if (res.success) toast.success("FAQ removed.");
            else toast.error("Failed to delete FAQ.");
        });
    }

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold">Public Knowledge Base</CardTitle>
                    <CardDescription className="text-xs font-medium">Control the automated Q&A intelligence on the frontend.</CardDescription>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "Add Q&A"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Question</Label>
                                <Input
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    placeholder="e.g. How do I reset my password?"
                                    className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Display Order (Optional)</Label>
                                <Input
                                    type="number"
                                    value={newOrder}
                                    onChange={(e) => setNewOrder(e.target.value)}
                                    placeholder="0"
                                    className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Answer</Label>
                            <Textarea
                                value={newAnswer}
                                onChange={(e) => setNewAnswer(e.target.value)}
                                placeholder="Provide a helpful and concise response..."
                                className="min-h-[120px] resize-none"
                            />
                        </div>
                        <Button
                            disabled={isPending}
                            onClick={handleAdd}
                            className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {isPending ? "Syncing..." : "Add to Knowledge Base"}
                        </Button>
                    </div>
                )}
                {faqs.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic text-xs">Knowledge base is currently empty.</div>
                ) : (
                    <div className="divide-y relative">
                        {faqs.map(faq => (
                            <div key={faq.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group relative">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                        <h4 className="text-sm font-bold tracking-tight">{faq.question}</h4>
                                        <p className="text-xs text-muted-foreground font-medium pr-10 leading-relaxed italic">{faq.answer}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handleDelete(faq.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-[9px] font-black px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 tracking-[0.1em] text-zinc-500 uppercase">Order: {faq.order}</span>
                                    {faq.isDefault && (
                                        <span className="text-[9px] font-black px-3 py-1 rounded bg-primary/10 text-primary uppercase tracking-[0.1em]">Core Intelligence</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PricingManager({ plans }: { plans: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this plan?")) {
            await deletePricingPlan(id);
            toast.success("Plan deleted successfully");
        }
    };

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold">SaaS Commercial Deployment</CardTitle>
                    <CardDescription className="text-xs font-medium">Define your resource tiers and institutional pricing.</CardDescription>
                </div>
                <Button
                    onClick={() => {
                        setEditingPlan(null);
                        setIsAdding(!isAdding);
                    }}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "Define Plan"}
                </Button>
            </CardHeader>
            <CardContent className="p-8 border-t">
                {isAdding ? (
                    <div className="max-w-4xl mx-auto py-8">
                        <PricingPlanForm
                            initialData={editingPlan}
                            onSuccess={() => {
                                setEditingPlan(null);
                                setIsAdding(false);
                            }}
                        />
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="p-6 border rounded-xl flex flex-col items-start gap-4 h-full bg-background relative hover:border-zinc-400 transition-all">
                                {plan.isPopular && <div className="absolute top-0 right-6 -translate-y-1/2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold px-3 py-1 rounded-full tracking-tight">Recommended</div>}
                                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-60">{plan.name}</h4>
                                <div className="space-y-1 w-full">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Monthly</span>
                                        <span className="text-xl font-bold tracking-tighter">₹{plan.priceMonthly}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Yearly</span>
                                        <span className="text-xl font-bold tracking-tighter">₹{plan.priceYearly}</span>
                                    </div>
                                </div>
                                <ul className="space-y-2 mt-2 flex-1">
                                    {plan.features?.slice(0, 3).map((f: string, i: number) => (
                                        <li key={i} className="text-[10px] font-medium text-muted-foreground flex items-center gap-2 italic">
                                            <Globe className="w-3 h-3 text-zinc-300" /> {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="w-full flex justify-between items-center pt-4 border-t mt-4">
                                    <Button
                                        onClick={() => {
                                            setEditingPlan(plan);
                                            setIsAdding(true);
                                        }}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs font-bold text-muted-foreground hover:text-zinc-950 rounded-xl"
                                    >
                                        Manage
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(plan.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PagesManager({ pages }: { pages: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [editingPage, setEditingPage] = useState<any>(null);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [isActive, setIsActive] = useState(true);

    function resetForm() {
        setTitle("");
        setSlug("");
        setContent("");
        setIsActive(true);
        setEditingPage(null);
        setIsAdding(false);
    }

    function handleEdit(page: any) {
        setEditingPage(page);
        setTitle(page.title);
        setSlug(page.slug);
        setContent(page.content);
        setIsActive(page.isActive);
        setIsAdding(true);
    }

    async function handleSave() {
        startTransition(async () => {
            const formData = new FormData();
            if (editingPage) formData.append("id", editingPage.id);
            formData.append("title", title);
            formData.append("slug", slug);
            formData.append("content", content);
            formData.append("isActive", isActive.toString());

            const res = await upsertDynamicPage(formData);
            if (res.success) {
                toast.success(editingPage ? "Page updated." : "Page created.");
                resetForm();
            } else {
                toast.error(res.error || "Failed to save page.");
            }
        });
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return;
        startTransition(async () => {
            const res = await deleteDynamicPage(id);
            if (res.success) toast.success("Page deleted.");
            else toast.error("Failed to delete.");
        });
    }

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold">Dynamic Documents</CardTitle>
                    <CardDescription className="text-xs font-medium">Manage legal and informational pages (Privacy, Terms, etc.)</CardDescription>
                </div>
                <Button
                    onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "New Page"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Page Title</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Privacy Policy"
                                    className="bg-background h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">URL Slug</Label>
                                <Input
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, "-"))}
                                    placeholder="privacy-policy"
                                    className="bg-background h-11"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Content (Markdown/HTML Support)</Label>
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your page content here..."
                                className="min-h-[300px] font-mono text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                disabled={isPending}
                                onClick={handleSave}
                                className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl px-12"
                            >
                                {isPending ? "Saving..." : editingPage ? "Update Page" : "Create Page"}
                            </Button>
                        </div>
                    </div>
                )}

                {pages.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic text-xs">No dynamic pages found.</div>
                ) : (
                    <div className="divide-y relative">
                        {pages.map(page => (
                            <div key={page.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                                <div className="flex justify-between items-center gap-4">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold tracking-tight">{page.title}</h4>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">/policies/{page.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => handleEdit(page)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px] font-bold uppercase rounded-xl"
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(page.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-zinc-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function AdvantageManager({ advantages }: { advantages: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [order, setOrder] = useState("");

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setOrder("");
        setIsAdding(false);
    };

    const handleAdd = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            formData.append("order", order);

            const res = await addAdvantage(formData);
            if (res.success) {
                toast.success("Advantage added.");
                resetForm();
            } else {
                toast.error(res.error || "Failed to add.");
            }
        });
    };

    const handleDeleteAdv = (id: string) => {
        if (!confirm("Are you sure?")) return;
        startTransition(async () => {
            const res = await deleteAdvantage(id);
            if (res.success) toast.success("Advantage removed.");
            else toast.error("Failed to delete.");
        });
    };

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold">Competitive Edge</CardTitle>
                    <CardDescription className="text-xs font-medium">Why institutions choose your platform over others.</CardDescription>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "Add Advantage"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AI-Powered Proctoring" className="bg-background h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Display Order</Label>
                                <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="0" className="bg-background h-11" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain the benefit..." className="min-h-[100px] resize-none" />
                        </div>
                        <Button disabled={isPending} onClick={handleAdd} className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">
                            {isPending ? "Syncing..." : "Add to Listing"}
                        </Button>
                    </div>
                )}
                <div className="divide-y">
                    {advantages.map(adv => (
                        <div key={adv.id} className="p-6 flex justify-between items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <div className="space-y-1 flex-1">
                                <h4 className="text-sm font-bold tracking-tight">{adv.title}</h4>
                                <p className="text-xs text-muted-foreground font-medium italic">{adv.description}</p>
                            </div>
                            <Button onClick={() => handleDeleteAdv(adv.id)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {advantages.length === 0 && <div className="p-12 text-center text-muted-foreground italic text-xs">No advantages defined.</div>}
                </div>
            </CardContent>
        </Card>
    );
}

function ServiceManager({ services }: { services: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [iconName, setIconName] = useState("");
    const [iconColor, setIconColor] = useState("#FFD700");
    const [isPrimary, setIsPrimary] = useState(false);
    const [features, setFeatures] = useState("");
    const [order, setOrder] = useState("");

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setIconName("");
        setIconColor("#FFD700");
        setIsPrimary(false);
        setFeatures("");
        setOrder("");
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            if (editingId) formData.append("id", editingId);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("iconName", iconName);
            formData.append("iconColor", iconColor);
            formData.append("isPrimary", isPrimary.toString());
            formData.append("features", features);
            formData.append("order", order);

            const res = editingId ? await updateService(formData) : await addService(formData);
            if (res.success) {
                toast.success(editingId ? "Service updated." : "Service added.");
                resetForm();
            } else {
                toast.error(res.error || "Failed to save.");
            }
        });
    };

    const handleEdit = (ser: any) => {
        setTitle(ser.title);
        setDescription(ser.description);
        setIconName(ser.iconName || "");
        setIconColor(ser.iconColor || "#FFD700");
        setIsPrimary(!!ser.isPrimary);
        setFeatures(ser.features?.join(", ") || "");
        setOrder(ser.order?.toString() || "");
        setEditingId(ser.id);
        setIsAdding(true);
    };

    const handleDeleteServ = (id: string) => {
        if (!confirm("Are you sure?")) return;
        startTransition(async () => {
            const res = await deleteService(id);
            if (res.success) toast.success("Service removed.");
            else toast.error("Failed to delete.");
        });
    };

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                        Solutions Catalog
                        <a
                            href="https://lucide.dev/icons"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <HelpCircle className="w-3 h-3" />
                            Find Icons
                        </a>
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">Define the core offerings available to your users.</CardDescription>
                </div>
                <Button
                    onClick={() => {
                        if (isAdding) resetForm();
                        else setIsAdding(true);
                    }}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "Add Service"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                {editingId ? "Edit Mode" : "Creation Mode"}
                            </span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Service Name</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Enterprise Onboarding" className="bg-background h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Display Order</Label>
                                <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="0" className="bg-background h-11" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Icon Name (PascalCase)</Label>
                                <div className="relative">
                                    <Input value={iconName} onChange={(e) => setIconName(e.target.value)} placeholder="e.g. ShieldCheck, TrainFront" className="bg-background h-11 pr-10" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                                        {(() => {
                                            const PreviewIcon = getIconByName(iconName);
                                            return <PreviewIcon size={18} />;
                                        })()}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider pr-1">Try:</span>
                                    {["Anvil", "Toolbox", "Zap", "ShieldCheck", "Rocket", "Users", "Database", "Search", "Settings2"].map(suggest => (
                                        <button
                                            key={suggest}
                                            type="button"
                                            onClick={() => setIconName(suggest)}
                                            className="text-[9px] font-bold text-zinc-500 hover:text-primary transition-colors bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-tighter"
                                        >
                                            {suggest}
                                        </button>
                                    ))}
                                    <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-primary hover:underline uppercase tracking-tighter">More...</a>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Icon Background Color</Label>
                                <div className="flex gap-2">
                                    <Input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} className="w-11 h-11 p-1 cursor-pointer" />
                                    <Input value={iconColor} onChange={(e) => setIconColor(e.target.value)} placeholder="#FFD700" className="bg-background h-11 flex-1" />
                                </div>
                            </div>
                            <div className="space-y-2 flex flex-col justify-center">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Featured / Primary Card</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isPrimary}
                                        onChange={(e) => setIsPrimary(e.target.checked)}
                                        className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-xs font-medium">Highlight this card</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Service Points (Comma separated)</Label>
                            <Input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Point 1, Point 2, Point 3" className="bg-background h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Description</Label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this service include?" className="min-h-[100px] resize-none" />
                        </div>
                        <Button disabled={isPending} onClick={handleSave} className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl">
                            {isPending ? "Syncing..." : editingId ? "Update Service" : "Deploy Service"}
                        </Button>
                    </div>
                )}
                <div className="divide-y relative">
                    {services.map(ser => (
                        <div key={ser.id} className="p-6 flex justify-between items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                            <div className="flex items-center gap-4 flex-1">
                                {(() => {
                                    const Icon = getIconByName(ser.iconName);
                                    return (
                                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm", ser.iconColor || "bg-zinc-500")} style={ser.iconColor ? { backgroundColor: ser.iconColor } : {}}>
                                            <Icon size={20} />
                                        </div>
                                    );
                                })()}
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold tracking-tight truncate">{ser.title}</h4>
                                        {ser.isPrimary && <span className="text-[8px] font-black uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Primary</span>}
                                        <span className="text-[8px] font-medium text-zinc-400">Order: {ser.order}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium italic truncate">{ser.description}</p>
                                    {ser.features?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {ser.features.map((f: string, i: number) => (
                                                <span key={i} className="text-[8px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">{f}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button onClick={() => handleEdit(ser)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary">
                                    <Settings2 className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => handleDeleteServ(ser.id)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && <div className="p-12 text-center text-muted-foreground italic text-xs">No services defined.</div>}
                </div>
            </CardContent>
        </Card>
    );
}
