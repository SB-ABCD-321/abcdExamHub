import { getWorkspaceRequests, getBatchUserRequestHistories } from "@/actions/workspace-request";
import { RequestStatus } from "@prisma/client";
import { RequestList } from "./request-list";
import { Pagination } from "@/components/shared/Pagination";
import { Inbox, History, CheckCircle2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RequestsLedgerProps {
    activeTab: "pending" | "approved" | "rejected";
    currentPage: number;
    pageSize: number;
    activeCount: number;
    q: string;
}

export async function RequestsLedger({
    activeTab,
    currentPage,
    pageSize,
    activeCount,
    q
}: RequestsLedgerProps) {
    const activeStatus: RequestStatus =
        activeTab === "approved" ? "APPROVED" : activeTab === "rejected" ? "REJECTED" : "PENDING";

    // High performance current page slice query
    const requests = await getWorkspaceRequests(activeStatus, {
        page: currentPage,
        pageSize,
        q
    }).catch(() => []);

    // For waitlist applications, fetch applicant histories in a single batched query
    let histories: Record<string, any[]> = {};
    if (activeTab === "pending" && requests.length > 0) {
        const userIds = requests.map((r) => r.userId).filter(Boolean) as string[];
        const batchHistories = await getBatchUserRequestHistories(userIds);

        for (const request of requests) {
            if (request.userId && batchHistories[request.userId]) {
                histories[request.id] = batchHistories[request.userId].filter(
                    (h: any) => h.id !== request.id
                );
            } else {
                histories[request.id] = [];
            }
        }
    }

    const hasActiveSearch = Boolean(q);

    if (activeCount === 0 || requests.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-8 shadow-2xs">
                {hasActiveSearch ? (
                    <>
                        <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                            <SearchX className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">No Matching Requisitions</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            No requisition records match &ldquo;{q}&rdquo; in the {activeTab} ledger.
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-4 h-8 text-xs rounded-xl">
                            <Link href={`/super-admin/requests?tab=${activeTab}`}>Clear Search</Link>
                        </Button>
                    </>
                ) : activeTab === "pending" ? (
                    <>
                        <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">Waitlist Buffer Empty</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            No incoming institutional requisitions require administrative auditing.
                        </p>
                    </>
                ) : activeTab === "approved" ? (
                    <>
                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                            <Inbox className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">No Authorized Nodes Recorded</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            Approved institutional nodes will appear here in the historical ledger.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                            <History className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">No Denied Requisitions</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            Refused or non-compliant requisitions will be logged here with refusal reasons.
                        </p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <RequestList
                requests={requests}
                readonly={activeTab !== "pending"}
                histories={histories}
            />

            {/* Pagination Controls */}
            {activeCount > pageSize && (
                <div className="pt-2">
                    <Pagination
                        totalItems={activeCount}
                        itemsPerPage={pageSize}
                        currentPage={currentPage}
                    />
                </div>
            )}
        </div>
    );
}
