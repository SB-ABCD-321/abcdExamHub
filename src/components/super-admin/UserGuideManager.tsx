"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, FileText, BookOpen, GraduationCap, Building2, ShieldCheck, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertGuide, deleteUserGuide } from "@/actions/guide";
import { IconLoader } from "@/components/shared/GuidePage";

interface UserGuideManagerProps {
    initialGuides: any[];
    staticDefaults: any;
}

const ROLE_CONFIG: Record<Role, { label: string; icon: any; description: string }> = {
    [Role.TEACHER]: {
        label: "Teacher / Faculty",
        icon: BookOpen,
        description: "Exam creation, question bank authoring, class assignment, and proctoring controls."
    },
    [Role.ADMIN]: {
        label: "Workspace Admin",
        icon: Building2,
        description: "Institutional setup, teacher management, student rosters, billing, and domain mapping."
    },
    [Role.STUDENT]: {
        label: "Student / Examinee",
        icon: GraduationCap,
        description: "Test taking protocols, browser proctoring, result viewing, and forensic review."
    },
    [Role.SUPER_ADMIN]: {
        label: "Super Admin",
        icon: ShieldCheck,
        description: "Global platform governance, multi-tenant workspace provisioning, and system settings."
    }
};

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
            toast.success(`${ROLE_CONFIG[selectedRole].label} documentation published!`);
        } else {
            toast.error("Failed to save documentation");
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Reset ${ROLE_CONFIG[selectedRole].label} guide to default system documentation?`)) return;
        setLoading(true);
        const res = await deleteUserGuide(selectedRole);
        setLoading(false);
        if (res.success) {
            toast.success("Custom documentation reset to defaults.");
            handleRoleChange(selectedRole);
        }
    };

    return (
        <div className="space-y-6 font-sans">
            <Card className="border shadow-none rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                <BookOpen className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Role-Based User Guides & Documentation</CardTitle>
                                <CardDescription className="text-xs font-medium">Curate interactive tutorials, role instructions, and workflows for each user role.</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {dynamic && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="h-9 px-3 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                                >
                                    Reset to Default
                                </Button>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={loading}
                                className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 cursor-pointer shadow-xs"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving Guide...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-3.5" />
                                        <span>Publish Guide</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 border-t font-sans">
                    {/* Role Selection Tabs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {(Object.keys(ROLE_CONFIG) as Role[]).map((role) => {
                            const config = ROLE_CONFIG[role];
                            const RoleIcon = config.icon;
                            const isSelected = selectedRole === role;
                            return (
                                <button
                                    type="button"
                                    key={role}
                                    onClick={() => handleRoleChange(role)}
                                    className={cn(
                                        "p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5",
                                        isSelected
                                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                                            : "border-border bg-background hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className={cn(
                                            "size-8 rounded-lg flex items-center justify-center shrink-0",
                                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        )}>
                                            <RoleIcon className="size-4" />
                                        </div>
                                        {isSelected && (
                                            <span className="text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold tracking-tight text-foreground">{config.label}</div>
                                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{config.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Guide Header Configuration */}
                    <div className="p-5 rounded-2xl border bg-background/50 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Guide Page Title</Label>
                                <Input
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="h-10 text-xs font-semibold bg-background"
                                    placeholder="e.g. Teacher Manual & Guidelines"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lucide Icon Identifier</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={editData.icon}
                                        onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                                        className="h-10 font-mono text-xs bg-background flex-1"
                                        placeholder="e.g. BookOpen, GraduationCap"
                                    />
                                    <div className="size-10 shrink-0 rounded-xl bg-muted/60 flex items-center justify-center border text-primary">
                                        <IconLoader name={editData.icon} className="size-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Executive Summary & Instructions Context</Label>
                            <Textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                className="min-h-[75px] resize-none text-xs leading-relaxed bg-background"
                                placeholder="Summary of this role's workflows and key responsibilities..."
                            />
                        </div>
                    </div>

                    {/* Documentation Items List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="size-4 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                    Step-by-Step Chapters ({editData.items.length})
                                </h4>
                            </div>
                            <Button
                                type="button"
                                onClick={addItem}
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg px-3 text-xs font-bold gap-1.5 cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                <span>Add Chapter / Instruction</span>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {editData.items.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 rounded-xl border bg-background/60 hover:border-primary/30 transition-all space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 flex-1">
                                            <span className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                                                {idx + 1}
                                            </span>
                                            <Input
                                                value={item.title}
                                                onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                                placeholder="Chapter Title (e.g. How to schedule an online exam)"
                                                className="h-9 font-bold text-xs bg-muted/30 border-border focus-visible:bg-background"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(idx)}
                                            className="size-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg shrink-0 cursor-pointer"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={item.description}
                                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                        placeholder="Detailed step-by-step guidance, button actions, and best practices for this chapter..."
                                        className="min-h-[85px] text-xs resize-none leading-relaxed p-3 bg-muted/20 border-border focus-visible:bg-background"
                                    />
                                </div>
                            ))}

                            {editData.items.length === 0 && (
                                <div className="py-12 text-center rounded-xl border-2 border-dashed border-border bg-muted/10">
                                    <HelpCircle className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                                    <p className="text-xs font-bold text-muted-foreground">No instruction chapters added for {ROLE_CONFIG[selectedRole].label}.</p>
                                    <p className="text-[11px] text-muted-foreground/70 mt-1">Click "Add Chapter" above to create guidance steps.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
