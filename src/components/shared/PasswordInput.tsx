"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export function PasswordInput({ icon, className, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowPassword(!showPassword);
    };

    return (
        <div className="relative group">
            {icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none">
                    {icon}
                </div>
            )}
            <Input
                {...props}
                type={showPassword ? "text" : "password"}
                className={cn(
                    "pr-12",
                    icon ? "pl-12" : "pl-4",
                    className
                )}
            />
            <button
                type="button"
                onClick={togglePassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                tabIndex={-1}
            >
                {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                ) : (
                    <Eye className="w-4 h-4" />
                )}
            </button>
        </div>
    );
}
