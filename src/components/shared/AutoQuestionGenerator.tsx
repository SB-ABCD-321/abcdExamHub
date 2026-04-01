"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Bot, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface TopicInfo {
    id: string;
    name: string;
    max: number;
}

interface AutoGenRow {
    id: string;
    topicId: string;
    quantity: number;
}

export function AutoQuestionGenerator({ topics }: { topics: TopicInfo[] }) {
    const [rows, setRows] = useState<AutoGenRow[]>([]);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    
    // Validate rows
    const errors = rows.map(r => {
        const topic = topics.find(t => t.id === r.topicId);
        if (!topic) return null;
        if (r.quantity > topic.max) return `Requested ${r.quantity} > available ${topic.max} for ${topic.name}`;
        if (r.quantity <= 0) return `Quantity must be > 0 for ${topic.name}`;
        return null;
    });

    const hasErrors = errors.some(e => e !== null);
    const totalSelected = rows.reduce((acc, r) => acc + (r.quantity > 0 ? r.quantity : 0), 0);

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(36).substr(2, 9), topicId: "", quantity: 5 }]);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
        if (openPopoverId === id) setOpenPopoverId(null);
    };

    const updateRow = (id: string, updates: Partial<AutoGenRow>) => {
        setRows(rows.map(r => (r.id === id ? { ...r, ...updates } : r)));
    };

    const activeConfig = rows.filter(r => r.topicId && r.quantity > 0 && !errors.find(e => e?.includes(r.topicId || "XXX")));

    return (
        <div className="bg-slate-50 dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">Auto Generate</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Let AI compile the exam randomly from selected chapters.</p>
                </div>
            </div>

            <div className="space-y-4">
                {rows.map((row, index) => {
                    const error = errors[index];
                    const selectedTopicInfo = topics.find(t => t.id === row.topicId);
                    const isOpen = openPopoverId === row.id;
                    
                    return (
                        <div key={row.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex-1 w-full relative">
                                <Popover open={isOpen} onOpenChange={(open) => setOpenPopoverId(open ? row.id : null)}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isOpen}
                                            className={cn("w-full justify-between h-12 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4", error ? "border-red-500 text-red-600" : "")}
                                        >
                                            <span className="truncate">
                                                {row.topicId && selectedTopicInfo
                                                    ? `${selectedTopicInfo.name} (Max: ${selectedTopicInfo.max})` 
                                                    : "Search & Select Chapter..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[calc(100vw-3rem)] sm:w-[400px] p-0 rounded-xl border-slate-200 dark:border-zinc-800" align="start">
                                        <Command>
                                            <CommandInput placeholder="Type chapter name..." className="h-11" />
                                            <CommandList>
                                                <CommandEmpty>No matching chapters found.</CommandEmpty>
                                                <CommandGroup>
                                                    {topics.map(t => {
                                                        const isAlreadySelected = rows.some(r => r.topicId === t.id && r.id !== row.id);
                                                        const comboValue = `${t.id}__${t.name}`;
                                                        
                                                        return (
                                                            <CommandItem
                                                                key={t.id}
                                                                value={comboValue}
                                                                disabled={isAlreadySelected}
                                                                onSelect={(currentValue) => {
                                                                    // Extract the original topic ID from the composite value
                                                                    const parsedId = currentValue.split("__")[0];
                                                                    updateRow(row.id, { topicId: parsedId });
                                                                    setOpenPopoverId(null);
                                                                }}
                                                                className={cn("rounded-lg my-0.5", isAlreadySelected && "opacity-50")}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", row.topicId === t.id ? "opacity-100" : "opacity-0")} />
                                                                <div className="flex-1 truncate">{t.name}</div>
                                                                <div className="text-xs font-mono text-slate-500 ml-2">Max: {t.max}</div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">QTY</span>
                                <Input 
                                    type="number" 
                                    min={1} 
                                    max={selectedTopicInfo?.max || 999}
                                    value={row.quantity || ''} 
                                    onChange={(e) => updateRow(row.id, { quantity: parseInt(e.target.value) || 0 })}
                                    className={cn("h-12 w-24 rounded-xl text-center font-bold", error ? "border-red-500 text-red-600" : "")}
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => removeRow(row.id)}
                                    className="h-12 w-12 shrink-0 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            {error && (
                                <p className="text-xs font-bold text-red-500 sm:hidden flex items-center gap-1 w-full"><AlertCircle className="w-3 h-3"/> {error}</p>
                            )}
                        </div>
                    );
                })}

                {rows.map((r, i) => errors[i] ? (
                     <p key={`err-${i}`} className="hidden sm:flex text-xs font-bold text-red-500 items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> {errors[i]}</p>
                ) : null)}

                {topics.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400 font-medium">
                        No chapters available. Please manually pick questions below.
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={addRow} className="h-11 rounded-xl text-xs font-bold uppercase tracking-widest border-dashed border-2 bg-transparent" disabled={topics.length === 0 || rows.length >= topics.length}>
                    <Plus className="w-4 h-4 mr-2" /> Add Chapter Rule
                </Button>
                
                {rows.length > 0 && (
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Total Auto </span>
                        <span className={cn("text-xl font-black tabular-nums leading-none", hasErrors ? "text-red-500" : "text-indigo-600")}>
                            {totalSelected}
                        </span>
                    </div>
                )}
            </div>

            <input type="hidden" name="autoGenConfig" value={rows.length > 0 && !hasErrors ? JSON.stringify(activeConfig) : ""} />
        </div>
    );
}
