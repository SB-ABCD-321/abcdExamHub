"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createTransaction } from "@/actions/accounting";

export function TransactionForm() {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const res = await createTransaction({
                type: formData.get("type") as 'INCOME' | 'EXPENSE',
                category: formData.get("category") as string,
                amount: parseFloat(formData.get("amount") as string),
                description: formData.get("description") as string,
                date: new Date(formData.get("date") as string),
            });

            if (res.success) {
                toast.success("Transaction recorded successfully!");
                // @ts-ignore
                document.getElementById("transaction-form")?.reset();
            } else {
                toast.error(res.error || "Recording failed.");
            }
        });
    }

    return (
        <form id="transaction-form" action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction Type</Label>
                <Select name="type" defaultValue="INCOME">
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 font-bold">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="INCOME">Revenue / Income</SelectItem>
                        <SelectItem value="EXPENSE">Global Expense</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-4 font-sans">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</Label>
                    <Input name="category" placeholder="E.g. Server Cost" required className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 font-medium" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (₹)</Label>
                    <Input name="amount" type="number" step="0.01" placeholder="0.00" required className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 font-bold" />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                <Input name="description" placeholder="Brief note about this entry" className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 font-medium" />
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Posting Date</Label>
                <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="h-12 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 font-medium" />
            </div>

            <div className="pt-4">
                <Button disabled={isPending} type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {isPending ? "Recording..." : "Finalize & Post Entry"}
                </Button>
            </div>
        </form>
    );
}
