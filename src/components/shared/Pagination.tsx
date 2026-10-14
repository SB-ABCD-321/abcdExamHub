"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
}

export function Pagination({ totalItems, itemsPerPage, currentPage }: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Optimistic page tracking for instant feedback
    const [optimisticPage, setOptimisticPage] = useState(currentPage);

    useEffect(() => {
        setOptimisticPage(currentPage);
    }, [currentPage]);
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const handlePageChange = (page: number) => {
        if (page === optimisticPage || page < 1 || page > totalPages) return;
        setOptimisticPage(page);

        startTransition(() => {
            router.push(createPageURL(page));
        });
    };

    return (
        <div className="flex items-center justify-center gap-2 py-6 select-none">
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(optimisticPage - 1)}
                disabled={optimisticPage <= 1 || isPending}
                className="rounded-xl h-8 w-8 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous Page"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (totalPages > 7) {
                        if (page !== 1 && page !== totalPages && Math.abs(page - optimisticPage) > 1) {
                            if (page === 2 || page === totalPages - 1) {
                                return <span key={page} className="px-2 text-muted-foreground text-xs">...</span>;
                            }
                            return null;
                        }
                    }
                    
                    const isSelected = optimisticPage === page;

                    return (
                        <Button
                            key={page}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={isPending && isSelected}
                            onClick={() => handlePageChange(page)}
                            className={cn(
                                "h-8 min-w-8 px-2.5 rounded-xl text-xs transition-all cursor-pointer",
                                isSelected 
                                    ? "font-bold shadow-sm shadow-primary/25 scale-[1.03]" 
                                    : "hover:bg-card/70"
                            )}
                        >
                            {isPending && isSelected ? (
                                <Loader2 className="size-3 animate-spin" />
                            ) : (
                                page
                            )}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(optimisticPage + 1)}
                disabled={optimisticPage >= totalPages || isPending}
                className="rounded-xl h-8 w-8 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Next Page"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
}
