"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Users, CheckSquare, Square } from "lucide-react";

interface Student {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
}

export function StudentSelector({ students }: { students: Student[] }) {
    const [search, setSearch] = useState("");
    const [allChecked, setAllChecked] = useState(true);
    const [uncheckedIds, setUncheckedIds] = useState<Set<string>>(new Set());

    const filtered = useMemo(() => {
        if (!search.trim()) return students;
        const q = search.toLowerCase();
        return students.filter(s =>
            (s.firstName?.toLowerCase() || "").includes(q) ||
            (s.lastName?.toLowerCase() || "").includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    }, [students, search]);

    const isChecked = (id: string) => allChecked ? !uncheckedIds.has(id) : uncheckedIds.has(id);

    const toggleStudent = (id: string) => {
        setUncheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        setAllChecked(true);
        setUncheckedIds(new Set());
    };

    const deselectAll = () => {
        setAllChecked(false);
        setUncheckedIds(new Set());
    };

    const checkedCount = students.filter(s => isChecked(s.id)).length;

    return (
        <div className="space-y-3">
            {/* Search & Controls */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
                    />
                </div>
                <button
                    type="button"
                    onClick={selectAll}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                >
                    <CheckSquare className="w-3.5 h-3.5" /> All
                </button>
                <button
                    type="button"
                    onClick={deselectAll}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <Square className="w-3.5 h-3.5" /> None
                </button>
            </div>

            {/* Count */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium px-1">
                <Users className="w-3.5 h-3.5" />
                <span>{checkedCount} of {students.length} selected</span>
                {search && <span className="text-indigo-600">• {filtered.length} matching</span>}
            </div>

            {/* Student List */}
            <div className="max-h-[320px] overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-muted-foreground italic">
                        {students.length === 0 ? "No students enrolled in this workspace." : "No students match your search."}
                    </div>
                ) : (
                    filtered.map(student => {
                        const checked = isChecked(student.id);
                        return (
                            <label
                                key={student.id}
                                htmlFor={`student_${student.id}`}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                            >
                                <Checkbox
                                    id={`student_${student.id}`}
                                    name={`student_${student.id}`}
                                    checked={checked}
                                    onCheckedChange={() => toggleStudent(student.id)}
                                    className="h-4.5 w-4.5 rounded data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 block truncate">
                                        {student.firstName || student.lastName
                                            ? `${student.firstName || ''} ${student.lastName || ''}`
                                            : 'Unnamed'}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate block">{student.email}</span>
                                </div>
                            </label>
                        );
                    })
                )}
            </div>
        </div>
    );
}
