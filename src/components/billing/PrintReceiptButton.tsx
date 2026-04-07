"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintReceiptButton() {
    return (
        <Button 
            variant="outline" 
            className="rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 h-10 px-4 transition-all hover:scale-105 active:scale-95" 
            onClick={() => window.print()}
        >
            <Printer className="w-3.5 h-3.5 stroke-[2.5]" /> 
            Print Invoice
        </Button>
    );
}
