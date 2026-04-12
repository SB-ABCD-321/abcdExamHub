"use client";

import dynamic from "next/dynamic";
import { NoticeTargetType } from "@prisma/client";


// These are loaded client-side only to prevent Radix UI ID hydration mismatches
const NoticeSender = dynamic(
    () => import("./NoticeSenderTerminal").then(m => m.NoticeSenderTerminal),
    { ssr: false, loading: () => <div className="h-64 rounded-2xl animate-pulse bg-slate-100 dark:bg-zinc-800" /> }
);


const NoticeBoard = dynamic(
    () => import("./NoticeBoardTerminal").then(m => m.NoticeBoardTerminal),
    { ssr: false, loading: () => <div className="h-64 rounded-2xl animate-pulse bg-slate-100 dark:bg-zinc-800" /> }
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
        <div className="grid lg:grid-cols-12 gap-8">
            {hasSender && (
                <div className="lg:col-span-5">
                    <NoticeSender allowedTargets={allowedTargets} workspaces={workspaces} />
                </div>
            )}
            <div className={hasSender ? "lg:col-span-7" : "lg:col-span-12"}>
                <NoticeBoard inbox={inbox} sentBox={showSentTab ? sentBox : []} />
            </div>
        </div>
    );

}
