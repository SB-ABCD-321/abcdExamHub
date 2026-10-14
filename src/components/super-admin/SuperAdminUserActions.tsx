"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Shield, UserMinus, UserCheck, ShieldAlert } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { deleteUserAction, updateUserRoleAction } from "./actions";
import { MakeAdminModal } from "./MakeAdminModal";
import { toast } from "sonner";

interface SuperAdminUserActionsProps {
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    createdAt: Date;
    isDeveloper?: boolean;
}

export function SuperAdminUserActions({ 
    userId, 
    userName, 
    userEmail, 
    userRole, 
    createdAt, 
    isDeveloper 
}: SuperAdminUserActionsProps) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        setIsPending(true);
        try {
            const res = await deleteUserAction(userId);
            if (res.error) throw new Error(res.error);

            toast.success("User account deleted permanently.");
            setIsDeleteDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete user");
        } finally {
            setIsPending(false);
        }
    };

    const handleDemote = async () => {
        setIsPending(true);
        try {
            const res = await updateUserRoleAction(userId, "STUDENT");
            if (res.error) throw new Error(res.error);

            toast.success(`${userName} has been demoted to standard Student.`);
            setIsRoleDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update role");
        } finally {
            setIsPending(false);
        }
    };

    const handlePromote = async () => {
        setIsPending(true);
        try {
            const res = await updateUserRoleAction(userId, "SUPER_ADMIN");
            if (res.error) throw new Error(res.error);

            toast.success(`${userName} has been promoted to Super Admin.`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to promote user");
        } finally {
            setIsPending(false);
        }
    };

    if (userRole === "SUPER_ADMIN") return null; // Cannot delete/demote oneself via the grid

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {/* modal={false} is critical to prevent Radix from locking body scroll and shifting the page / topbar */}
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="More user options"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="size-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                    align="end" 
                    sideOffset={6}
                    onClick={(e) => e.stopPropagation()}
                    className="w-52 rounded-xl border border-border/70 bg-popover/95 backdrop-blur-md p-1 shadow-lg shadow-black/10 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-1.5 duration-150 ease-out z-[100]"
                >
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        User Operations
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator className="my-1 bg-border/40" />
                    
                    {(userRole === "ADMIN" || userRole === "TEACHER") && (
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsRoleDialogOpen(true);
                            }}
                            className="rounded-lg text-xs font-semibold py-1.5 px-2 text-amber-600 dark:text-amber-400 focus:bg-amber-500/10 focus:text-amber-600 cursor-pointer"
                        >
                            <UserMinus className="mr-2 size-3.5" />
                            Revoke Privileges
                        </DropdownMenuItem>
                    )}

                    {isDeveloper && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN" && (
                        <DropdownMenuItem 
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePromote();
                            }}
                            className="rounded-lg text-xs font-semibold py-1.5 px-2 text-primary focus:bg-primary/10 focus:text-primary cursor-pointer"
                        >
                            <Shield className="mr-2 size-3.5" />
                            Promote to Super Admin
                        </DropdownMenuItem>
                    )}

                    {userRole !== "SUPER_ADMIN" && userRole !== "ADMIN" && (
                        <div className="sm:hidden" onClick={(e) => e.stopPropagation()}>
                            <MakeAdminModal
                                userId={userId}
                                userName={userName}
                                userEmail={userEmail}
                                variant="menuItem"
                            />
                        </div>
                    )}

                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteDialogOpen(true);
                        }}
                        className="rounded-lg text-xs font-semibold py-1.5 px-2 text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600 cursor-pointer"
                    >
                        <Trash2 className="mr-2 size-3.5" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
                            <ShieldAlert className="size-5" />
                            Delete User Identity
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Are you sure you want to delete <strong>{userName}</strong> ({userEmail})? This action is irreversible and will permanently wipe their enrolled exam records and institutional links.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-xl text-xs h-8.5"
                            onClick={() => setIsDeleteDialogOpen(false)} 
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            className="rounded-xl text-xs h-8.5"
                            onClick={handleDelete} 
                            disabled={isPending}
                        >
                            {isPending ? "Deleting..." : "Permanently Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Demote Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
                            <UserMinus className="size-5" />
                            Revoke Access Privileges
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Are you sure you want to demote <strong>{userName}</strong> to a standard Student? They will immediately forfeit administrative governance access to their assigned organizations.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-xl text-xs h-8.5"
                            onClick={() => setIsRoleDialogOpen(false)} 
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="default"
                            size="sm"
                            className="rounded-xl text-xs h-8.5 bg-amber-600 hover:bg-amber-500 text-white"
                            onClick={handleDemote} 
                            disabled={isPending}
                        >
                            {isPending ? "Updating..." : "Confirm Demotion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
