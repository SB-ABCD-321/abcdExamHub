"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toggleWorkspacePremiumAiAction } from "@/actions/crud";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ToggleAiAccessButton({ workspaceId, isUnlimited }: { workspaceId: string, isUnlimited: boolean }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        setIsLoading(true);
        const res = await toggleWorkspacePremiumAiAction(workspaceId, isUnlimited);
        setIsLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(isUnlimited ? "Premium AI Revoked" : "Premium AI Granted");
            router.refresh();
        }
    };

    return (
        <Button
            variant={isUnlimited ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${isUnlimited ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
            onClick={handleToggle}
            disabled={isLoading}
        >
            <Sparkles className="h-3 w-3" />
            {isUnlimited ? "Premium AI Active" : "Grant Premium AI"}
        </Button>
    );
}
