"use client";

import { useState } from "react";
import { PaymentTabs } from "./PaymentTabs";
import { WorkspacePaymentsTable } from "./WorkspacePaymentsTable";
import { PaymentVerificationQueue } from "./PaymentVerificationQueue";
import { FinancialCharts } from "./FinancialCharts";
import { CheckCircle2, History, ShieldCheck, BarChart3 } from "lucide-react";

interface PaymentsManagerProps {
    payments: any[];
    workspaces: any[];
    pendingVerifications: any[];
    defaultTab?: "ledger" | "verification" | "analytics";
}

export function PaymentsManager({
    payments,
    workspaces,
    pendingVerifications,
    defaultTab = "ledger"
}: PaymentsManagerProps) {
    const [activeTab, setActiveTab] = useState<"ledger" | "verification" | "analytics">(
        pendingVerifications.length > 0 ? "verification" : defaultTab
    );

    return (
        <div className="space-y-4">
            {/* Tab navigation bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                <PaymentTabs
                    pendingCount={pendingVerifications.length}
                    workspacesCount={workspaces.length}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="text-xs text-muted-foreground shrink-0">
                    {activeTab === "ledger" && (
                        <span>Showing institutional accounts & verified payment ledgers</span>
                    )}
                    {activeTab === "verification" && (
                        <span>{pendingVerifications.length} transaction proofs awaiting compliance review</span>
                    )}
                    {activeTab === "analytics" && (
                        <span>Interactive ARR/MRR metrics and plan revenue trajectory</span>
                    )}
                </div>
            </div>

            {/* TAB 1: Unified Ledger */}
            {activeTab === "ledger" && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <WorkspacePaymentsTable workspaces={workspaces} />
                </div>
            )}

            {/* TAB 2: Verification Queue */}
            {activeTab === "verification" && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                    {pendingVerifications.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-8 shadow-2xs">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                                <CheckCircle2 className="size-6" />
                            </div>
                            <h4 className="text-sm font-bold text-foreground">Verification Queue Clear</h4>
                            <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                All manual payment submissions and transfer receipts have been audited and reconciled.
                            </p>
                        </div>
                    ) : (
                        <PaymentVerificationQueue pendingPayments={pendingVerifications} />
                    )}
                </div>
            )}

            {/* TAB 3: Revenue Analytics */}
            {activeTab === "analytics" && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <FinancialCharts payments={payments} />
                </div>
            )}
        </div>
    );
}
