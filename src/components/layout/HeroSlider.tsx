"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Banner {
    id: string;
    imageUrl: string;
    title?: string | null;
    subtitle?: string | null;
    linkUrl?: string | null;
}

export default function HeroSlider({ banners }: { banners: Banner[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const defaultBanners: Banner[] = [
        { id: "def-1", imageUrl: "https://cdn.pixabay.com/photo/2018/09/04/10/23/boy-3653385_1280.jpg", title: "Smart Exam Solutions" },
        { id: "def-2", imageUrl: "https://cdn.pixabay.com/photo/2015/07/17/22/43/student-849825_1280.jpg", title: "Better Testing" },
        { id: "def-3", imageUrl: "https://cdn.pixabay.com/photo/2022/01/27/19/00/student-6972899_1280.jpg", title: "Building Confidence" }
    ];

    const activeBanners = banners && banners.length > 0 ? banners : defaultBanners;

    useEffect(() => {
        if (activeBanners.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [activeBanners]);

    if (!activeBanners || activeBanners.length === 0) {
        return (
            <div className="absolute inset-0 bg-zinc-950 z-0" />
        );
    }

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeBanners[currentIndex].id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <Image
                        src={activeBanners[currentIndex].imageUrl}
                        alt={activeBanners[currentIndex].title || "Hero Banner"}
                        fill
                        priority={currentIndex === 0}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/40 to-zinc-950/80" />
                </motion.div>
            </AnimatePresence>

            {/* Slider Dots */}
            {isMounted && activeBanners.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {activeBanners.map((banner, idx) => (
                        <button
                            key={banner.id || idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                currentIndex === idx ? "bg-primary w-8" : "bg-white/20 hover:bg-white/40"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
