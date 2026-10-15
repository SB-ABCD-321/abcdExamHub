"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
    Save, 
    Settings2, 
    Contact, 
    CreditCard, 
    ShieldCheck, 
    Sparkles, 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    ChevronLeft, 
    ChevronRight, 
    ExternalLink, 
    Info, 
    Loader2
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface WorkspaceProps {
    id: string;
    name: string;
    description?: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    gstNumber: string | null;
    billingAddress: string | null;
    status?: string;
    maxStudents?: number;
    maxTeachers?: number;
    maxExams?: number;
    maxQuestions?: number;
    maxConcurrentExams?: number;
    aiLimit?: number;
    aiGenerationsCount?: number;
    aiUnlimited?: boolean;
}

export function WorkspaceSettingsForm({ workspace }: { workspace: WorkspaceProps }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("branding");
    const tabsScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const [formData, setFormData] = useState({
        name: workspace.name || "",
        description: workspace.description || "",
        logoUrl: workspace.logoUrl || "",
        contactEmail: workspace.contactEmail || "",
        contactPhone: workspace.contactPhone || "",
        address: workspace.address || "",
        gstNumber: workspace.gstNumber || "",
        billingAddress: workspace.billingAddress || "",
    });

    const checkScroll = () => {
        if (!tabsScrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = tabsScrollRef.current;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, []);

    const scrollTabs = (direction: "left" | "right") => {
        if (!tabsScrollRef.current) return;
        const offset = direction === "left" ? -200 : 200;
        tabsScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
        setTimeout(checkScroll, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/workspaces/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ workspaceId: workspace.id, ...formData }),
            });

            if (!response.ok) {
                const txt = await response.text();
                throw new Error(txt || "Failed to save settings");
            }

            toast.success("Workspace settings updated successfully!");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to update settings");
        } finally {
            setLoading(false);
        }
    }

    const tabStyles = "rounded-xl px-3.5 py-2 text-xs font-semibold tracking-tight transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs flex items-center gap-2 hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer shrink-0";

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Horizontal Scrollable Tabs Bar matching other settings pages */}
                <div className="flex items-center justify-between gap-2 mb-6 pb-2 border-b border-border/60">
                    <div className="relative flex items-center gap-1 min-w-0 flex-1">
                        <button
                            type="button"
                            aria-label="Scroll tabs left"
                            disabled={!canScrollLeft}
                            onClick={() => scrollTabs("left")}
                            className={cn(
                                "hidden md:flex shrink-0 items-center justify-center w-8 h-8 rounded-lg border bg-background shadow-xs text-muted-foreground transition-all duration-200 cursor-pointer",
                                canScrollLeft ? "hover:bg-muted opacity-100" : "opacity-40 cursor-not-allowed"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div
                            ref={tabsScrollRef}
                            onScroll={checkScroll}
                            className="overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-1"
                        >
                            <TabsList className="bg-muted/40 p-1 rounded-2xl h-auto flex gap-1.5 min-w-max border border-border/50">
                                <TabsTrigger value="branding" className={tabStyles}>
                                    <Settings2 className="w-4 h-4" />
                                    <span>Branding & Identity</span>
                                </TabsTrigger>

                                <TabsTrigger value="contacts" className={tabStyles}>
                                    <Contact className="w-4 h-4" />
                                    <span>Contacts & Helpline</span>
                                </TabsTrigger>

                                <TabsTrigger value="billing" className={tabStyles}>
                                    <CreditCard className="w-4 h-4" />
                                    <span>Billing & GST</span>
                                </TabsTrigger>

                                <TabsTrigger value="quotas" className={tabStyles}>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Quotas & Limits</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <button
                            type="button"
                            aria-label="Scroll tabs right"
                            disabled={!canScrollRight}
                            onClick={() => scrollTabs("right")}
                            className={cn(
                                "hidden md:flex shrink-0 items-center justify-center w-8 h-8 rounded-lg border bg-background shadow-xs text-muted-foreground transition-all duration-200 cursor-pointer",
                                canScrollRight ? "hover:bg-muted opacity-100" : "opacity-40 cursor-not-allowed"
                            )}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* TAB 1: Branding & Identity */}
                <TabsContent value="branding" className="mt-0 outline-none space-y-6">
                    <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-primary" />
                                <span>Brand Identity</span>
                            </CardTitle>
                            <CardDescription className="text-xs font-medium">
                                Fundamental configuration for platform appearance, student mock portal headers, and test papers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 border-t font-sans">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Institution Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Apex Engineering Institute"
                                        required
                                        className="h-10 text-xs bg-background"
                                        disabled={loading}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Displayed on candidate results and invitation certificates.</p>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="logoUrl" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Institutional Logo URL
                                    </Label>
                                    <Input
                                        id="logoUrl"
                                        name="logoUrl"
                                        value={formData.logoUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/logo.png"
                                        className="h-10 text-xs font-mono bg-background"
                                        disabled={loading}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Direct URL pointing to institutional crest or emblem.</p>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Department Tagline or Description
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief motto, accreditation note, or department overview..."
                                    className="min-h-[85px] text-xs bg-background"
                                    disabled={loading}
                                />
                            </div>

                            {/* Live Branding Preview */}
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Sparkles className="size-3.5 text-primary" />
                                        <span>Live Branding Preview</span>
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium">Appears on candidate test sheets</span>
                                </div>
                                <div className="p-4 rounded-xl bg-card border border-border/70 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-11 rounded-xl bg-muted border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                                            {formData.logoUrl ? (
                                                <Image
                                                    src={formData.logoUrl}
                                                    alt="Preview Logo"
                                                    width={44}
                                                    height={44}
                                                    className="w-full h-full object-contain p-0.5"
                                                    onError={(e) => {
                                                        (e.target as any).style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <Building2 className="size-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-foreground truncate">
                                                {formData.name || "Your Institution Name"}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate">
                                                {formData.description || "Official Assessment & Examination Center"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary shrink-0">
                                        <ShieldCheck className="size-3" />
                                        <span>Proctored Session</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: Contacts & Helpline */}
                <TabsContent value="contacts" className="mt-0 outline-none space-y-6">
                    <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Contact className="w-4 h-4 text-primary" />
                                <span>Contact Details</span>
                            </CardTitle>
                            <CardDescription className="text-xs font-medium">
                                Channels through which examinees and faculty coordinators can contact support.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 border-t font-sans">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <Label htmlFor="contactEmail" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Mail className="size-3 text-muted-foreground" />
                                        <span>Support Mailbox</span>
                                    </Label>
                                    <Input
                                        id="contactEmail"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleChange}
                                        placeholder="support@institute.edu"
                                        type="email"
                                        className="h-10 text-xs bg-background"
                                        disabled={loading}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Inquiries from students route to this address.</p>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="contactPhone" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Phone className="size-3 text-muted-foreground" />
                                        <span>Helpline Phone Number</span>
                                    </Label>
                                    <Input
                                        id="contactPhone"
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleChange}
                                        placeholder="+91 (0) 98765-43210"
                                        type="tel"
                                        className="h-10 text-xs bg-background"
                                        disabled={loading}
                                    />
                                    <p className="text-[11px] text-muted-foreground">Available for immediate exam hall assistance.</p>
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="address" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <MapPin className="size-3 text-muted-foreground" />
                                    <span>Campus / Office Location</span>
                                </Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Academic Block 4, Sector 12, Main University Road..."
                                    className="min-h-[85px] text-xs bg-background"
                                    disabled={loading}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: Billing & GST */}
                <TabsContent value="billing" className="mt-0 outline-none space-y-6">
                    <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span>Compliance & Billing Identity</span>
                            </CardTitle>
                            <CardDescription className="text-xs font-medium">
                                Configure legal identification for tax-compliant invoicing and accounting statements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 border-t font-sans">
                            <div className="space-y-2 group">
                                <Label htmlFor="gstNumber" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    GSTIN Number (Optional)
                                </Label>
                                <Input
                                    id="gstNumber"
                                    name="gstNumber"
                                    value={formData.gstNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. 29ABCDE1234F1Z5"
                                    className="h-10 text-xs font-mono uppercase tracking-wider bg-background"
                                    disabled={loading}
                                />
                                <p className="text-[11px] text-muted-foreground">Used on generated PDF tax invoices for institutional tax filing.</p>
                            </div>

                            <div className="space-y-2 group">
                                <Label htmlFor="billingAddress" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Registered Legal Billing Address
                                </Label>
                                <Textarea
                                    id="billingAddress"
                                    name="billingAddress"
                                    value={formData.billingAddress}
                                    onChange={handleChange}
                                    placeholder="Enter your registered billing address..."
                                    className="min-h-[100px] text-xs bg-background"
                                    disabled={loading}
                                />
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                                    <Info className="size-4 text-primary shrink-0 mt-0.5" />
                                    <span>
                                        This exact billing address and GSTIN will be stamped onto every official tax receipt generated under your Billing & Renew portal.
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: Quotas & Limits */}
                <TabsContent value="quotas" className="mt-0 outline-none space-y-6">
                    <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                <span>Plan Allocations & Governance</span>
                            </CardTitle>
                            <CardDescription className="text-xs font-medium">
                                Hardware scaling tier and resource quotas allocated to this institutional tenant.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 border-t font-sans">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground">Total Enrolled Seats</div>
                                    <div className="text-xl font-black text-foreground">{workspace.maxStudents ?? 100}</div>
                                    <div className="text-[10px] text-muted-foreground">Registered candidates allowed</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground">Faculty Member Quota</div>
                                    <div className="text-xl font-black text-foreground">{workspace.maxTeachers ?? 5}</div>
                                    <div className="text-[10px] text-muted-foreground">Instructor licenses provisioned</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground">Concurrent Examinees</div>
                                    <div className="text-xl font-black text-foreground">{workspace.maxConcurrentExams ?? 100}</div>
                                    <div className="text-[10px] text-muted-foreground">Live simultaneous exam sessions</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground">Exam Repositories</div>
                                    <div className="text-xl font-black text-foreground">{workspace.maxExams ?? 10}</div>
                                    <div className="text-[10px] text-muted-foreground">Active tests in repository</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground">Question Bank Limit</div>
                                    <div className="text-xl font-black text-foreground">{workspace.maxQuestions ?? 500}</div>
                                    <div className="text-[10px] text-muted-foreground">Stored question capacity</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-1">
                                    <div className="text-[11px] font-semibold text-muted-foreground">AI Generation Engine</div>
                                    <div className="text-xl font-black text-amber-500">
                                        {workspace.aiUnlimited ? "Unlimited" : `${workspace.aiLimit ?? 10} Prompts`}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">Gemini AI question authoring</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-foreground">Need higher resource allowances?</div>
                                    <div className="text-[11px] text-muted-foreground">
                                        Upgrade your tier to scale concurrent examinees, faculty licenses, and authoring quotas.
                                    </div>
                                </div>
                                <Link href="/admin/billing">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-8.5 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 shrink-0"
                                    >
                                        <span>Upgrade Plan</span>
                                        <ExternalLink className="size-3" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* STICKY BOTTOM SAVE ACTION BAR - Always visible, elevated on mobile above bottom nav (bottom-20 md:bottom-4) */}
            <div className="sticky bottom-20 md:bottom-4 z-30 flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-xl mt-6 transition-all">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="font-medium hidden sm:inline">Settings save directly to institutional database</span>
                    <span className="font-medium sm:hidden">Ready to update</span>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="font-bold px-6 h-10 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer transition-transform active:scale-98"
                >
                    {loading ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>Saving Settings...</span>
                        </>
                    ) : (
                        <>
                            <Save className="size-4" />
                            <span>Save Changes</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
