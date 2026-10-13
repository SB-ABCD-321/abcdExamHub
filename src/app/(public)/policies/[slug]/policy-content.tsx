import React from "react";
import { CheckCircle2, AlertCircle, Mail, Phone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyContentProps {
    content: string;
    pageTitle: string;
}

interface ParsedSection {
    number?: string;
    title?: string;
    badge?: string;
    paragraphs: Array<{
        type: "paragraph" | "list" | "callout" | "contact";
        text?: string;
        items?: string[];
    }>;
}

function formatInlineText(text: string): React.ReactNode {
    // Replace emails with mailto links, phone numbers with tel links, and *bold* or **bold**
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?\d{10}|\b\d{10}\b)/g;

    // Split text by bold markers
    const boldParts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

    return boldParts.map((part, idx) => {
        if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("*") && part.endsWith("*") && part.length > 2)) {
            const inner = part.replace(/^\*+|\*+$/g, "");
            return <strong key={idx} className="font-semibold text-foreground">{inner}</strong>;
        }

        // Parse emails in part
        const emailParts = part.split(emailRegex);
        return emailParts.map((ePart, eIdx) => {
            if (ePart.match(emailRegex)) {
                return (
                    <a
                        key={`${idx}-${eIdx}`}
                        href={`mailto:${ePart}`}
                        className="text-primary font-medium hover:underline inline-flex items-center gap-1 mx-0.5"
                    >
                        {ePart}
                    </a>
                );
            }

            // Parse phone in subpart
            const phoneParts = ePart.split(phoneRegex);
            return phoneParts.map((pPart, pIdx) => {
                if (pPart.match(phoneRegex)) {
                    return (
                        <a
                            key={`${idx}-${eIdx}-${pIdx}`}
                            href={`tel:${pPart.replace(/\s+/g, "")}`}
                            className="text-primary font-medium hover:underline inline-flex items-center gap-1 mx-0.5"
                        >
                            {pPart}
                        </a>
                    );
                }
                return pPart;
            });
        });
    });
}

export function parsePolicyContent(raw: string, pageTitle: string): ParsedSection[] {
    // If the content is raw HTML (contains tags like <p>, <div>, <h1>)
    const isHtml = /<[a-z][\s\S]*>/i.test(raw);
    if (isHtml) {
        return [{
            paragraphs: [{
                type: "paragraph",
                text: raw
            }]
        }];
    }

    // Split by divider "---"
    const rawBlocks = raw.split(/\n\s*---\s*\n/);
    const sections: ParsedSection[] = [];

    for (let block of rawBlocks) {
        const trimmed = block.trim();
        if (!trimmed) continue;

        const lines = trimmed.split("\n").map(l => l.trim());

        const nonEmptyLines = lines.filter(l => l.length > 0);
        if (nonEmptyLines.length === 0) continue;

        // Check if block starts with duplicated title and effective date
        let startIndex = 0;
        if (nonEmptyLines[0]?.toLowerCase().includes(pageTitle.toLowerCase())) {
            startIndex = 1;
        }
        if (nonEmptyLines[startIndex]?.toLowerCase().startsWith("effective date:")) {
            startIndex++;
        }

        const remainingLines = nonEmptyLines.slice(startIndex);
        if (remainingLines.length === 0) continue;

        // Check if first remaining line is a section heading: e.g. "1. Acceptance of Terms" or "15. Contact Information"
        const headingMatch = remainingLines[0].match(/^(\d+)\.\s+(.*)$/);
        let sectionNumber: string | undefined;
        let sectionTitle: string | undefined;
        let badge: string | undefined;
        let contentLines = remainingLines;

        if (headingMatch) {
            sectionNumber = headingMatch[1].padStart(2, "0");
            let rawTitle = headingMatch[2];

            // Extract badges like (Strict Rule) or (VERY IMPORTANT)
            const badgeMatch = rawTitle.match(/\(([^)]+)\)/);
            if (badgeMatch) {
                badge = badgeMatch[1];
                rawTitle = rawTitle.replace(/\([^)]+\)/, "").trim();
            }

            sectionTitle = rawTitle;
            contentLines = remainingLines.slice(1);
        }

        // Process content lines into paragraphs or lists
        const parsedParagraphs: ParsedSection["paragraphs"] = [];
        let currentList: string[] = [];

        for (const line of contentLines) {
            // Check for list bullet: "* item" or "- item"
            const bulletMatch = line.match(/^[\*\-]\s+(.*)$/);
            if (bulletMatch) {
                currentList.push(bulletMatch[1]);
            } else {
                if (currentList.length > 0) {
                    parsedParagraphs.push({ type: "list", items: [...currentList] });
                    currentList = [];
                }

                // Check for trailing agreement notice
                if (line.toLowerCase().startsWith("by using") || line.toLowerCase().startsWith("by making a payment")) {
                    parsedParagraphs.push({ type: "callout", text: line });
                } else if (line.toLowerCase().startsWith("email:") || line.toLowerCase().startsWith("phone:")) {
                    parsedParagraphs.push({ type: "contact", text: line });
                } else {
                    parsedParagraphs.push({ type: "paragraph", text: line });
                }
            }
        }

        if (currentList.length > 0) {
            parsedParagraphs.push({ type: "list", items: currentList });
        }

        sections.push({
            number: sectionNumber,
            title: sectionTitle,
            badge,
            paragraphs: parsedParagraphs
        });
    }

    return sections;
}

export default function PolicyContent({ content, pageTitle }: PolicyContentProps) {
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    if (isHtml) {
        return (
            <div
                className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    const sections = parsePolicyContent(content, pageTitle);

    return (
        <div className="space-y-6 sm:space-y-8">
            {sections.map((section, sIdx) => {
                const hasHeading = Boolean(section.number || section.title);

                return (
                    <div
                        key={sIdx}
                        className={cn(
                            "rounded-2xl transition-all",
                            hasHeading
                                ? "p-5 sm:p-6 md:p-7 bg-card border border-border/60 shadow-xs hover:border-primary/30"
                                : "p-4 sm:p-5 bg-muted/30 border border-border/40 rounded-xl"
                        )}
                    >
                        {hasHeading && (
                            <div className="flex flex-wrap items-center gap-2.5 pb-4 mb-4 border-b border-border/50">
                                {section.number && (
                                    <span className="flex items-center justify-center size-7 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold border border-primary/20">
                                        {section.number}
                                    </span>
                                )}
                                {section.title && (
                                    <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                                        {section.title}
                                    </h2>
                                )}
                                {section.badge && (
                                    <span className="ml-auto text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        {section.badge}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="space-y-3.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {section.paragraphs.map((p, pIdx) => {
                                if (p.type === "list" && p.items) {
                                    return (
                                        <ul key={pIdx} className="space-y-2 pl-1 py-1">
                                            {p.items.map((item, iIdx) => (
                                                <li key={iIdx} className="flex items-start gap-2.5 text-foreground/90">
                                                    <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                    <span className="flex-1">{formatInlineText(item)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }

                                if (p.type === "callout" && p.text) {
                                    return (
                                        <div
                                            key={pIdx}
                                            className="mt-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-foreground font-medium flex items-start gap-2.5"
                                        >
                                            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                                            <span className="text-xs sm:text-sm">{formatInlineText(p.text)}</span>
                                        </div>
                                    );
                                }

                                if (p.type === "contact" && p.text) {
                                    const isEmail = p.text.toLowerCase().includes("email:");
                                    const isPhone = p.text.toLowerCase().includes("phone:");
                                    return (
                                        <div key={pIdx} className="flex items-center gap-2 py-0.5">
                                            {isEmail && <Mail className="size-3.5 text-primary shrink-0" />}
                                            {isPhone && <Phone className="size-3.5 text-primary shrink-0" />}
                                            <span className="font-medium text-foreground">{formatInlineText(p.text)}</span>
                                        </div>
                                    );
                                }

                                if (p.text) {
                                    return (
                                        <p key={pIdx} className="text-muted-foreground font-normal">
                                            {formatInlineText(p.text)}
                                        </p>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
