"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Save, FileText, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertGuide, deleteUserGuide } from "@/actions/guide";
import { IconLoader } from "@/components/shared/GuidePage";

interface UserGuideManagerProps {
    initialGuides: any[];
    staticDefaults: any;
}

export function UserGuideManager({ initialGuides, staticDefaults }: UserGuideManagerProps) {
    const [selectedRole, setSelectedRole] = useState<Role>(Role.TEACHER);
    const [loading, setLoading] = useState(false);

    // Find dynamic guide or use static default
    const dynamic = initialGuides.find(g => g.role === selectedRole);
    const [editData, setEditData] = useState({
        title: dynamic?.title || staticDefaults[selectedRole].title,
        description: dynamic?.description || staticDefaults[selectedRole].description,
        icon: dynamic?.icon || staticDefaults[selectedRole].icon || "BookOpen",
        items: dynamic?.items || staticDefaults[selectedRole].items || []
    });

    const handleRoleChange = (role: Role) => {
        setSelectedRole(role);
        const d = initialGuides.find(g => g.role === role);
        setEditData({
            title: d?.title || staticDefaults[role].title,
            description: d?.description || staticDefaults[role].description,
            icon: d?.icon || staticDefaults[role].icon || "BookOpen",
            items: d?.items || staticDefaults[role].items || []
        });
    };

    const addItem = () => {
        setEditData({
            ...editData,
            items: [...editData.items, { title: "", description: "" }]
        });
    };

    const removeItem = (idx: number) => {
        const newItems = editData.items.filter((_: any, i: number) => i !== idx);
        setEditData({ ...editData, items: newItems });
    };

    const updateItem = (idx: number, field: 'title' | 'description', value: string) => {
        const newItems = [...editData.items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setEditData({ ...editData, items: newItems });
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await upsertGuide({
            role: selectedRole,
            ...editData
        });
        setLoading(false);

        if (res.success) {
            toast.success("Documentation published successfully!");
        } else {
            toast.error("Failed to save documentation");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Reset to default system documentation?")) return;
        setLoading(true);
        const res = await deleteUserGuide(selectedRole);
        setLoading(false);
        if (res.success) {
            toast.success("Custom documentation removed.");
            handleRoleChange(selectedRole);
        }
    };

    const tabStyles = "px-4 py-2 text-xs font-bold tracking-tight transition-all flex items-center gap-2 rounded-lg border";

    return (
        <div className="space-y-6 max-w-6xl mx-auto py-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Guidance</h2>
                <p className="text-sm text-slate-500 font-medium">Manage instructions and documentation for platform users.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {[Role.TEACHER, Role.ADMIN, Role.STUDENT, Role.SUPER_ADMIN].map((role) => (
                    <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={cn(
                            tabStyles,
                            selectedRole === role 
                                ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white shadow-sm" 
                                : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-slate-300 dark:hover:border-zinc-700"
                        )}
                    >
                        {role.toLowerCase().replace('_', ' ')}
                        {selectedRole === role && <ChevronRight className="w-3 h-3" />}
                    </button>
                ))}
            </div>

            <div className="grid gap-6">
                <Card className="border-slate-200 dark:border-zinc-800 shadow-none overflow-hidden bg-card/50">
                    <CardHeader className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    Guide Information
                                </CardTitle>
                                <CardDescription className="text-xs">Setup the main heading and intro for this guide.</CardDescription>
                            </div>
                            {dynamic && (
                                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-rose-500 h-8 text-[10px] font-bold tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10">
                                    Reset to Default
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Page Title</label>
                                <Input 
                                    value={editData.title} 
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="h-10 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-slate-400 font-semibold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Default Icon</label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={editData.icon} 
                                        onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                                        className="h-10 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-slate-400 font-mono text-xs"
                                        placeholder="Lucide Icon Name"
                                    />
                                    <div className="h-10 w-10 shrink-0 rounded-md bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-slate-200 dark:border-zinc-800">
                                        <IconLoader name={editData.icon} className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Short Summary</label>
                            <Textarea 
                                value={editData.description} 
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                className="min-h-[80px] border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-slate-400 resize-none font-medium"
                                placeholder="..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold tracking-widest text-slate-500 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Documentation Items ({editData.items.length})
                        </h3>
                        <Button onClick={addItem} size="sm" className="h-8 rounded-lg px-3 text-xs font-bold">
                            <Plus className="w-4 h-4 mr-1.5" /> Add New Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {editData.items.map((item: any, idx: number) => (
                            <Card key={idx} className="border-slate-200 dark:border-zinc-800 shadow-none bg-white dark:bg-zinc-900/50">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-6 h-6 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center text-[10px] font-bold">
                                                {idx + 1}
                                            </div>
                                            <Input 
                                                value={item.title} 
                                                onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                                placeholder="Item Heading (e.g. How to Login)"
                                                className="h-9 border-none bg-slate-50 dark:bg-zinc-800 rounded-lg font-bold text-sm shadow-none focus-visible:ring-1"
                                            />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeItem(idx)}
                                            className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-lg shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Textarea 
                                        value={item.description} 
                                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                        placeholder="Detailed instructions for this topic..."
                                        className="min-h-[100px] border-none bg-slate-50 dark:bg-zinc-800 rounded-lg text-sm resize-none font-medium p-4 focus-visible:ring-1 shadow-none"
                                    />
                                </CardContent>
                            </Card>
                        ))}

                        {editData.items.length === 0 && (
                            <div className="py-12 text-center rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800">
                                <p className="text-xs font-bold text-slate-400 italic">No instructions added for this guide.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 sticky bottom-4">
                    <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold shadow-xl active:scale-[0.98] transition-all"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Saving Documentation..." : "Save Documentation"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
