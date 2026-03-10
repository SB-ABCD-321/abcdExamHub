"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Bot, X, Send, Sparkles, User, ArrowUpRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";


export default function GlobalFloaters() {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith("/dashboard") ||
        pathname?.startsWith("/super-admin") ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/teacher") ||
        pathname?.startsWith("/student");

    const [isChatOpen, setIsChatOpen] = useState(false);

    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState<{ role: 'ai' | 'user', text: string }[]>([
        { role: 'ai', text: "Welcome to ABCD Intelligence. How can I assist with your assessment mission today?" }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;

        const newHistory = [...chatHistory, { role: 'user' as const, text: chatMessage }];
        setChatHistory(newHistory);
        setChatMessage("");
        setIsTyping(true);

        // Simulate AI Response
        setTimeout(() => {
            setChatHistory([...newHistory, {
                role: 'ai' as const,
                text: "I've analyzed your query. For detailed configuration help, please check our Documentation or book a strategic demo in the Support section."
            }]);
            setIsTyping(false);
        }, 1500);
    };

    if (isDashboard) return null;

    return (
        <>
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
                {/* WhatsApp Float */}
                <a
                    href="https://wa.me/918944899747"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
                >
                    <div className="absolute -left-32 px-3 py-1 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        WhatsApp Support
                    </div>
                    <FaWhatsapp size={26} />
                </a>

                {/* AI Chatbot Float */}
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    suppressHydrationWarning
                    className={cn(
                        "group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95",
                        isChatOpen ? "bg-zinc-900 text-white" : "bg-primary text-primary-foreground"
                    )}
                >
                    <div className="absolute -left-28 px-3 py-1 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        AI Assistant
                    </div>
                    {isChatOpen ? <X size={26} /> : <Bot size={26} className="animate-pulse" />}
                </button>
            </div>

            {/* Chatbox UI */}
            <div className={cn(
                "fixed bottom-28 right-8 w-96 max-w-[calc(100vw-64px)] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl z-[100] border border-primary/20 transition-all duration-500 origin-bottom-right flex flex-col overflow-hidden",
                isChatOpen ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-20 pointer-events-none"
            )}>
                {/* Chat Header */}
                <div className="p-6 bg-zinc-950 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-xl">
                            <Bot size={18} className="text-primary-foreground" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest">ABCD AI GPT-4o</h4>
                            <p className="text-[8px] font-bold text-primary flex items-center gap-1">
                                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                Strategic Core Online
                            </p>
                        </div>
                    </div>
                    <Sparkles size={16} className="text-primary/50" />
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[400px] space-y-4 scrollbar-hide">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={cn("flex items-start gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                            <div className={cn("p-2 rounded-lg", msg.role === 'ai' ? "bg-primary/10 text-primary" : "bg-zinc-100 dark:bg-zinc-800")}>
                                {msg.role === 'ai' ? <Bot size={12} /> : <User size={12} />}
                            </div>
                            <div className={cn(
                                "p-4 text-xs font-medium leading-relaxed max-w-[80%]",
                                msg.role === 'ai'
                                    ? "bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl rounded-tl-none italic"
                                    : "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                            )}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl w-fit">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                        </div>
                    )}
                </div>

                {/* Chat Input */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-border/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={chatMessage}
                            suppressHydrationWarning
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Inquire tactical help..."
                            className="flex-1 bg-white dark:bg-zinc-900 border border-border/70 rounded-xl h-12 px-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <Button onClick={handleSendMessage} suppressHydrationWarning size="icon" className="h-12 w-12 rounded-xl bg-primary text-primary-foreground">
                            <Send size={18} />
                        </Button>
                    </div>
                    <p className="mt-2 text-[8px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                        Powered by Gemini Strategic Engine
                    </p>
                </div>
            </div>
        </>
    );
}
