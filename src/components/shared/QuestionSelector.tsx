"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ChevronDown, ChevronRight } from "lucide-react";

interface QuestionSelectorProps {
    questions: any[];
    initialSelected?: string[];
}

export function QuestionSelector({ questions, initialSelected }: QuestionSelectorProps) {
    // Start with all questions selected by default if no initialSelected is provided. 
    // Use a simple array to avoid SSR Hydration issues and React shallow comparison bugs with Sets.
    const [selected, setSelected] = useState<string[]>(() => {
        return initialSelected ? initialSelected : [];
    });

    const [search, setSearch] = useState("");
    const [topicFilter, setTopicFilter] = useState("all");
    const [collapsedTopics, setCollapsedTopics] = useState<string[]>(() => {
        return Array.from(new Set(questions.map(q => q.topic?.name).filter(Boolean))) as string[];
    });

    const toggleTopicCollapse = (topicName: string) => {
        setCollapsedTopics(prev =>
            prev.includes(topicName) ? prev.filter(t => t !== topicName) : [...prev, topicName]
        );
    };

    // Extract unique topics for the dropdown
    const topics = Array.from(new Set(questions.map(q => q.topic?.name).filter(Boolean))).sort();

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = search === "" || q.text.toLowerCase().includes(search.toLowerCase());
        const matchesTopic = topicFilter === "all" || q.topic?.name === topicFilter;
        return matchesSearch && matchesTopic;
    });

    const handleSelectAllFiltered = (checked: boolean) => {
        const filteredIds = filteredQuestions.map(q => q.id);
        if (checked) {
            // Add all currently filtered questions to the selected array (without duplicating)
            setSelected(prev => Array.from(new Set([...prev, ...filteredIds])));
        } else {
            // Remove all currently filtered questions from the selected array
            setSelected(prev => prev.filter(id => !filteredIds.includes(id)));
        }
    };

    const handleToggle = (id: string, checked: boolean) => {
        setSelected(prev =>
            checked ? [...prev, id] : prev.filter(item => item !== id)
        );
    };

    // Check if ALL currently filtered items are selected
    const allFilteredSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selected.includes(q.id));

    // Group the filtered questions by topic
    const questionsByTopic = topics.reduce((acc, topicName) => {
        acc[topicName as string] = filteredQuestions.filter(q => (q.topic?.name || 'Uncategorized') === topicName);
        return acc;
    }, {} as Record<string, any[]>);

    // Also handle questions without a topic if 'All Topics' or 'Uncategorized' is selected/visible
    const uncategorizedQuestions = filteredQuestions.filter(q => !q.topic?.name);

    if (uncategorizedQuestions.length > 0 && !questionsByTopic['Uncategorized']) {
        questionsByTopic['Uncategorized'] = uncategorizedQuestions;
        if (!topics.includes('Uncategorized')) {
            topics.push('Uncategorized');
        }
    }

    return (
        <div className="space-y-4">
            <input type="hidden" name="selectedQuestionIds" value={selected.join(',')} />
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                    />
                </div>
                <div className="sm:max-w-xs flex items-center gap-2">
                    <div className="bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg shrink-0">
                        <Filter className="h-4 w-4 text-slate-500" />
                    </div>
                    <Select value={topicFilter} onValueChange={setTopicFilter}>
                        <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:ring-indigo-500 flex-1">
                            <SelectValue placeholder="All Topics" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Topics</SelectItem>
                            {topics.map(topic => (
                                <SelectItem key={topic} value={topic as string}>{topic}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="select-all"
                        checked={allFilteredSelected}
                        onCheckedChange={(checked) => handleSelectAllFiltered(checked as boolean)}
                        className="h-5 w-5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <Label htmlFor="select-all" className="font-bold text-sm cursor-pointer uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Select All Filtered
                    </Label>
                </div>
                <div className="text-sm font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                    {selected.length} / {questions.length} Selected
                </div>
            </div>

            <div className="space-y-6 transition-all duration-300">
                {filteredQuestions.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium text-muted-foreground border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 italic">
                        {questions.length === 0 ? "No questions available in the bank. Create some first!" : "No questions match your current search and topic filters."}
                    </div>
                ) : (
                    topics.map((topicName) => {
                        const topicQuestions = questionsByTopic[topicName as string];
                        if (!topicQuestions || topicQuestions.length === 0) return null;

                        const allTopicQuestionsSelected = topicQuestions.every((q: any) => selected.includes(q.id));
                        const someTopicQuestionsSelected = topicQuestions.some((q: any) => selected.includes(q.id));
                        const selectedCount = topicQuestions.filter((q: any) => selected.includes(q.id)).length;

                        // Function to handle clicking the group checkbox
                        const handleTopicToggle = (checked: boolean) => {
                            const topicIds = topicQuestions.map((q: any) => q.id);
                            if (checked) {
                                setSelected(prev => Array.from(new Set([...prev, ...topicIds])));
                            } else {
                                setSelected(prev => prev.filter(id => !topicIds.includes(id)));
                            }
                        };

                        return (
                            <div key={topicName as string} className="border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 overflow-hidden">
                                <div className="bg-slate-100 dark:bg-zinc-800 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 transition-colors hover:bg-slate-200/50 dark:hover:bg-zinc-700/50">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            suppressHydrationWarning
                                            onClick={(e) => { e.preventDefault(); toggleTopicCollapse(topicName as string); }}
                                            className="p-1 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                                        >
                                            {collapsedTopics.includes(topicName as string) ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        <Checkbox
                                            id={`topic_${topicName}`}
                                            checked={allTopicQuestionsSelected ? true : someTopicQuestionsSelected ? "indeterminate" : false}
                                            onCheckedChange={(checked) => handleTopicToggle(checked as boolean)}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <Label htmlFor={`topic_${topicName}`} className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-slate-200 cursor-pointer pt-0.5 select-none hover:text-indigo-600 transition-colors" onClick={(e) => { e.preventDefault(); toggleTopicCollapse(topicName as string); }}>
                                            {topicName as string}
                                        </Label>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md cursor-pointer" onClick={() => toggleTopicCollapse(topicName as string)}>
                                        {selectedCount}/{topicQuestions.length} Selected
                                    </span>
                                </div>
                                {!collapsedTopics.includes(topicName as string) && (
                                    <div className="p-3 grid gap-2">
                                        {topicQuestions.map((q: any) => (
                                            <div key={q.id} className="flex items-start space-x-4 p-3 border border-slate-200/60 dark:border-zinc-800/60 rounded-xl bg-white dark:bg-zinc-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                                                <Checkbox
                                                    id={`question_${q.id}`}
                                                    name={`question_${q.id}`}
                                                    value="on"
                                                    checked={selected.includes(q.id)}
                                                    onCheckedChange={(c) => handleToggle(q.id, !!c)}
                                                    className="mt-0.5 h-5 w-5 rounded-md data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                />
                                                <div className="grid gap-2 leading-none flex-1">
                                                    <Label htmlFor={`question_${q.id}`}
                                                        className="font-bold text-sm text-slate-800 dark:text-slate-200 cursor-pointer leading-snug"
                                                    >
                                                        {q.text}
                                                    </Label>
                                                    {q.isPublic && (
                                                        <div className="flex pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800">
                                                            <span className="text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md font-bold text-[9px] uppercase tracking-widest">
                                                                Public Library
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
