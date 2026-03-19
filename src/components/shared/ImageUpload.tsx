"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/app/actions/upload";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    folder?: string;
}

export function ImageUpload({ value, onChange, onRemove, folder = "questions" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Restriction: 200kb
        if (file.size > 200 * 1024) {
            toast.error("Image too large. Maximum size allowed is 200kb.");
            return;
        }

        setUploading(true);
        try {
            const url = await uploadToCloudinary(file, folder) as string;
            onChange(url);
            toast.success("Image uploaded successfully");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:scale-[1.02]">
                        <img 
                            src={value} 
                            alt="Upload preview" 
                            className="w-full h-full object-cover"
                        />
                        <Button
                            type="button"
                            onClick={onRemove}
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div 
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className={cn(
                            "w-40 h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50",
                            uploading ? "opacity-50 cursor-not-allowed border-primary/50" : "border-zinc-200 dark:border-zinc-800 hover:border-primary/50"
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                            <ImagePlus className="w-8 h-8 text-zinc-400" />
                        )}
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center px-4">
                            {uploading ? "Uploading..." : "Click to Upload Question Image"}
                        </span>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </div>
                )}
            </div>
            {!value && !uploading && (
                <p className="text-[10px] font-medium text-slate-400 italic">
                    Images help students identify complex concepts or visual patterns. Max 200kb.
                </p>
            )}
        </div>
    );
}
