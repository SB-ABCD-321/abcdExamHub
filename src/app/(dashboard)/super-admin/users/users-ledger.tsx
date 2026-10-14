import { db } from "@/lib/prisma";
import { UserList } from "./user-list";
import { Pagination } from "@/components/shared/Pagination";
import { SearchX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Role } from "@prisma/client";

interface UsersLedgerProps {
    q: string;
    activeRole: string;
    sort: string;
    page: number;
    pageSize: number;
    filteredTotal: number;
    isDeveloper: boolean;
}

export async function UsersLedger({
    q,
    activeRole,
    sort,
    page,
    pageSize,
    filteredTotal,
    isDeveloper
}: UsersLedgerProps) {
    const skip = (page - 1) * pageSize;

    // Build filter
    const queryFilter: any = {};
    if (activeRole && activeRole !== "ALL") {
        queryFilter.role = activeRole as Role;
    }
    if (q) {
        queryFilter.OR = [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
            { phoneNumber: { contains: q, mode: 'insensitive' as const } },
        ];
    }

    // Dynamic sort
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') {
        orderBy = { createdAt: 'asc' };
    } else if (sort === 'name_asc') {
        orderBy = { firstName: 'asc' };
    } else if (sort === 'name_desc') {
        orderBy = { firstName: 'desc' };
    }

    const allUsers = await db.user.findMany({
        where: queryFilter,
        orderBy,
        skip,
        take: pageSize,
        include: {
            adminWorkspace: {
                select: { id: true, name: true, status: true }
            },
            _count: {
                select: {
                    teacherWorkspaces: true,
                    studentWorkspaces: true,
                    examResults: true,
                    authoredExams: true,
                    authoredQuestions: true,
                }
            }
        }
    }).catch(() => []);

    const hasActiveFilters = Boolean(q || activeRole !== "ALL" || (sort && sort !== "newest"));

    if (filteredTotal === 0 || allUsers.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border border-border/60 p-8 shadow-2xs">
                {hasActiveFilters ? (
                    <>
                        <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                            <SearchX className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">No Users Found</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            No account records match your search query or selected filter criteria.
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-4 h-8 text-xs rounded-xl">
                            <Link href="/super-admin/users">Reset All Filters</Link>
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
                            <UserX className="size-6" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">User Directory Empty</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                            No registered user accounts found in this cluster.
                        </p>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <UserList users={allUsers} isDeveloper={isDeveloper} />

            {/* Pagination Controls */}
            {filteredTotal > pageSize && (
                <div className="pt-2">
                    <Pagination
                        totalItems={filteredTotal}
                        itemsPerPage={pageSize}
                        currentPage={page}
                    />
                </div>
            )}
        </div>
    );
}
