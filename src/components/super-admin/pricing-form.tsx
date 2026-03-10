"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertPricingPlan } from "@/actions/pricing";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    priceMonthly: z.coerce.number().min(0),
    priceYearly: z.coerce.number().min(0),
    offerMonthly: z.string().optional(),
    offerYearly: z.string().optional(),
    features: z.array(z.string()).min(1, "At least one feature is required"),
    isPopular: z.boolean().default(false),
    isActive: z.boolean().default(true),
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
            priceMonthly: initialData?.priceMonthly || 0,
            priceYearly: initialData?.priceYearly || 0,
            offerMonthly: initialData?.offerMonthly || "",
            offerYearly: initialData?.offerYearly || "",
            features: initialData?.features || [""],
            isPopular: initialData?.isPopular || false,
            isActive: initialData?.isActive ?? true,
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

                <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-zinc-900 rounded-2xl border">
                    <div className="space-y-4">
                        <h3 className="font-bold">Monthly Pricing</h3>
                        <FormField
                            control={form.control}
                            name="priceMonthly"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Price (INR)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="offerMonthly"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Monthly Offer/Discount Text</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Save 10%" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold">Yearly Pricing</h3>
                        <FormField
                            control={form.control}
                            name="priceYearly"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Price (INR)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="offerYearly"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Yearly Offer/Discount Text</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 2 Months Free" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <FormLabel>Features List</FormLabel>
                    {features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                            <Input
                                value={feature}
                                onChange={(e) => updateFeature(index, e.target.value)}
                                placeholder="Feature point..."
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFeature(index)}
                                disabled={features.length === 1}
                            >
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                        <Plus className="w-4 h-4 mr-2" /> Add Feature
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

                <div className="flex gap-8">
                    <FormField
                        control={form.control}
                        name="isPopular"
                        render={({ field }: { field: any }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Mark as Popular</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }: { field: any }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Active (Visible to users)</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? "Update Plan" : "Create Plan"}
                </Button>
            </form>
        </Form>
    );
}
