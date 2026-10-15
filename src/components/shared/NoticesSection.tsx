"use client";

import dynamic from "next/dynamic";
import { NoticeTargetType } from "@prisma/client";

// Loaded client-side only to prevent Radix UI hydration mismatches
const NoticeSender = dynamic(
    () => import("./NoticeSenderTerminal").then(m => m.NoticeSenderTerminal),
    { 
        ssr: false, 
        loading: () => (
            <div className="h-[480px] rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl animate-pulse p-6 space-y-4">
                <div className="h-6 w-36 bg-muted/60 rounded-lg" />
                <div className="h-10 w-full bg-muted/40 rounded-xl" />
                <div className="h-10 w-full bg-muted/40 rounded-xl" />
                <div className="h-28 w-full bg-muted/40 rounded-xl" />
                <div className="h-11 w-full bg-muted/60 rounded-xl" />
            </div>
        ) 
    }
);

const NoticeBoard = dynamic(
    () => import("./NoticeBoardTerminal").then(m => m.NoticeBoardTerminal),
    { 
        ssr: false, 
        loading: () => (
            <div className="h-[720px] rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl animate-pulse p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border/40">
                    <div className="h-8 w-44 bg-muted/60 rounded-lg" />
                    <div className="h-8 w-28 bg-muted/40 rounded-lg" />
                </div>
                <div className="grid grid-cols-12 gap-4 h-[600px]">
                    <div className="col-span-5 space-y-3">
                        <div className="h-16 w-full bg-muted/40 rounded-xl" />
                        <div className="h-16 w-full bg-muted/40 rounded-xl" />
                        <div className="h-16 w-full bg-muted/40 rounded-xl" />
                        <div className="h-16 w-full bg-muted/40 rounded-xl" />
                    </div>
                    <div className="col-span-7 bg-muted/20 rounded-xl p-6" />
                </div>
            </div>
        ) 
    }
);

export interface TargetOption {
    value: NoticeTargetType;
    label: string;
    group: string;
    needsWorkspace?: boolean;
    needsEmail?: boolean;
}

interface Props {
    allowedTargets: TargetOption[];
    workspaces: { id: string; name: string }[];
    inbox: any[];
    sentBox: any[];
    showSentTab?: boolean;
}

export function NoticesSection({ allowedTargets, workspaces, inbox, sentBox, showSentTab = true }: Props) {
    const hasSender = allowedTargets.length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {hasSender && (
                <div className="lg:col-span-4 w-full">
                    <NoticeSender allowedTargets={allowedTargets} workspaces={workspaces} />
                </div>
            )}
            <div className={hasSender ? "lg:col-span-8 w-full" : "lg:col-span-12 w-full"}>
                <NoticeBoard inbox={inbox} sentBox={showSentTab ? sentBox : []} />
            </div>
        </div>
    );
}
