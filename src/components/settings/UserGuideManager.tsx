"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Save, X, BookMarked, GripVertical } from "lucide-react";
import { createUserGuide, updateUserGuide, deleteUserGuide } from "@/actions/guide";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";

interface UserGuide {
    id: string;
    role: Role;
    title: string;
    content: string;
    order: number;
}

export function UserGuideManager({ initialGuides }: { initialGuides: UserGuide[] }) {
    const [guides, setGuides] = useState<UserGuide[]>(initialGuides);
    const [isAdding, setIsAdding] = useState(false);
    const [isPending, startTransition] = useTransition();

    // New guide state
    const [newRole, setNewRole] = useState<Role>("STUDENT");
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newIcon, setNewIcon] = useState("BookMarked");
    const [newOrder, setNewOrder] = useState(0);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<Role>("STUDENT");
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editOrder, setEditOrder] = useState(0);

    const handleAdd = async () => {
        if (!newTitle || !newContent) {
            toast.error("Title and Content are required");
            return;
        }

        startTransition(async () => {
            const res = await createUserGuide({
                role: newRole,
                title: newTitle,
                content: newContent,
                order: newOrder,
            });

            if (res.success && res.data) {
                toast.success("Guide created successfully");
                setGuides([...guides, res.data as UserGuide]);
                setIsAdding(false);
                resetNewForm();
            } else {
                toast.error(res.error || "Failed to create guide");
            }
        });
    };

    const handleUpdate = async (id: string) => {
        startTransition(async () => {
            const res = await updateUserGuide(id, {
                role: editRole,
                title: editTitle,
                content: editContent,
                order: editOrder,
            });

            if (res.success && res.data) {
                toast.success("Guide updated successfully");
                setGuides(guides.map(g => g.id === id ? (res.data as UserGuide) : g));
                setEditingId(null);
            } else {
                toast.error(res.error || "Failed to update guide");
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this guide section?")) return;

        startTransition(async () => {
            const res = await deleteUserGuide(id);
            if (res.success) {
                toast.success("Guide deleted");
                setGuides(guides.filter(g => g.id !== id));
            } else {
                toast.error(res.error || "Failed to delete guide");
            }
        });
    };

    const resetNewForm = () => {
        setNewTitle("");
        setNewContent("");
        setNewOrder(0);
    };

    const startEditing = (guide: UserGuide) => {
        setEditingId(guide.id);
        setEditRole(guide.role);
        setEditTitle(guide.title);
        setEditContent(guide.content);
        setEditOrder(guide.order);
    };

    const roles = ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"];

    return (
        <Card className="border shadow-none rounded-xl overflow-hidden">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg font-bold">User Documentation</CardTitle>
                    <CardDescription className="text-xs font-medium">Manage dynamic guide sections for all user roles.</CardDescription>
                </div>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    variant={isAdding ? "ghost" : "outline"}
                    size="sm"
                    className="h-8 gap-2 font-bold px-4 rounded-xl"
                >
                    {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAdding ? "Cancel" : "New Guide Section"}
                </Button>
            </CardHeader>
            <CardContent className="p-0 border-t space-y-0">
                {isAdding && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/30 border-b space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 font-sans">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Role</Label>
                                <Select value={newRole} onValueChange={(value) => setNewRole(value as Role)}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Order</Label>
                                <Input
                                    type="number"
                                    value={newOrder}
                                    onChange={(e) => setNewOrder(parseInt(e.target.value))}
                                    className="bg-background"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Section Title</Label>
                            <Input
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="How to manage AI Credits"
                                className="bg-background font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Content (Markdown/HTML supported)</Label>
                            <Textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Explain the feature here..."
                                className="min-h-[200px] bg-background font-mono text-sm"
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            disabled={isPending}
                            className="w-full bg-zinc-950 text-white dark:bg-white dark:text-black font-bold h-12 rounded-xl"
                        >
                            {isPending ? "Creating..." : "Create Guide Section"}
                        </Button>
                    </div>
                )}

                <div className="divide-y">
                    {guides.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground italic text-sm">No dynamic guides found.</div>
                    ) : (
                        guides.map((guide) => (
                            <div key={guide.id} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all group">
                                {editingId === guide.id ? (
                                    <div className="space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold">Role</Label>
                                                <Select value={editRole} onValueChange={(value) => setEditRole(value as Role)}>
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {roles.map(r => (
                                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold">Order</Label>
                                                <Input
                                                    type="number"
                                                    value={editOrder}
                                                    onChange={(e) => setEditOrder(parseInt(e.target.value))}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold">Title</Label>
                                            <Input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="bg-background font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold">Content</Label>
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="min-h-[200px] bg-background font-mono text-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleUpdate(guide.id)} disabled={isPending} className="flex-1 bg-zinc-950 text-white dark:bg-white dark:text-black h-10 rounded-lg">
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </Button>
                                            <Button variant="outline" onClick={() => setEditingId(null)} className="h-10 px-4 rounded-lg">
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-6">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <BookMarked className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded uppercase tracking-tighter">
                                                    {guide.role}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    Order: {guide.order}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">{guide.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                                {guide.content.substring(0, 150)}...
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => startEditing(guide)} className="h-9 w-9 text-zinc-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(guide.id)} className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
