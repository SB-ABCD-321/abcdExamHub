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
import { Loader2, Plus, Trash2 } from "lucide-react";

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

export function PricingPlanForm({ initialData, onSuccess }: { initialData?: any, onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [features, setFeatures] = useState<string[]>(initialData?.features || [""]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            id: initialData?.id || undefined,
            name: initialData?.name || "",
            description: initialData?.description || "",
            price1Month: initialData?.price1Month || 0,
            price6Month: initialData?.price6Month || 0,
            price12Month: initialData?.price12Month || 0,
            maxStudents1Month: initialData?.maxStudents1Month || 0,
            maxStudents6Month: initialData?.maxStudents6Month || 0,
            maxStudents12Month: initialData?.maxStudents12Month || 0,
            maxTeachers1Month: initialData?.maxTeachers1Month || 0,
            maxTeachers6Month: initialData?.maxTeachers6Month || 0,
            maxTeachers12Month: initialData?.maxTeachers12Month || 0,
            maxExams1Month: initialData?.maxExams1Month || 0,
            maxExams6Month: initialData?.maxExams6Month || 0,
            maxExams12Month: initialData?.maxExams12Month || 0,
            aiLimit1Month: initialData?.aiLimit1Month || 0,
            aiLimit6Month: initialData?.aiLimit6Month || 0,
            aiLimit12Month: initialData?.aiLimit12Month || 0,
            features: initialData?.features || [""],
            isPopular: initialData?.isPopular || false,
            isActive: initialData?.isActive ?? true,
            isCustom: initialData?.isCustom ?? false,
            order: initialData?.order || 0,
            buttonText: initialData?.buttonText || "Get Started",
            buttonLink: initialData?.buttonLink || "",
        },
    });

    async function onSubmit(values: any) {
        setLoading(true);
        try {
            await upsertPricingPlan({ ...values, features: features.filter(f => f.trim() !== "") });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const addFeature = () => setFeatures([...features, ""]);
    const removeFeature = (index: number) => setFeatures(features.filter((_, i) => i !== index));
    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...features];
        newFeatures[index] = value;
        setFeatures(newFeatures);
    };

    const renderLimitsGroup = (durationLabel: string, suffix: string) => (
        <div className="space-y-4 p-4 bg-white dark:bg-zinc-950 rounded-xl border border-border/50 shadow-sm">
            <h3 className="font-bold text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> {durationLabel} Setup
            </h3>
            <FormField control={form.control} name={`price${suffix}` as any} render={({ field }: { field: any }) => (
                <FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name={`maxStudents${suffix}` as any} render={({ field }: { field: any }) => (
                <FormItem><FormLabel>Max Students</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name={`maxTeachers${suffix}` as any} render={({ field }: { field: any }) => (
                <FormItem><FormLabel>Max Teachers</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name={`maxExams${suffix}` as any} render={({ field }: { field: any }) => (
                <FormItem><FormLabel>Exams / Month</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name={`aiLimit${suffix}` as any} render={({ field }: { field: any }) => (
                <FormItem><FormLabel>AI Credits / Month</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
        </div>
    );

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Plan Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Pro Plan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="order"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Display Order</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }: { field: any }) => (
                        <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the plan..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid md:grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-zinc-900 rounded-2xl border">
                    {renderLimitsGroup("1 Month", "1Month")}
                    {renderLimitsGroup("6 Months", "6Month")}
                    {renderLimitsGroup("12 Months", "12Month")}
                </div>

                <div className="space-y-4">
                    <FormLabel>Features List (For bullet points)</FormLabel>
                    {features.map((feature, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input
                                value={feature}
                                onChange={(e) => updateFeature(index, e.target.value)}
                                placeholder="E.g. Priority Support"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeFeature(index)}
                                disabled={features.length === 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                        <Plus className="w-4 h-4 mr-2" /> Add Feature Bullet
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="buttonText"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Button Text</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="buttonLink"
                        render={({ field }: { field: any }) => (
                            <FormItem>
                                <FormLabel>Button Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="/contact or payment link" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex flex-wrap gap-8 p-4 border rounded-xl bg-slate-50 dark:bg-zinc-900">
                    <FormField
                        control={form.control}
                        name="isPopular"
                        render={({ field }: { field: any }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="cursor-pointer">Highlight as Popular Tier</FormLabel>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }: { field: any }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="cursor-pointer">Active (Visible)</FormLabel>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isCustom"
                        render={({ field }: { field: any }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="cursor-pointer">Is Custom Enterprise Plan? (Hides metrics)</FormLabel>
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-14 font-bold text-lg rounded-xl">
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {initialData ? "Save Changes" : "Create Pricing Plan"}
                </Button>
            </form>
        </Form>
    );
}
