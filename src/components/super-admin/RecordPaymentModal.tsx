"use client";

import { useState } from "react";
import { Plus, IndianRupee, Check, ChevronsUpDown, Loader2, Building2 } from "lucide-react";
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
        updateCalculatedAmount(planId, duration);
    };

    const handleDurationChange = (d: string) => {
        setDuration(d);
        updateCalculatedAmount(selectedPlan, d);
    };

    const updateCalculatedAmount = (planId: string, dur: string) => {
        const plan = plans.find((p) => p.id === planId);
        if (!plan) return;

        let basePrice = 0;
        if (dur === '1M') basePrice = plan.price1Month;
        else if (dur === '6M') basePrice = plan.price6Month;
        else if (dur === '12M') basePrice = plan.price12Month;

        setAmount(basePrice.toString());
    };

    const onSubmit = async () => {
        if (!selectedWorkspace) {
            toast.error("Please select a target institutional workspace.");
            return;
        }
        if (!selectedPlan) {
            toast.error("Please select a subscription plan tier.");
            return;
        }
        if (!amount || isNaN(Number(amount)) || Number(amount) < 0) {
            toast.error("Please enter a valid payment settlement amount.");
            return;
        }

        setLoading(true);
        try {
            const res = await recordManualPayment({
                workspaceId: selectedWorkspace,
                planId: selectedPlan,
                duration,
                customAmount: Number(amount),
                paymentDate: new Date(paymentDate),
                paymentMethod: method,
                referenceNumber: referenceNumber || undefined,
            });

            if (res.success) {
                toast.success("Payment recorded and node provisioned successfully!");
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
            toast.error("An unexpected error occurred while saving entry.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-8.5 px-3 rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 cursor-pointer">
                    <Plus className="size-3.5" />
                    <span>Record Payment</span>
                </Button>
            </DialogTrigger>
            
            <DialogContent 
                className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl border-border/60 p-5 sm:p-6 shadow-xl no-scrollbar"
                onPointerDownOutside={(e) => {
                    // Prevent closing when clicking inner combobox popovers
                    const target = e.target as HTMLElement;
                    if (target.closest("[data-radix-popper-content-wrapper]")) {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="space-y-1">
                    <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <IndianRupee className="size-4" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                Manual Settlement Entry
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Record an institutional bank transfer, offline cash, or manual payment.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3.5 py-3">
                    {/* Workspace Selector */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Target Workspace Node
                        </Label>
                        <Popover open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={workspaceOpen}
                                    className="w-full h-9 rounded-xl bg-background border-border/60 text-xs font-medium justify-between px-3 cursor-pointer"
                                >
                                    <span className="truncate">
                                        {selectedWorkspace
                                            ? (() => {
                                                const ws = workspaces.find((w) => w.id === selectedWorkspace);
                                                return ws ? ws.name : "Select workspace node...";
                                            })()
                                            : "Select workspace node..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-lg border-border/60" align="start">
                                <Command className="rounded-xl">
                                    <CommandInput placeholder="Search workspace..." className="h-8.5 text-xs" />
                                    <CommandList className="max-h-48">
                                        <CommandEmpty className="text-xs py-3 text-center text-muted-foreground">No workspace found.</CommandEmpty>
                                        <CommandGroup>
                                            {workspaces.map((ws) => (
                                                <CommandItem
                                                    key={ws.id}
                                                    value={ws.name + " " + (ws.contactEmail || '')}
                                                    onSelect={() => {
                                                        setSelectedWorkspace(ws.id);
                                                        setWorkspaceOpen(false);
                                                    }}
                                                    className="rounded-lg cursor-pointer text-xs py-1.5"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 size-3.5 shrink-0 text-primary",
                                                            selectedWorkspace === ws.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold truncate">{ws.name}</span>
                                                        <span className="text-[10px] text-muted-foreground truncate">{ws.contactEmail || 'No contact email'}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Plan Tier & Duration Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Plan Tier
                            </Label>
                            <Select onValueChange={handlePlanChange} value={selectedPlan}>
                                <SelectTrigger className="h-9 rounded-xl bg-background border-border/60 text-xs font-medium">
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {plans.map((p) => (
                                        <SelectItem key={p.id} value={p.id} className="text-xs font-medium cursor-pointer">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Duration
                            </Label>
                            <Select onValueChange={handleDurationChange} value={duration}>
                                <SelectTrigger className="h-9 rounded-xl bg-background border-border/60 text-xs font-medium">
                                    <SelectValue placeholder="Billing Duration" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="1M" className="text-xs font-medium cursor-pointer">1 Month</SelectItem>
                                    <SelectItem value="6M" className="text-xs font-medium cursor-pointer">6 Months</SelectItem>
                                    <SelectItem value="12M" className="text-xs font-medium cursor-pointer">12 Months (1 Year)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Amount & Payment Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Settled Amount (₹)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="h-9 rounded-xl pl-6 text-xs font-bold bg-background border-border/60 tabular-nums"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Clearance Date
                            </Label>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="h-9 rounded-xl text-xs bg-background border-border/60 font-medium"
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Settlement Method
                        </Label>
                        <Select onValueChange={setMethod} value={method}>
                            <SelectTrigger className="h-9 rounded-xl bg-background border-border/60 text-xs font-medium">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="Cash" className="text-xs font-medium cursor-pointer">Cash Settlement</SelectItem>
                                <SelectItem value="UPI" className="text-xs font-medium cursor-pointer">UPI / Digital Transfer</SelectItem>
                                <SelectItem value="Bank Ac" className="text-xs font-medium cursor-pointer">Bank Account / NEFT / RTGS</SelectItem>
                                <SelectItem value="Cheque" className="text-xs font-medium cursor-pointer">Institutional Cheque / DD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Transaction / Reference ID */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            Reference / UTR / Check No. <span className="text-[10px] lowercase font-normal opacity-70">(optional)</span>
                        </Label>
                        <Input
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="e.g. UTR_9876543210 or CHQ-00124"
                            className="h-9 rounded-xl text-xs bg-background border-border/60 font-mono"
                        />
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={onSubmit}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs gap-2 shadow-sm cursor-pointer"
                    >
                        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                        <span>Confirm & Log Transaction</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
