"use client";

import { useState } from "react";
import { Plus, IndianRupee, Calendar as CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { recordManualPayment } from "@/actions/financial-actions";
import { cn } from "@/lib/utils";

interface RecordPaymentModalProps {
    workspaces: { id: string, name: string, contactEmail: string | null }[];
    plans: any[];
}

export function RecordPaymentModal({ workspaces, plans }: RecordPaymentModalProps) {
    const [open, setOpen] = useState(false);
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [selectedWorkspace, setSelectedWorkspace] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("");
    const [duration, setDuration] = useState("1M");
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [method, setMethod] = useState("Cash");
    const [referenceNumber, setReferenceNumber] = useState("");

    // Auto-update amount when plan or duration changes
    const handlePlanChange = (planId: string) => {
        setSelectedPlan(planId);
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            updateAmount(plan, duration);
        }
    };

    const handleDurationChange = (d: string) => {
        setDuration(d);
        const plan = plans.find(p => p.id === selectedPlan);
        if (plan) {
            updateAmount(plan, d);
        }
    };

    const updateAmount = (plan: any, dur: string) => {
        if (dur === '1M') setAmount(plan.price1Month.toString());
        else if (dur === '6M') setAmount(plan.price6Month.toString());
        else if (dur === '12M') setAmount(plan.price12Month.toString());
    };

    const onSubmit = async () => {
        if (!selectedWorkspace || !selectedPlan || !amount) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await recordManualPayment({
                workspaceId: selectedWorkspace,
                planId: selectedPlan,
                duration,
                customAmount: parseFloat(amount),
                paymentDate: new Date(paymentDate),
                paymentMethod: method,
                referenceNumber: referenceNumber || undefined,
            });

            if (res.success) {
                toast.success("Payment recorded successfully!");
                setOpen(false);
                // Reset form
                setSelectedWorkspace("");
                setSelectedPlan("");
                setAmount("");
                setReferenceNumber("");
            } else {
                toast.error(res.error || "Failed to record payment");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-11 px-6 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold tracking-tight text-xs gap-3 shadow-lg transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4 stroke-[3]" /> Record Entry
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-8">
                <DialogHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <IndianRupee className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tighter">Manual Payment Entry</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">Record an offline cash or manual transaction</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    {/* Workspace Selection */}
                    <div className="space-y-2 flex flex-col">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Workspace</Label>
                        <Popover open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={workspaceOpen}
                                    className="w-full h-12 rounded-xl bg-slate-50 border-none font-bold text-sm justify-between px-4 hover:bg-slate-100 dark:bg-zinc-900"
                                >
                                    {selectedWorkspace
                                        ? (() => {
                                            const ws = workspaces.find((w) => w.id === selectedWorkspace);
                                            return ws ? ws.name : "Select node...";
                                        })()
                                        : "Select node..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                                <Command>
                                    <CommandInput placeholder="Search workspace..." className="h-11 font-bold text-sm" />
                                    <CommandList>
                                        <CommandEmpty>No workspace found.</CommandEmpty>
                                        <CommandGroup>
                                            {workspaces.map((ws) => (
                                                <CommandItem
                                                    key={ws.id}
                                                    value={ws.name + " " + (ws.contactEmail || '')}
                                                    onSelect={() => {
                                                        setSelectedWorkspace(ws.id);
                                                        setWorkspaceOpen(false);
                                                    }}
                                                    className="rounded-lg cursor-pointer my-1"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4 shrink-0",
                                                            selectedWorkspace === ws.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col items-start py-1 overflow-hidden">
                                                        <span className="font-bold truncate w-full">{ws.name}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate w-full">{ws.contactEmail || 'No Email'}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Plan Selection */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Plan</Label>
                            <Select onValueChange={handlePlanChange} value={selectedPlan}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm">
                                    <SelectValue placeholder="Tier" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {plans.map(p => (
                                        <SelectItem key={p.id} value={p.id} className="rounded-lg font-bold">{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duration</Label>
                            <Select onValueChange={handleDurationChange} value={duration}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm">
                                    <SelectValue placeholder="Time" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl font-bold">
                                    <SelectItem value="1M">1 Month</SelectItem>
                                    <SelectItem value="6M">6 Months</SelectItem>
                                    <SelectItem value="12M">12 Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Amount */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Recorded Amount (₹)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-none font-black text-sm pl-8"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Payment Date</Label>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm px-4"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Payment Method</Label>
                        <Select onValueChange={setMethod} value={method}>
                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm">
                                <SelectValue placeholder="Standard Method" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl font-bold">
                                <SelectItem value="Cash">Cash Settlement</SelectItem>
                                <SelectItem value="UPI">UPI / Digital Transfer</SelectItem>
                                <SelectItem value="Bank Ac">Bank Account Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Ref / Transaction ID (Optional)</Label>
                        <Input
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="e.g. UPI_123456789"
                            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        disabled={loading}
                        onClick={onSubmit}
                        className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs gap-3 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                        Confirm & Record Transaction
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
