"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, RotateCcw, Sparkles, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "m-1",
    sender: "bot",
    text: "Hello! I am your AI Exam Assistant. Ask me anything about question generation, proctoring security, or institutional workspaces."
  },
  {
    id: "m-2",
    sender: "user",
    text: "How does AI question authoring work?"
  },
  {
    id: "m-3",
    sender: "bot",
    text: "Our Gemini integration formats verified multiple-choice and conceptual questions with full explanations directly from your syllabus topic in seconds."
  }
];

const quickChips = [
  { label: "Grading & Export", query: "How are grades evaluated and exported?" },
  { label: "Anti-Cheat Rules", query: "How does anti-cheat monitoring work?" },
  { label: "Mobile Support", query: "Can candidates take tests from mobile phones?" },
  { label: "Question Banks", query: "Can faculty import existing Excel or CSV banks?" },
  { label: "Custom Subdomain", query: "Can our institution get a dedicated domain?" }
];

const smartReplies: Record<string, string> = {
  grading: "Objective questions are evaluated immediately upon submission with instant answer keys. Instructors can export complete cohort rankings, item analysis, and bell-curves into Excel or PDF reports.",
  proctoring: "We track browser focus shifts, count tab switches, enforce fullscreen mode, and log blur timestamps. Violations exceeding your set limits can trigger automatic submission.",
  mobile: "Yes! Every assessment interface is engineered with responsive, touch-friendly UI optimized for modern smartphones and tablets without requiring any app installations.",
  banks: "Educators can bulk-import existing Excel or CSV question sheets, or save new AI-generated question pools directly into their subject folders.",
  domain: "Yes. Enterprise workspaces receive dedicated branded subdomains (e.g., yourcollege.abcdexamhub.com) with institutional logos and custom access policies.",
  default: "Thank you for asking! ABCD Exam Hub unifies Google Gemini AI question authoring, bank-grade proctoring telemetry, and automated cohort grading into an intuitive, secure platform."
};

export function ExamAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    // Simulate smart AI response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = smartReplies.default;
      if (lower.includes("grad") || lower.includes("result") || lower.includes("export") || lower.includes("score")) {
        reply = smartReplies.grading;
      } else if (lower.includes("cheat") || lower.includes("proctor") || lower.includes("security") || lower.includes("tab") || lower.includes("anti")) {
        reply = smartReplies.proctoring;
      } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("device") || lower.includes("app")) {
        reply = smartReplies.mobile;
      } else if (lower.includes("bank") || lower.includes("excel") || lower.includes("csv") || lower.includes("import")) {
        reply = smartReplies.banks;
      } else if (lower.includes("domain") || lower.includes("subdomain") || lower.includes("brand") || lower.includes("workspace")) {
        reply = smartReplies.domain;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: reply
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleReset = () => {
    setMessages(initialMessages);
    setIsTyping(false);
  };

  return (
    <div className="h-[480px] sm:h-[520px] lg:h-full max-h-[560px] min-h-0 w-full max-w-full min-w-0 flex flex-col rounded-2xl bg-card border border-border/70 shadow-sm overflow-hidden">
      {/* Chat Header — Fixed at top */}
      <div className="p-3.5 border-b border-border/50 bg-muted/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <Bot className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Exam Assistant</span>
              <Sparkles className="size-3 text-primary" />
            </h4>
            <p className="text-[10px] text-muted-foreground font-medium">Powered by Gemini AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            title="Reset conversation"
            className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area — Locked height with internal smooth scrolling */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-2.5 text-xs scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 hover:[&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-2 max-w-[88%]",
                  isBot ? "mr-auto" : "ml-auto flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "size-6 rounded-full shrink-0 flex items-center justify-center text-[10px] mt-0.5",
                    isBot
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border/60"
                  )}
                >
                  {isBot ? <Bot className="size-3" /> : <User className="size-3" />}
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border leading-relaxed",
                    isBot
                      ? "bg-muted/60 text-foreground rounded-tl-none border-border/50"
                      : "bg-primary text-primary-foreground rounded-tr-none border-primary/30 font-medium shadow-xs"
                  )}
                >
                  <p>{msg.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 max-w-[88%] mr-auto"
          >
            <div className="size-6 rounded-full shrink-0 flex items-center justify-center text-[10px] bg-primary/15 text-primary border border-primary/30 mt-0.5">
              <Bot className="size-3" />
            </div>
            <div className="p-2.5 rounded-xl bg-muted/60 border border-border/50 rounded-tl-none flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary animate-bounce" />
              <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
              <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
              <span className="ml-1 text-[10px]">Assistant is replying...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* Suggested Quick Prompt Chips — Pinned above input */}
      <div className="px-3 pt-1.5 pb-2 border-t border-border/40 bg-card/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 w-full max-w-full min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground shrink-0 pl-0.5">
          Suggested:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.query)}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted hover:bg-primary/15 text-muted-foreground hover:text-primary border border-border/60 hover:border-primary/30 transition-colors whitespace-nowrap shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Bar — Pinned at bottom */}
      <div className="p-2.5 border-t border-border/50 bg-muted/30 shrink-0 w-full min-w-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 w-full min-w-0"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about the platform..."
            className="h-8.5 text-xs bg-background border-border/60 rounded-xl focus-visible:ring-1 focus-visible:ring-primary min-w-0 flex-1 w-full"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim()}
            className="h-8.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shrink-0 shadow-xs"
          >
            <Send className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
