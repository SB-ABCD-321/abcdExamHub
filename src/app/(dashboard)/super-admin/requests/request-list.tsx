"use client";

import { useState } from "react";
import { RequestCard } from "./request-card";

interface RequestListProps {
    requests: any[];
    readonly?: boolean;
    histories?: Record<string, any[]>;
}

export function RequestList({ requests, readonly = false, histories = {} }: RequestListProps) {
    // Single expanded request ID so opening another request automatically closes the previous
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

    const handleToggle = (id: string) => {
        setExpandedRequestId((current) => (current === id ? null : id));
    };

    return (
        <div className="flex flex-col gap-2.5">
            {requests.map((request) => (
                <RequestCard
                    key={request.id}
                    request={request}
                    readonly={readonly}
                    history={histories[request.id] || []}
                    isExpanded={expandedRequestId === request.id}
                    onToggle={() => handleToggle(request.id)}
                />
            ))}
        </div>
    );
}
