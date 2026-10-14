"use client";

import { Input } from "@/components/ui/input";
import { Search, X, ArrowUpDown, RotateCcw, Loader2, Command } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function UserSearchBox() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);

    const initialQ = searchParams.get("q") || "";
    const initialSort = searchParams.get("sort") || "newest";

    const [query, setQuery] = useState(initialQ);
    const [sort, setSort] = useState(initialSort);
    const [isFocused, setIsFocused] = useState(false);

    // Sync internal state when URL changes externally
    useEffect(() => {
        setQuery(searchParams.get("q") || "");
        setSort(searchParams.get("sort") || "newest");
    }, [searchParams]);

    // Keyboard shortcut (Press '/' or 'Ctrl+K' / 'Cmd+K' to focus smart search bar)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if active element is an input, textarea or contenteditable (unless pressing Escape)
            const target = e.target as HTMLElement;
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

            if (e.key === "Escape" && isInput) {
                inputRef.current?.blur();
                return;
            }

            if ((e.key === "/" && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Push changes to URL parameters
    const updateParams = (newQ: string, newSort: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newQ.trim()) {
            params.set("q", newQ.trim());
        } else {
            params.delete("q");
        }

        if (newSort && newSort !== "newest") {
            params.set("sort", newSort);
        } else {
            params.delete("sort");
        }

        params.set("page", "1"); // Reset to page 1 on filter/sort change

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    // Debounce search query changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query !== (searchParams.get("q") || "")) {
                updateParams(query, sort);
            }
        }, 280);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSortChange = (newSort: string) => {
        setSort(newSort);
        updateParams(query, newSort);
    };

    const handleClear = () => {
        setQuery("");
        setSort("newest");
        const params = new URLSearchParams(searchParams.toString());
        params.delete("q");
        params.delete("sort");
        params.set("page", "1");
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
        inputRef.current?.focus();
    };

    const hasActiveFilters = Boolean(query || (sort && sort !== "newest"));

    return (
        <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Smart Search Input with visual status & shortcut */}
            <div className="relative flex-1 sm:w-72">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground flex items-center">
                    {isPending ? (
                        <Loader2 className="size-3.5 text-primary animate-spin" />
                    ) : (
                        <Search className="size-3.5" />
                    )}
                </div>

                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search name, email, phone..."
                    className="pl-8 pr-12 h-8.5 text-xs rounded-xl bg-card border-border/60 shadow-2xs placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/50 transition-all"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {/* Right side: Clear button OR shortcut badge */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query ? (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                inputRef.current?.focus();
                            }}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                            title="Clear search"
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border/50 bg-muted/60 text-[9px] font-mono text-muted-foreground select-none pointer-events-none">
                            <span className="text-[10px]">/</span>
                        </kbd>
                    )}
                </div>
            </div>

            {/* Smart Sort Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Select value={sort} onValueChange={handleSortChange}>
                    <SelectTrigger className="h-8.5 px-2.5 text-xs rounded-xl bg-card border-border/60 shadow-2xs gap-1.5 min-w-[125px]">
                        <ArrowUpDown className="size-3 text-muted-foreground" />
                        <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="name_asc">Name: A to Z</SelectItem>
                        <SelectItem value="name_desc">Name: Z to A</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="h-8.5 px-2 rounded-xl text-xs text-muted-foreground hover:text-foreground gap-1"
                        title="Reset search and sort filters"
                    >
                        <RotateCcw className="size-3" />
                        <span className="hidden md:inline">Reset</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
