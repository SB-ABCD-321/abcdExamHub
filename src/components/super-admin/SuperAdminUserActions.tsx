"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, Shield, Edit } from "lucide-react";
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

// Placeholder server actions
import { deleteUserAction, updateUserRoleAction } from "./actions";

interface SuperAdminUserActionsProps {
    userId: string;
    userName: string;
    userRole: string;
    isDeveloper?: boolean;
}

export function SuperAdminUserActions({ userId, userName, userRole, isDeveloper }: SuperAdminUserActionsProps) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const handleDelete = async () => {
        setIsPending(true);
        try {
            const res = await deleteUserAction(userId);
            if (res.error) throw new Error(res.error);

            alert("User Deleted. The user has been removed from the platform.");
            setIsDeleteDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsPending(false);
        }
    };

    const handleDemote = async () => {
        setIsPending(true);
        try {
            const res = await updateUserRoleAction(userId, "STUDENT");
            if (res.error) throw new Error(res.error);

            alert("Role Updated. The user has been demoted to Student.");
            setIsRoleDialogOpen(false);
            router.refresh();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsPending(false);
        }
    };

    const handlePromote = async () => {
        setIsPending(true);
        try {
            const res = await updateUserRoleAction(userId, "SUPER_ADMIN");
            if (res.error) throw new Error(res.error);

            alert(`Role Updated. ${userName} has been promoted to SUPER_ADMIN.`);
            router.refresh();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsPending(false);
        }
    };

    if (userRole === "SUPER_ADMIN") return null; // Cannot delete oneself via the grid

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(userRole === "ADMIN" || userRole === "TEACHER") && (
                        <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Revoke Admin/Teacher
                        </DropdownMenuItem>
                    )}
                    {isDeveloper && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN" && (
                        <DropdownMenuItem onClick={handlePromote}>
                            <Shield className="mr-2 h-4 w-4 text-primary" />
                            Promote to Super Admin
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{userName}</strong>? This will permanently remove their exam results and account details.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? "Deleting..." : "Confirm Deletion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Demote Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Privileges</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to demote <strong>{userName}</strong> to a standard Student? They will lose access to their Workspaces.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)} disabled={isPending}>Cancel</Button>
                        <Button onClick={handleDemote} disabled={isPending}>
                            {isPending ? "Updating..." : "Confirm Demotion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
