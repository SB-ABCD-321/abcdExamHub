"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertPricingPlan } from "@/actions/pricing";
import { useRouter } from "next/navigation";
import {
    Loader2, Plus, Trash2, Tag, Hash, FileText,
    Users, GraduationCap, Sparkles, CheckCircle2,
    CreditCard, Star, Building2, ShieldCheck, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    price1Month: z.coerce.number().min(0),
    price6Month: z.coerce.number().min(0),
    price12Month: z.coerce.number().min(0),
    maxStudents1Month: z.coerce.number().min(0),
    maxStudents6Month: z.coerce.number().min(0),
    maxStudents12Month: z.coerce.number().min(0),
    maxTeachers1Month: z.coerce.number().min(0),
    maxTeachers6Month: z.coerce.number().min(0),
    maxTeachers12Month: z.coerce.number().min(0),
    maxExams1Month: z.coerce.number().min(0),
    maxExams6Month: z.coerce.number().min(0),
    maxExams12Month: z.coerce.number().min(0),
    aiLimit1Month: z.coerce.number().min(0),
    aiLimit6Month: z.coerce.number().min(0),
    aiLimit12Month: z.coerce.number().min(0),
    features: z.array(z.string()).min(1, "At least one feature is required"),
    isPopular: z.boolean().default(false),
    isActive: z.boolean().default(true),
    isCustom: z.boolean().default(false),
    order: z.coerce.number().default(0),
    buttonText: z.string().default("Get Started"),
    buttonLink: z.string().optional(),
});

const POPULAR_SUGGESTIONS = [
    "Unlimited Question Bank Shards",
    "Automated AI Proctoring & Anti-Cheat",
    "Custom Watermarked Institutional Reports",
    "SMS & WhatsApp Candidate Dispatch",
    "Dedicated Account Manager",
    "Custom Institutional Sub-domain & SSL"
];

export function PricingPlanForm({
    initialData,
    onSuccess,
    onCancel
}: {
    initialData?: any;
    onSuccess?: () => void;
    onCancel?: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [features, setFeatures] = useState<string[]>(
        initialData?.features && initialData.features.length > 0
            ? initialData.features
            : [""]
    );

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            id: initialData?.id || undefined,
            name: initialData?.name || "",
            description: initialData?.description || "",
            price1Month: initialData?.price1Month ?? 0,
            price6Month: initialData?.price6Month ?? 0,
            price12Month: initialData?.price12Month ?? 0,
            maxStudents1Month: initialData?.maxStudents1Month ?? 0,
            maxStudents6Month: initialData?.maxStudents6Month ?? 0,
            maxStudents12Month: initialData?.maxStudents12Month ?? 0,
            maxTeachers1Month: initialData?.maxTeachers1Month ?? 0,
            maxTeachers6Month: initialData?.maxTeachers6Month ?? 0,
            maxTeachers12Month: initialData?.maxTeachers12Month ?? 0,
            maxExams1Month: initialData?.maxExams1Month ?? 0,
            maxExams6Month: initialData?.maxExams6Month ?? 0,
            maxExams12Month: initialData?.maxExams12Month ?? 0,
            aiLimit1Month: initialData?.aiLimit1Month ?? 0,
            aiLimit6Month: initialData?.aiLimit6Month ?? 0,
            aiLimit12Month: initialData?.aiLimit12Month ?? 0,
            features: initialData?.features || [""],
            isPopular: initialData?.isPopular ?? false,
            isActive: initialData?.isActive ?? true,
            isCustom: initialData?.isCustom ?? false,
            order: initialData?.order ?? 0,
            buttonText: initialData?.buttonText || "Get Started",
            buttonLink: initialData?.buttonLink || "",
        },
    });

    async function onSubmit(values: any) {
        setLoading(true);
        try {
            const cleanFeatures = features.map(f => f.trim()).filter(f => f.length > 0);
            await upsertPricingPlan({
                ...values,
                features: cleanFeatures.length > 0 ? cleanFeatures : ["Standard Platform Access"]
            });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const addFeature = () => setFeatures([...features, ""]);
    const removeFeature = (index: number) => {
        if (features.length <= 1) {
            setFeatures([""]);
            return;
        }
        setFeatures(features.filter((_, i) => i !== index));
    };
    const updateFeature = (index: number, value: string) => {
        const next = [...features];
        next[index] = value;
        setFeatures(next);
    };

    const addSuggestion = (text: string) => {
        if (features.includes(text)) return;
        if (features.length === 1 && features[0].trim() === "") {
            setFeatures([text]);
        } else {
            setFeatures([...features, text]);
        }
    };

    const renderCycleCard = (
        title: string,
        durationBadge: string,
        suffix: string,
        isAnnual = false
    ) => (
        <div
            className={cn(
                "relative rounded-2xl border p-4.5 sm:p-5 flex flex-col justify-between transition-all bg-card",
                isAnnual
                    ? "border-primary/50 shadow-md shadow-primary/5 bg-gradient-to-b from-primary/[0.03] via-card to-card ring-1 ring-primary/20"
                    : "border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700"
            )}
        >
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <div>
                        <h4 className="text-sm font-bold text-foreground tracking-tight">
                            {title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Commitment cycle</p>
                    </div>
                    <span
                        className={cn(
                            "text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                            isAnnual
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        )}
                    >
                        {durationBadge}
                    </span>
                </div>

                {/* Price Input */}
                <FormField
                    control={form.control}
                    name={`price${suffix}` as any}
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Cycle Price</span>
                                <span className="text-[9px] font-normal text-muted-foreground">(INR)</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">
                                        ₹
                                    </span>
                                    <Input
                                        type="number"
                                        className="pl-8 h-10 font-bold text-base bg-background/50 border-zinc-200 dark:border-zinc-800"
                                        placeholder="0"
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Divider */}
                <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-[9px] uppercase">
                        <span className="bg-card px-2 font-black tracking-wider text-muted-foreground">
                            Quota Caps
                        </span>
                    </div>
                </div>

                {/* Quota inputs */}
                <div className="space-y-3">
                    <FormField
                        control={form.control}
                        name={`maxStudents${suffix}` as any}
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Users className="size-3 text-blue-500 shrink-0" />
                                    <span>Max Students</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-9 text-xs bg-background/50"
                                        placeholder="50"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={`maxTeachers${suffix}` as any}
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <GraduationCap className="size-3 text-purple-500 shrink-0" />
                                    <span>Max Faculty</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-9 text-xs bg-background/50"
                                        placeholder="5"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={`maxExams${suffix}` as any}
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="size-3 text-emerald-500 shrink-0" />
                                    <span>Exams / Month</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-9 text-xs bg-background/50"
                                        placeholder="10"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name={`aiLimit${suffix}` as any}
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Sparkles className="size-3 text-amber-500 shrink-0" />
                                    <span>AI Credits / Month</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        className="h-9 text-xs bg-background/50"
                                        placeholder="20"
                                        {...field}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 1. PLAN IDENTITY & ROUTING */}
                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <Tag className="size-4 text-primary" />
                        <h3 className="text-sm font-bold text-foreground">
                            Tier Identity & Public Routing
                        </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="lg:col-span-2 space-y-1.5">
                                    <FormLabel className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Plan Name
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Starter Academy, Coaching Hub"
                                            className="h-10 text-sm font-semibold"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Hash className="size-3" /> Display Order
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="1"
                                            className="h-10 text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="buttonText"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                                        CTA Button Label
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Get Started"
                                            className="h-10 text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-1">
                        <FormField
                            control={form.control}
                            name="buttonLink"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                                        CTA Target Route
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. /sign-up, /contact, or payment link"
                                            className="h-10 text-xs font-mono"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Target Audience & Summary
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ideal for coaching centers, tutors, and test series institutes."
                                            className="h-10 text-xs"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* 2. MULTI-CYCLE BILLING & QUOTA ENGINE */}
                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <div className="flex items-center gap-2">
                            <CreditCard className="size-4 text-primary" />
                            <div>
                                <h3 className="text-sm font-bold text-foreground">
                                    Multi-Duration Commitment Shards
                                </h3>
                                <p className="text-[10.5px] text-muted-foreground">
                                    Define pricing and quota caps for 1-month, 6-month, and 12-month billing periods.
                                </p>
                            </div>
                        </div>
                        <span className="text-[9.5px] font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full w-fit">
                            3 Independent Cycles
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 pt-2">
                        {renderCycleCard("1 Month Setup", "Monthly Base", "1Month", false)}
                        {renderCycleCard("6 Months Setup", "Semi-Annual", "6Month", false)}
                        {renderCycleCard("12 Months Setup", "Annual • Best Value", "12Month", true)}
                    </div>
                </div>

                {/* 3. INCLUDED FEATURES CHECKLIST */}
                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <div>
                                <h3 className="text-sm font-bold text-foreground">
                                    Commercial Capabilities & Bullet Points
                                </h3>
                                <p className="text-[10.5px] text-muted-foreground">
                                    Featured bullet points highlighted on the public pricing comparison matrix.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addFeature}
                            className="h-8 gap-1.5 font-bold text-xs rounded-xl"
                        >
                            <Plus className="size-3.5" />
                            <span>Add Bullet</span>
                        </Button>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Quick-Add Common Features:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {POPULAR_SUGGESTIONS.map((sug, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => addSuggestion(sug)}
                                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground transition-colors cursor-pointer border border-zinc-200/60 dark:border-zinc-700/60 flex items-center gap-1"
                                >
                                    <Plus className="size-2.5 text-primary" />
                                    {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feature items */}
                    <div className="space-y-2 pt-2">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                                <span className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-bold flex items-center justify-center shrink-0 text-muted-foreground">
                                    #{index + 1}
                                </span>
                                <div className="relative flex-1">
                                    <Check className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-emerald-500 pointer-events-none" />
                                    <Input
                                        value={feature}
                                        onChange={(e) => updateFeature(index, e.target.value)}
                                        placeholder="e.g. Automated Exam Grading & Result Analysis"
                                        className="h-9.5 pl-9 text-xs bg-background/60"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFeature(index)}
                                    className="size-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg shrink-0 cursor-pointer"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. VISIBILITY & BEHAVIOR TOGGLE CARDS */}
                <div className="grid sm:grid-cols-3 gap-3.5">
                    <FormField
                        control={form.control}
                        name="isPopular"
                        render={({ field }) => (
                            <label
                                className={cn(
                                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                    field.value
                                        ? "bg-amber-500/[0.06] border-amber-500/40 shadow-sm ring-1 ring-amber-500/20"
                                        : "bg-card border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300"
                                )}
                            >
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-0.5"
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="size-3.5 text-amber-500 fill-amber-500" />
                                        <span className="text-xs font-bold text-foreground">
                                            Recommended Tier
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Displays the golden recommendation badge on public pricing.
                                    </p>
                                </div>
                            </label>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                            <label
                                className={cn(
                                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                    field.value
                                        ? "bg-emerald-500/[0.06] border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20"
                                        : "bg-card border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300"
                                )}
                            >
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-0.5"
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                                        <span className="text-xs font-bold text-foreground">
                                            Active Visibility
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Publish this plan live for new signups and workspace upgrades.
                                    </p>
                                </div>
                            </label>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="isCustom"
                        render={({ field }) => (
                            <label
                                className={cn(
                                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                                    field.value
                                        ? "bg-purple-500/[0.06] border-purple-500/40 shadow-sm ring-1 ring-purple-500/20"
                                        : "bg-card border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300"
                                )}
                            >
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-0.5"
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 className="size-3.5 text-purple-500" />
                                        <span className="text-xs font-bold text-foreground">
                                            Enterprise Shard
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        Hides fixed quotas and prompts for institutional sales contact.
                                    </p>
                                </div>
                            </label>
                        )}
                    />
                </div>

                {/* 5. SUBMIT ACTION BAR */}
                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur-md py-3 z-10">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                            className="h-11 px-6 font-bold text-xs rounded-xl"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-11 px-8 font-black uppercase tracking-wider text-xs rounded-xl gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Deploying Tier...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="size-4" />
                                <span>{initialData ? "Save Tier Configuration" : "Deploy New Plan"}</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
