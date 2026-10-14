"use client";

import { useState } from "react";
import { UserRow } from "./user-row";

interface UserListProps {
    users: any[];
    isDeveloper: boolean;
}

export function UserList({ users, isDeveloper }: UserListProps) {
    // Single expanded user ID so opening another automatically closes the previous
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const handleToggle = (id: string) => {
        setExpandedUserId((current) => (current === id ? null : id));
    };

    return (
        <div className="flex flex-col gap-2.5">
            {users.map((user) => (
                <UserRow
                    key={user.id}
                    user={user}
                    isDeveloper={isDeveloper}
                    isExpanded={expandedUserId === user.id}
                    onToggle={() => handleToggle(user.id)}
                />
            ))}
        </div>
    );
}
