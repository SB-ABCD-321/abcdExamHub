"use client";

import { useTransition, useState, useRef, useEffect, useCallback } from "react";
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
    ChevronRight, ChevronLeft, BookOpen, Building2, Terminal, GraduationCap,
    Star, Sparkles, Compass, Rocket, AlertCircle, Loader2,
    CheckCircle2, Receipt, ExternalLink, Check, Users,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [activeTab, setActiveTab] = useState("branding");
    const tabsScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const updateScrollArrows = useCallback(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        updateScrollArrows();
        el.addEventListener("scroll", updateScrollArrows, { passive: true });
        const ro = new ResizeObserver(updateScrollArrows);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", updateScrollArrows);
            ro.disconnect();
        };
    }, [isMounted, updateScrollArrows]);

    const scrollTabs = (direction: "left" | "right") => {
        const el = tabsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
    };

    const [siteName, setSiteName] = useState(initialSettings?.siteName || "");
    const [footerDescription, setFooterDescription] = useState(initialSettings?.footerDescription || "");
    const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl || "");
    const [faviconUrl, setFaviconUrl] = useState(initialSettings?.faviconUrl || "");
    const [aboutUsImageUrl, setAboutUsImageUrl] = useState(initialSettings?.aboutUsImageUrl || "");
    const [heroRightImageUrl, setHeroRightImageUrl] = useState(initialSettings?.heroRightImageUrl || "");
    const [isGstEnabled, setIsGstEnabled] = useState(initialSettings?.isGstEnabled ?? false);
    const [paymentUpiQrUrl, setPaymentUpiQrUrl] = useState(initialSettings?.paymentUpiQrUrl || "");
    const [newTypingPhrase, setNewTypingPhrase] = useState("");
    const [aboutFeatures, setAboutFeatures] = useState<string[]>(Array.isArray(initialSettings?.aboutFeatures) ? initialSettings.aboutFeatures : []);
    const [processSteps, setProcessSteps] = useState<any[]>(Array.isArray(initialSettings?.processSteps) ? initialSettings.processSteps : []);
    const [servicesTypingTexts, setServicesTypingTexts] = useState<string[]>(Array.isArray(initialSettings?.servicesTypingTexts) ? initialSettings.servicesTypingTexts : ["Exam Solution", "Question Making", "AI Using"]);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const aboutUsInputRef = useRef<HTMLInputElement>(null);
    const heroRightInputRef = useRef<HTMLInputElement>(null);
    const paymentUpiQrInputRef = useRef<HTMLInputElement>(null);

    async function handleSettingsSubmit(formData: FormData) {
        const logoFile = formData.get("logoFile") as File;
        const faviconFile = formData.get("faviconFile") as File;
        const aboutUsImageFile = formData.get("aboutUsImageFile") as File;
        const heroRightImageFile = formData.get("heroRightImageFile") as File;
        const paymentUpiQrFile = formData.get("paymentUpiQrFile") as File;

        // Validation limits
        const LOGO_LIMIT = 2 * 1024 * 1024; // 2MB
        const FAVICON_LIMIT = 512 * 1024; // 512KB
        const ABOUT_LIMIT = 5 * 1024 * 1024; // 5MB
        const HERO_LIMIT = 2 * 1024 * 1024; // 2MB
        const QR_LIMIT = 2 * 1024 * 1024; // 2MB

        if (paymentUpiQrFile && paymentUpiQrFile.size > QR_LIMIT) {
            toast.error("UPI QR image must be smaller than 2MB");
            return;
        }

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

    const isFormTab = ["branding", "marketing", "contacts", "trials", "freeplan", "policies", "billing", "offline-payments", "advanced"].includes(activeTab);

    const tabStyles = "rounded-xl px-3.5 py-2 text-xs font-semibold tracking-tight transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs flex items-center gap-2 hover:bg-muted/80 text-muted-foreground hover:text-foreground";

    if (!isMounted) return null;

    return (
        <div className="w-full space-y-6 pb-20 md:pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b overflow-hidden">
                    <div className="relative flex items-center gap-1 min-w-0 flex-1">
                        {/* Left scroll arrow - always visible on desktop with disabled opacity */}
                        <button
                            type="button"
                            aria-label="Scroll tabs left"
                            disabled={!canScrollLeft}
                            onClick={() => scrollTabs("left")}
                            className={cn(
                                "hidden md:flex shrink-0 items-center justify-center w-8 h-8 rounded-lg border bg-background shadow-xs text-muted-foreground transition-all duration-200",
                                canScrollLeft 
                                    ? "hover:bg-muted cursor-pointer opacity-100" 
                                    : "opacity-40 cursor-not-allowed hover:bg-background"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div
                            ref={tabsScrollRef}
                            className="overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide flex-1"
                        >
                            <TabsList className="bg-muted/40 p-1 rounded-2xl h-auto flex gap-1.5 min-w-max border">
                                <TabsTrigger value="branding" className={tabStyles}>
                                    <Settings2 className="w-4 h-4" /> Branding
                                </TabsTrigger>
                                <TabsTrigger value="marketing" className={tabStyles}>
                                    <Megaphone className="w-4 h-4" /> Marketing
                                </TabsTrigger>
                                <TabsTrigger value="contacts" className={tabStyles}>
                                    <Contact className="w-4 h-4" /> Contacts
                                </TabsTrigger>
                                <TabsTrigger value="trials" className={tabStyles}>
                                    <Zap className="w-4 h-4" /> Workspace Trials
                                </TabsTrigger>
                                <TabsTrigger value="freeplan" className={tabStyles}>
                                    <Zap className="w-4 h-4" /> Free Plan
                                </TabsTrigger>
                                <TabsTrigger value="billing" className={tabStyles}>
                                    <CreditCard className="w-4 h-4" /> Platform Billing
                                </TabsTrigger>
                                <TabsTrigger value="offline-payments" className={tabStyles}>
                                    <CreditCard className="w-4 h-4" /> Offline Payments
                                </TabsTrigger>
                                <TabsTrigger value="pricing" className={tabStyles}>
                                    <CreditCard className="w-4 h-4" /> Pricing
                                    {pricingPlans.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted data-[state=active]:bg-primary-foreground/20">
                                            {pricingPlans.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="services" className={tabStyles}>
                                    <Zap className="w-4 h-4" /> Services
                                    {services.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted data-[state=active]:bg-primary-foreground/20">
                                            {services.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="advantages" className={tabStyles}>
                                    <ShieldCheck className="w-4 h-4" /> Why Us
                                    {advantages.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted data-[state=active]:bg-primary-foreground/20">
                                            {advantages.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="faq" className={tabStyles}>
                                    <HelpCircle className="w-4 h-4" /> FAQ
                                    {faqs.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted data-[state=active]:bg-primary-foreground/20">
                                            {faqs.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="pages" className={tabStyles}>
                                    <FileText className="w-4 h-4" /> Pages
                                    {dynamicPages.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted data-[state=active]:bg-primary-foreground/20">
                                            {dynamicPages.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="guides" className={tabStyles}>
                                    <BookMarked className="w-4 h-4" /> User Guides
                                    {userGuides.length > 0 && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-muted data-[state=active]:bg-primary-foreground/20">
                                            {userGuides.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="policies" className={tabStyles}>
                                    <ShieldCheck className="w-4 h-4" /> Platform Policies
                                </TabsTrigger>
                                <TabsTrigger value="advanced" className={tabStyles}>
                                    <Settings2 className="w-4 h-4" /> Advanced Content
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Right scroll arrow - always visible on desktop with disabled opacity */}
                        <button
                            type="button"
                            aria-label="Scroll tabs right"
                            disabled={!canScrollRight}
                            onClick={() => scrollTabs("right")}
                            className={cn(
                                "hidden md:flex shrink-0 items-center justify-center w-8 h-8 rounded-lg border bg-background shadow-xs text-muted-foreground transition-all duration-200",
                                canScrollRight 
                                    ? "hover:bg-muted cursor-pointer opacity-100" 
                                    : "opacity-40 cursor-not-allowed hover:bg-background"
                            )}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={isPending}
                        form="settings-form"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 h-10 rounded-xl shadow-xs w-full md:w-auto flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Saving Settings...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-4 h-4" />
                                <span>Save Changes</span>
                            </>
                        )}
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
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contact Section Badge</Label>
                                    <Input name="contactBadge" defaultValue={initialSettings?.contactBadge || "Contact Us"} />
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

                    {/* 6. PLATFORM BILLING & TAXATION */}
                    <TabsContent value="billing" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                        <Receipt className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Platform Billing & Tax Governance</CardTitle>
                                        <CardDescription className="text-xs font-medium">Configure global GST tax compliance, invoicing identity, and corporate fiscal credentials.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                {/* GST Compliance Status Box */}
                                <div className={cn(
                                    "p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                                    isGstEnabled ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20" : "bg-muted/40 border-border"
                                )}>
                                    <div className="space-y-1.5 max-w-xl">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                                                isGstEnabled ? "bg-emerald-500 text-white shadow-xs" : "bg-muted text-muted-foreground"
                                            )}>
                                                <div className={cn("size-1.5 rounded-full", isGstEnabled ? "bg-white animate-pulse" : "bg-muted-foreground")} />
                                                {isGstEnabled ? "Tax Compliance Active" : "Tax Exempt / Inactive"}
                                            </span>
                                            <span className="text-xs font-bold text-foreground">Goods & Services Tax (GST) Engine</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            When enabled, all workspace plan upgrades, extensions, and automated invoices automatically apply the standard GST calculation with compliant line-item breakdowns.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <label htmlFor="isGstEnabled" className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="isGstEnabled"
                                                name="isGstEnabled"
                                                checked={isGstEnabled}
                                                onChange={(e) => setIsGstEnabled(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                        </label>
                                        <Label htmlFor="isGstEnabled" className="text-xs font-bold cursor-pointer select-none">
                                            {isGstEnabled ? "Enabled" : "Disabled"}
                                        </Label>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-8 pt-2">
                                    {/* Tax Parameters */}
                                    <div className="space-y-5 p-5 rounded-2xl border bg-background/50">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <ShieldCheck className="size-4 text-primary" /> Tax Identification & Rates
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                                                    Default GST Rate (%)
                                                    <span className="text-[10px] text-muted-foreground font-normal">Applies across all commercial plans</span>
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        name="gstRate"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={initialSettings?.gstRate ?? 18}
                                                        className="bg-background h-10 pr-8 font-semibold text-sm"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">GSTIN (15-Character Number)</Label>
                                                <Input
                                                    name="platformGstNumber"
                                                    defaultValue={initialSettings?.platformGstNumber ?? ""}
                                                    placeholder="e.g. 22AAAAA0000A1Z5"
                                                    className="bg-background h-10 font-mono text-xs uppercase tracking-wider"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Permanent Account Number (PAN)</Label>
                                                <Input
                                                    name="platformPanNumber"
                                                    defaultValue={initialSettings?.platformPanNumber ?? ""}
                                                    placeholder="e.g. ABCDE1234F"
                                                    className="bg-background h-10 font-mono text-xs uppercase tracking-wider"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Legal Entity Identification */}
                                    <div className="space-y-5 p-5 rounded-2xl border bg-background/50">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <Building2 className="size-4 text-primary" /> Legal Entity & Invoicing
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Platform Legal / Company Name</Label>
                                                <Input
                                                    name="platformLegalName"
                                                    defaultValue={initialSettings?.platformLegalName ?? ""}
                                                    placeholder="e.g. ABCD SOLUTIONS PRIVATE LIMITED"
                                                    className="bg-background h-10 font-semibold text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Office Address</Label>
                                                <Textarea
                                                    name="platformAddress"
                                                    defaultValue={initialSettings?.platformAddress ?? ""}
                                                    placeholder="Street, Building, City, State, PIN Code, Country..."
                                                    className="min-h-[110px] resize-none text-xs leading-relaxed"
                                                />
                                                <p className="text-[10px] text-muted-foreground italic">Printed verbatim at the footer of official workspace invoices and tax receipts.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 7. OFFLINE PAYMENTS */}
                    <TabsContent value="offline-payments" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                        <CreditCard className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Manual & Offline Payment Rails</CardTitle>
                                        <CardDescription className="text-xs font-medium">Configure institutional UPI VPA, QR scanner assets, and RTGS/NEFT settlement instructions for workspace renewals.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-2 gap-8">
                                    {/* UPI Rails Hub */}
                                    <div className="space-y-5 p-5 rounded-2xl border bg-background/50">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Smartphone className="size-4 text-primary" /> Instant UPI Node
                                            </h4>
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                                Mobile & Scan
                                            </span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Universal UPI ID (VPA)</Label>
                                                <div className="relative">
                                                    <Input
                                                        name="paymentUpiId"
                                                        defaultValue={initialSettings?.paymentUpiId || ""}
                                                        placeholder="e.g. abcdexams@upi"
                                                        className="bg-background h-11 pr-14 font-mono font-bold text-sm tracking-wide"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded pointer-events-none">
                                                        VPA
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">Admins can click-to-copy or trigger their UPI app directly from checkout.</p>
                                            </div>

                                            {/* UPI QR Display & Upload */}
                                            <div className="space-y-3 pt-2">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                                    <span className="flex items-center gap-2"><ImagePlus className="size-3.5" /> Static QR Code Scan Asset</span>
                                                    {paymentUpiQrUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPaymentUpiQrUrl("")}
                                                            className="text-[10px] text-red-500 hover:underline cursor-pointer"
                                                        >
                                                            Remove QR
                                                        </button>
                                                    )}
                                                </Label>
                                                <div className="flex items-center gap-4">
                                                    {paymentUpiQrUrl ? (
                                                        <div className="size-24 rounded-xl border bg-white flex items-center justify-center p-1.5 shrink-0 shadow-xs relative group overflow-hidden">
                                                            <img src={paymentUpiQrUrl} alt="UPI QR" className="max-w-full max-h-full object-contain" />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <span className="text-[9px] text-white font-bold">Active QR</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="size-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground/50 shrink-0 bg-muted/20">
                                                            <ImagePlus className="size-6 mb-1" />
                                                            <span className="text-[9px] font-bold">No QR</span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 space-y-1.5">
                                                        <Input
                                                            ref={paymentUpiQrInputRef}
                                                            name="paymentUpiQrFile"
                                                            type="file"
                                                            accept="image/*"
                                                            className="bg-background cursor-pointer h-10 py-1.5 text-xs"
                                                        />
                                                        <p className="text-[9px] text-muted-foreground">Supports PNG, JPG, or SVG (Max 2MB). High contrast recommended.</p>
                                                    </div>
                                                </div>
                                                <Input name="paymentUpiQrUrl" type="hidden" value={paymentUpiQrUrl} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bank Wire Settlement */}
                                    <div className="space-y-5 p-5 rounded-2xl border bg-background/50 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Building2 className="size-4 text-primary" /> Institutional Bank Wire
                                            </h4>
                                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border">
                                                RTGS / NEFT / IMPS
                                            </span>
                                        </div>

                                        <div className="space-y-2 flex-1 flex flex-col">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Account & Transfer Guidance</Label>
                                            <Textarea
                                                name="paymentBankDetails"
                                                defaultValue={initialSettings?.paymentBankDetails || ""}
                                                placeholder="Bank Name: HDFC Bank&#10;Account Name: ABCD Solutions Pvt Ltd&#10;Account Number: 50200012345678&#10;IFSC Code: HDFC0001234&#10;Branch: Commercial Central"
                                                className="flex-1 min-h-[160px] font-mono text-xs leading-relaxed resize-none p-3.5 bg-background"
                                            />
                                        </div>

                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2.5 items-start text-xs text-amber-800 dark:text-amber-200">
                                            <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                            <span className="text-[11px] leading-snug">
                                                This guidance is rendered directly to workspace admins when initiating offline subscription renewals.
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Renewal Legal Terms & Disclaimers */}
                                <div className="p-6 rounded-2xl border bg-card/60 space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <FileText className="size-4 text-primary" /> Renewal Consent & Explicit Terms
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Define mandatory checklist points and legal disclaimers workspace admins must acknowledge prior to submission.</p>
                                    </div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                                                Agreement Highlights
                                                <span className="text-[10px] text-muted-foreground font-normal">One bullet per line</span>
                                            </Label>
                                            <Textarea
                                                name="paymentTermsContent"
                                                defaultValue={initialSettings?.paymentTermsContent || ""}
                                                placeholder="Payment verification requires 2-4 business hours.&#10;Ensure transaction reference number matches bank receipt.&#10;Invoices are issued automatically upon confirmation."
                                                className="min-h-[140px] text-xs resize-none font-medium leading-relaxed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Platform Renewal Disclaimer</Label>
                                            <Textarea
                                                name="paymentDisclaimerContent"
                                                defaultValue={initialSettings?.paymentDisclaimerContent || ""}
                                                placeholder="All offline payments are subject to manual administrative reconciliation. Falsified transaction references may lead to immediate workspace suspension..."
                                                className="min-h-[140px] text-xs resize-none font-medium leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 8. PRICING TAB */}
                    <TabsContent value="pricing" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                        <Sparkles className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Public Pricing Page Branding & Banners</CardTitle>
                                        <CardDescription className="text-xs font-medium">Headlines, badges, and promotional explorer pass callouts shown on the public pricing page.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Badge</Label>
                                        <Input name="pricingBadge" defaultValue={initialSettings?.pricingBadge || "Predictable Pricing"} placeholder="Predictable Pricing" className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Headline Title</Label>
                                        <Input name="pricingTitle" defaultValue={initialSettings?.pricingTitle || "Flexible Institutional Plans"} placeholder="Flexible Institutional Plans" className="h-10 text-xs font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Section Subtitle Narrative</Label>
                                        <Input name="pricingSubtitle" defaultValue={initialSettings?.pricingSubtitle || "Choose the scale that matches your institution"} placeholder="Choose the scale..." className="h-10 text-xs" />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enterprise / Promo Card Title</Label>
                                        <Input name="pricingPromoTitle" defaultValue={initialSettings?.pricingPromoTitle || "Catalyst Explorer Pass"} className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enterprise / Promo Description</Label>
                                        <Textarea name="pricingPromoDescription" defaultValue={initialSettings?.pricingPromoDescription} className="h-20 text-xs resize-none" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <PricingManager plans={pricingPlans} />
                    </TabsContent>

                    {/* 9. SERVICES TAB */}
                    <TabsContent value="services" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                        <Zap className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Services Page Hero & Animated Keywords</CardTitle>
                                        <CardDescription className="text-xs font-medium">Configure headline banners, introductory copy, and dynamic typing phrases on the public services page.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="grid sm:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Services Badge</Label>
                                        <Input name="servicesBadge" defaultValue={initialSettings?.servicesBadge || "Enterprise Services"} className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Services Page Hero Title</Label>
                                        <Input name="servicesHeroTitle" defaultValue={initialSettings?.servicesHeroTitle || "Next-Gen Online Exam Solution"} className="h-10 text-xs font-semibold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Services Hero Subtitle</Label>
                                    <Textarea name="servicesHeroSubtitle" defaultValue={initialSettings?.servicesHeroSubtitle} className="h-20 text-xs resize-none leading-relaxed" />
                                </div>

                                {/* Dynamic Typing Phrases */}
                                <div className="space-y-3 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Sparkles className="size-3.5 text-primary" /> Dynamic Rotating Keywords ({servicesTypingTexts.length})
                                        </Label>
                                        <span className="text-[10px] text-muted-foreground font-normal">Cycles sequentially in the typewriter animation</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 p-3 rounded-xl border bg-muted/20">
                                        {servicesTypingTexts.map((txt, i) => (
                                            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-background text-xs font-semibold shadow-2xs group">
                                                <span>{txt}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setServicesTypingTexts(servicesTypingTexts.filter((_, idx) => idx !== i))}
                                                    className="size-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {servicesTypingTexts.length === 0 && (
                                            <span className="text-xs text-muted-foreground italic">No keywords added yet.</span>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            value={newTypingPhrase}
                                            onChange={(e) => setNewTypingPhrase(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && newTypingPhrase.trim()) {
                                                    e.preventDefault();
                                                    setServicesTypingTexts([...servicesTypingTexts, newTypingPhrase.trim()]);
                                                    setNewTypingPhrase("");
                                                }
                                            }}
                                            placeholder="Type a new phrase and click Add..."
                                            className="h-9 text-xs bg-background flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (newTypingPhrase.trim()) {
                                                    setServicesTypingTexts([...servicesTypingTexts, newTypingPhrase.trim()]);
                                                    setNewTypingPhrase("");
                                                }
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-4 text-xs font-bold shrink-0 cursor-pointer"
                                        >
                                            <Plus className="size-3.5 mr-1.5" /> Add Keyword
                                        </Button>
                                    </div>
                                    <Input name="servicesTypingTexts" type="hidden" value={JSON.stringify(servicesTypingTexts)} />
                                </div>
                            </CardContent>
                        </Card>

                        <ServiceManager services={services} />
                    </TabsContent>

                    {/* 10. WHY US (ADVANTAGES) TAB */}
                    <TabsContent value="advantages" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Why Choose Us Narrative & Quality Badges</CardTitle>
                                        <CardDescription className="text-xs font-medium">Core institutional value proposition and quality badges displayed on public pages.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 border-t font-sans">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Why Us Proposition Text</Label>
                                    <Textarea name="whyUsText" defaultValue={initialSettings?.whyUsText || "Engineered for high reliability, fairness, and effortless scalability across mobile, tablet, and desktop environments."} className="min-h-[100px] resize-none text-xs leading-relaxed" />
                                </div>
                                <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quality Badge 1</Label>
                                        <Input name="aboutBadge" defaultValue={initialSettings?.aboutBadge || "OUR PLATFORM"} className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quality Badge 2</Label>
                                        <Input name="engineeringBadge" defaultValue={initialSettings?.engineeringBadge || "PEDAGOGICAL INTEGRITY"} className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Quality Badge 3</Label>
                                        <Input name="unifiedBadge" defaultValue={initialSettings?.unifiedBadge || "THE UNIFIED ECOSYSTEM"} className="h-10 text-xs" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <AdvantageManager advantages={advantages} />
                    </TabsContent>

                    {/* 11. FAQ TAB */}
                    <TabsContent value="faq" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                        <HelpCircle className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">FAQ Section Branding</CardTitle>
                                        <CardDescription className="text-xs font-medium">Header and badge labels for the public knowledge base.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 border-t font-sans">
                                <div className="max-w-md space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">FAQ Section Badge</Label>
                                    <Input name="faqBadge" defaultValue={initialSettings?.faqBadge || "Knowledge Base & Help"} className="h-10 text-xs" />
                                </div>
                            </CardContent>
                        </Card>

                        <FAQManager faqs={faqs} />
                    </TabsContent>

                    {/* 12. PAGES TAB */}
                    <TabsContent value="pages" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <PagesManager pages={dynamicPages} />
                    </TabsContent>

                    {/* 13. USER GUIDES TAB */}
                    <TabsContent value="guides" forceMount className="mt-0 outline-none data-[state=inactive]:hidden">
                        <UserGuideManager initialGuides={userGuides} staticDefaults={DEFAULT_GUIDES} />
                    </TabsContent>

                    {/* 14. PLATFORM POLICIES */}
                    <TabsContent value="policies" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                                        <HistoryIcon className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Performance Archival & Forensic Retention</CardTitle>
                                        <CardDescription className="text-xs font-medium">Global database optimization, student forensic exam review window, and long-term storage policies.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6 border-t font-sans">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4 p-5 rounded-2xl border bg-background/50">
                                        <div className="flex items-center gap-2.5">
                                            <HistoryIcon className="size-4 text-indigo-500" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Performance Vault Access Period</h4>
                                        </div>
                                        <div className="space-y-2 group">
                                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Detailed Student Access Duration (Days)</Label>
                                            <div className="relative">
                                                <Input 
                                                    name="resultDetailedAccessDays" 
                                                    type="number" 
                                                    defaultValue={initialSettings?.resultDetailedAccessDays || 30} 
                                                    className="bg-background h-10 font-bold text-sm pr-14"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase pointer-events-none">Days</div>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-medium mt-2 leading-relaxed">
                                                Controls how long students can view question-by-question answer keys, proctoring timeline logs, and generated scorecard PDFs.
                                                <br />
                                                <span className="text-indigo-500 font-bold">Cumulative lifetime stats (Score, Percentile, Rank) remain preserved indefinitely.</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl border bg-background/50 space-y-4">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <Zap className="size-4" />
                                            <span className="text-xs font-black uppercase tracking-wider">Engine Performance Impact</span>
                                        </div>
                                        <ul className="space-y-2.5">
                                            {[
                                                "Prunes legacy question-response query complexity on multi-million records.",
                                                "Prevents heavy on-demand PDF recompilation load for older exams.",
                                                "Accelerates student dashboard load times for historical performance snapshots.",
                                                "Guarantees compliance with institutional digital exam retention standards."
                                            ].map((benefit, i) => (
                                                <li key={i} className="flex gap-2.5 text-xs font-medium text-muted-foreground leading-tight">
                                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Quick Links to Legal Dynamic Pages */}
                                <div className="p-5 rounded-2xl border bg-muted/20 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                            <FileText className="size-4 text-primary" /> Dynamic Legal Documents Hub
                                        </h4>
                                        <span className="text-[10px] text-muted-foreground">Managed via Pages Tab</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Full legal policies (Terms of Service, Privacy Policy, Refund Policy) are dynamically generated in the <strong>Pages</strong> tab and rendered at <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">/policies/[slug]</code>.
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {[
                                            { label: "Terms of Service", path: "/policies/terms-of-service" },
                                            { label: "Privacy Policy", path: "/policies/privacy-policy" },
                                            { label: "Refund Policy", path: "/policies/refund-policy" }
                                        ].map((item, i) => (
                                            <Link
                                                key={i}
                                                href={item.path}
                                                target="_blank"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground transition-colors"
                                            >
                                                <span>{item.label}</span>
                                                <ExternalLink className="size-3 text-muted-foreground" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 15. ADVANCED CONTENT TAB */}
                    <TabsContent value="advanced" forceMount className="mt-0 outline-none data-[state=inactive]:hidden space-y-6">
                        <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                        <Settings2 className="size-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Advanced Content & Micro-Copy Controls</CardTitle>
                                        <CardDescription className="text-xs font-medium">Fine-tune responsive typography scales, 4-step workflow diagrams, and enterprise promotional highlights.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6 border-t font-sans">
                                {/* Responsive Font Scale & Badges */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Desktop Hero Font Size (px)</Label>
                                        <div className="relative">
                                            <Input name="heroTitleFontSize" type="number" defaultValue={initialSettings?.heroTitleFontSize || 80} placeholder="80" className="h-10 text-xs pr-8" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">px</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mobile Hero Font Size (px)</Label>
                                        <div className="relative">
                                            <Input name="heroTitleMobileFontSize" type="number" defaultValue={initialSettings?.heroTitleMobileFontSize || 40} placeholder="40" className="h-10 text-xs pr-8" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">px</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Process Section Badge</Label>
                                        <Input name="processBadge" defaultValue={initialSettings?.processBadge || "Our Process"} className="h-10 text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Consultant Beta Badge</Label>
                                        <Input name="aiConsultantBadge" defaultValue={initialSettings?.aiConsultantBadge || "AI Consultant Beta"} className="h-10 text-xs" />
                                    </div>
                                </div>

                                {/* Process Section & Workflow */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Rocket className="size-4 text-primary" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                                "How It Works" 4-Step Process Section
                                            </h4>
                                        </div>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setProcessSteps([...processSteps, { icon: `0${processSteps.length + 1}`, title: "New Step", description: "" }])}
                                            className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                                        >
                                            <Plus className="size-3.5" /> Add Step
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Process Section Headline</Label>
                                        <Input name="processTitle" defaultValue={initialSettings?.processTitle || "From Setup to Success"} className="h-10 text-xs font-semibold max-w-md" />
                                    </div>

                                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                        {processSteps.map((step, i) => (
                                            <div key={i} className="p-4 rounded-xl border bg-background/60 hover:border-primary/30 transition-all space-y-3 relative">
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setProcessSteps(processSteps.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-red-500 rounded-lg cursor-pointer"
                                                >
                                                    <X className="size-3" />
                                                </Button>
                                                <div className="space-y-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Step Index / Number</Label>
                                                        <Input 
                                                            value={step.icon || ""} 
                                                            onChange={(e) => {
                                                                const newSteps = [...processSteps];
                                                                newSteps[i] = { ...newSteps[i], icon: e.target.value };
                                                                setProcessSteps(newSteps);
                                                            }}
                                                            placeholder="01"
                                                            className="h-8 text-xs font-bold font-mono w-16 text-center"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Step Title</Label>
                                                        <Input 
                                                            value={step.title || ""} 
                                                            onChange={(e) => {
                                                                const newSteps = [...processSteps];
                                                                newSteps[i] = { ...newSteps[i], title: e.target.value };
                                                                setProcessSteps(newSteps);
                                                            }}
                                                            className="h-8 text-xs font-bold"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description</Label>
                                                        <Textarea 
                                                            value={step.description || ""} 
                                                            onChange={(e) => {
                                                                const newSteps = [...processSteps];
                                                                newSteps[i] = { ...newSteps[i], description: e.target.value };
                                                                setProcessSteps(newSteps);
                                                            }}
                                                            className="h-20 text-xs resize-none leading-relaxed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Input name="processSteps" type="hidden" value={JSON.stringify(processSteps)} />
                                </div>

                                {/* Enterprise Banner Copy */}
                                <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t">
                                    <div className="space-y-4 p-5 rounded-2xl border bg-background/50">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="size-4 text-primary" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Enterprise Promo Card</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enterprise Title</Label>
                                                <Input name="enterpriseTitle" defaultValue={initialSettings?.enterpriseTitle || "Ready for Enterprise?"} className="h-10 text-xs font-semibold" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enterprise Description</Label>
                                                <Textarea name="enterpriseDescription" defaultValue={initialSettings?.enterpriseDescription} className="h-24 text-xs resize-none leading-relaxed" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* About Us Feature Highlights */}
                                    <div className="space-y-4 p-5 rounded-2xl border bg-background/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Star className="size-4 text-primary" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">About Platform Features ({aboutFeatures.length})</h4>
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => setAboutFeatures([...aboutFeatures, "New Feature"])}
                                                className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                                            >
                                                <Plus className="size-3.5" /> Add
                                            </Button>
                                        </div>
                                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                            {aboutFeatures.map((feat, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <Input 
                                                        value={feat} 
                                                        onChange={(e) => {
                                                            const newFeats = [...aboutFeatures];
                                                            newFeats[i] = e.target.value;
                                                            setAboutFeatures(newFeats);
                                                        }}
                                                        className="h-9 text-xs flex-1 bg-background"
                                                    />
                                                    <Button 
                                                        type="button" 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => setAboutFeatures(aboutFeatures.filter((_, idx) => idx !== i))}
                                                        className="size-9 text-muted-foreground hover:text-red-500 rounded-lg cursor-pointer shrink-0"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {aboutFeatures.length === 0 && (
                                                <p className="text-xs text-muted-foreground italic py-4 text-center">No about features defined.</p>
                                            )}
                                        </div>
                                        <Input name="aboutFeatures" type="hidden" value={JSON.stringify(aboutFeatures)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </form>

                {/* STICKY BOTTOM SAVE ACTION BAR - ALWAYS VISIBLE ACROSS ALL 15 TABS */}
                <div className="sticky bottom-20 md:bottom-4 z-30 flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-xl mt-6 transition-all animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="font-medium hidden sm:inline">Edge cache revalidation ready • Changes propagate instantly globally</span>
                        <span className="font-medium sm:hidden">Ready to sync</span>
                    </div>
                    <Button
                        type="submit"
                        disabled={isPending}
                        form="settings-form"
                        size="sm"
                        className="font-bold px-6 h-9 rounded-xl shadow-xs flex items-center gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving Settings...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </Button>
                </div>
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
                    type="button"
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl cursor-pointer"
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
                            type="button"
                            disabled={isPending || (!newBannerFile && !newBannerUrl)}
                            onClick={handleAdd}
                            className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
                                        type="button"
                                        onClick={() => handleToggle(banner.id, !banner.isActive)}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-9 text-[10px] font-black uppercase tracking-widest px-4 rounded-xl transition-all cursor-pointer",
                                            banner.isActive ? "border-green-500/20 bg-green-500/5 text-green-600 hover:bg-green-500/10" : "border-zinc-200 text-zinc-400 hover:bg-zinc-100"
                                        )}
                                    >
                                        {banner.isActive ? "Online" : "Offline"}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => handleDelete(banner.id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all cursor-pointer"
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
                    type="button"
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl cursor-pointer"
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
                            type="button"
                            disabled={isPending}
                            onClick={handleAdd}
                            className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
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
                                            type="button"
                                            onClick={() => handleDelete(faq.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all cursor-pointer"
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
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
                    type="button"
                    onClick={() => {
                        setEditingPlan(null);
                        setIsDialogOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl cursor-pointer"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Define Plan</span>
                </Button>
            </CardHeader>
            <CardContent className="p-6 border-t font-sans">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 group bg-card",
                                plan.isPopular
                                    ? "border-primary/50 shadow-md shadow-primary/5 bg-gradient-to-b from-primary/[0.04] via-card to-card"
                                    : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                            )}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-0 right-5 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-primary text-white text-[9.5px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                    <Sparkles className="size-3" />
                                    Recommended
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                            Tier #{plan.order ?? 0}
                                        </span>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                                            plan.isActive !== false ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-zinc-200 text-zinc-500"
                                        )}>
                                            {plan.isActive !== false ? "Active" : "Disabled"}
                                        </span>
                                    </div>
                                    {plan.isCustom && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                                            Custom
                                        </span>
                                    )}
                                </div>

                                <h4 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                    {plan.name}
                                </h4>
                                {plan.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                        {plan.description}
                                    </p>
                                )}

                                {/* Price block */}
                                <div className="my-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 space-y-2">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Monthly Rate</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black tracking-tight text-foreground">₹{plan.price1Month ?? plan.priceMonthly ?? 0}</span>
                                            <span className="text-[10px] font-semibold text-muted-foreground ml-1">/mo</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-xs">
                                        <span className="text-[10px] font-semibold text-muted-foreground">Annual (12 Mo)</span>
                                        <span className="font-bold text-foreground">₹{plan.price12Month ?? plan.priceYearly ?? 0} <span className="text-[9px] font-normal text-muted-foreground">/yr</span></span>
                                    </div>
                                </div>

                                {/* Resource Quota Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs my-3">
                                    <div className="p-2 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <Users className="size-3.5 text-blue-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Students</p>
                                            <p className="text-xs font-bold truncate">{plan.maxStudents1Month ?? plan.maxStudents12Month ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <GraduationCap className="size-3.5 text-purple-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Teachers</p>
                                            <p className="text-xs font-bold truncate">{plan.maxTeachers1Month ?? plan.maxTeachers12Month ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <FileText className="size-3.5 text-emerald-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Exams</p>
                                            <p className="text-xs font-bold truncate">{plan.maxExams1Month ?? plan.maxExams12Month ?? 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/50 flex items-center gap-2">
                                        <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">AI Credits</p>
                                            <p className="text-xs font-bold truncate">{plan.aiLimit1Month ?? plan.aiLimit12Month ?? 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                {plan.features && plan.features.length > 0 && (
                                    <div className="space-y-1.5 my-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                                        <p className="text-[9.5px] font-black uppercase tracking-wider text-muted-foreground">Included Capabilities</p>
                                        {plan.features.slice(0, 4).map((f: string, i: number) => (
                                            <div key={i} className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                                <span className="line-clamp-1">{f}</span>
                                            </div>
                                        ))}
                                        {plan.features.length > 4 && (
                                            <p className="text-[10px] text-muted-foreground italic pl-5.5">
                                                +{plan.features.length - 4} more features
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="w-full flex items-center justify-between pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 mt-4">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setEditingPlan(plan);
                                        setIsDialogOpen(true);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-bold gap-1.5 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                >
                                    <Settings2 className="size-3.5" />
                                    Configure Tier
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleDelete(plan.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {plans.length === 0 && (
                        <div className="col-span-full p-12 text-center text-muted-foreground italic text-xs border border-dashed rounded-xl">
                            No pricing tiers configured yet. Click "Define Plan" above to create one.
                        </div>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl bg-background">
                        <div className="p-6 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-start gap-3.5 sticky top-0 z-20 backdrop-blur-md">
                            <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                <CreditCard className="size-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                                <DialogTitle className="text-lg font-bold text-foreground">
                                    {editingPlan ? `Configure Tier: ${editingPlan.name}` : "Define New Pricing Tier"}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Configure institutional resource quotas, multi-duration billing cycles, and commercial feature capabilities.
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="p-6 sm:p-7">
                            <PricingPlanForm
                                initialData={editingPlan}
                                onSuccess={() => {
                                    setEditingPlan(null);
                                    setIsDialogOpen(false);
                                }}
                                onCancel={() => {
                                    setIsDialogOpen(false);
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

function PagesManager({ pages }: { pages: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [editingPage, setEditingPage] = useState<any>(null);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [docFile, setDocFile] = useState<File | null>(null);
    const [isActive, setIsActive] = useState(true);

    function resetForm() {
        setTitle("");
        setSlug("");
        setContent("");
        setFileUrl("");
        setDocFile(null);
        setIsActive(true);
        setEditingPage(null);
        setIsAdding(false);
    }

    function handleEdit(page: any) {
        setEditingPage(page);
        setTitle(page.title);
        setSlug(page.slug);
        setContent(page.content);
        setFileUrl(page.fileUrl || "");
        setIsActive(page.isActive);
        setIsAdding(true);
    }

    async function handleSave() {
        startTransition(async () => {
            const cleanSlug = slug.toLowerCase().trim().replace(/[^\w-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || "page";
            const formData = new FormData();
            if (editingPage) formData.append("id", editingPage.id);
            formData.append("title", title.trim());
            formData.append("slug", cleanSlug);
            formData.append("content", content);
            formData.append("fileUrl", fileUrl);
            if (docFile) formData.append("docFile", docFile);
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
                    type="button"
                    onClick={() => { if (isAdding) resetForm(); else setIsAdding(true); }}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl cursor-pointer"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "New Page"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                    Page Title (Legal/Policy Name)
                                    {title && (
                                        <button type="button" onClick={() => setTitle("")} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                    )}
                                </Label>
                                <Input
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        // Auto-slug generation
                                        if (!editingPage) {
                                            setSlug(e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''));
                                        }
                                    }}
                                    placeholder="e.g. Privacy Policy"
                                    className="bg-background h-11 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                />
                            </div>
                            <div className="space-y-2 group">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between gap-2">
                                    URL Slug (Automatic)
                                    {slug && (
                                        <button type="button" onClick={() => setSlug("")} className="text-red-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Clear</button>
                                    )}
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">/policies/</span>
                                    <Input
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/ /g, "-"))}
                                        placeholder="privacy-policy"
                                        className="bg-background h-11 pl-20 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6 items-end">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Policy Attachment (PDF/Image)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                                        className="bg-background border-zinc-200 dark:border-zinc-800 h-11 flex-1 text-xs"
                                    />
                                    {fileUrl && (
                                        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" asChild title="View current attachment">
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4" /></a>
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Recommended: Official Signed PDF or Stamped Document</p>
                            </div>
                            <div className="flex items-center gap-4 h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 rounded-xl">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Enable Page Visibility</Label>
                                <div className="flex items-center gap-2 ml-auto">
                                    <span className={cn("text-[8px] font-black uppercase tracking-widest", isActive ? "text-emerald-500" : "text-zinc-400")}>
                                        {isActive ? "Live" : "Draft"}
                                    </span>
                                    <input 
                                        type="checkbox" 
                                        checked={isActive} 
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="sr-only peer"
                                        id="page-active-toggle"
                                    />
                                    <label 
                                        htmlFor="page-active-toggle"
                                        className="relative w-10 h-5 bg-zinc-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between">
                                Legal Content (Reader Friendly Mode)
                                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Supports Standard HTML Tags</span>
                            </Label>
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter page text content here..."
                                className="min-h-[400px] font-mono text-[11px] leading-relaxed border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-zinc-400 p-6 bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl"
                            />
                        </div>
                        <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                type="button"
                                disabled={isPending}
                                onClick={handleSave}
                                className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl px-12 shadow-xl shadow-zinc-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                                {isPending ? "Syncing..." : editingPage ? "Push Update" : "Deploy Document"}
                            </Button>
                            {editingPage && (
                                <Link 
                                    href={`/policies/${slug}`} 
                                    target="_blank"
                                    className="flex items-center gap-2 h-12 px-6 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                                >
                                    View Live <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {pages.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic text-xs">No dynamic pages on active registry.</div>
                ) : (
                    <div className="divide-y relative border-t lg:border-none">
                        {pages.map(page => (
                            <div key={page.id} className="group relative flex flex-col sm:flex-row sm:items-center gap-6 p-8 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all border-b last:border-0 overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors shadow-sm shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">{page.title}</p>
                                        <div className={cn(
                                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest",
                                            page.isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                                        )}>
                                            {page.isActive ? "Production" : "Draft"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span className="flex items-center gap-1.5"><Globe2 className="w-3 h-3" /> /policies/{page.slug}</span>
                                        {page.fileUrl && (
                                            <span className="flex items-center gap-1.5 text-primary"><BookMarked className="w-3 h-3" /> Signed Document</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:ml-auto">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(page)}
                                        className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700 transition-all cursor-pointer"
                                    >
                                        <Settings2 className="w-4 h-4 text-slate-400" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(page.id)}
                                        className="h-10 w-10 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="h-10 gap-2 px-6 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-sm">
                                        <Link href={`/policies/${page.slug}`} target="_blank">
                                            Preview <ArrowRight className="w-3 h-3" />
                                        </Link>
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
                    type="button"
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl cursor-pointer"
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
                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={handleAdd}
                            className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl cursor-pointer"
                        >
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
                            <Button
                                type="button"
                                onClick={() => handleDeleteAdv(adv.id)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-red-500 cursor-pointer"
                            >
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
                    type="button"
                    onClick={() => {
                        if (isAdding) resetForm();
                        else setIsAdding(true);
                    }}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl cursor-pointer"
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
                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={handleSave}
                            className="w-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl cursor-pointer"
                        >
                            {isPending ? "Syncing..." : editingId ? "Update Service" : "Deploy Service"}
                        </Button>
                    </div>
                )}
                <div className="p-6">
                    {services.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground italic text-xs border border-dashed rounded-xl">
                            No services defined in the catalog yet. Click "Add Service" above to publish your first offering.
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {services.map(ser => {
                                const Icon = getIconByName(ser.iconName);
                                return (
                                    <div
                                        key={ser.id}
                                        className={cn(
                                            "relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 group bg-card",
                                            ser.isPrimary
                                                ? "border-primary/40 shadow-sm bg-gradient-to-b from-primary/[0.03] to-card"
                                                : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm"
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div
                                                    className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
                                                    style={{ backgroundColor: ser.iconColor || "#3b82f6" }}
                                                >
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                    {ser.isPrimary && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                                            Featured
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-bold text-muted-foreground px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                                                        Order #{ser.order ?? 0}
                                                    </span>
                                                </div>
                                            </div>

                                            <h4 className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                {ser.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                {ser.description || "No description provided."}
                                            </p>

                                            {ser.features?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-3">
                                                    {ser.features.map((f: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-muted-foreground border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1"
                                                        >
                                                            <span className="size-1 rounded-full bg-primary" />
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-zinc-200/70 dark:border-zinc-800/70 mt-4">
                                            <Button
                                                type="button"
                                                onClick={() => handleEdit(ser)}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs font-bold gap-1.5 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                            >
                                                <Settings2 className="size-3.5" />
                                                Edit Solution
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => handleDeleteServ(ser.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
