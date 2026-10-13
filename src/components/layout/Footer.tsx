"use client";

import Link from "next/link";
import { BookOpenCheck, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube, Github, ArrowUpRight, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface FooterProps {
    siteName?: string;
    footerText?: string;
    footerDescription?: string;
    logoUrl?: string;
    contactInfo?: {
        email?: string;
        phone?: string;
        whatsapp?: string;
        address?: string;
    };
    socialLinks?: {
        facebook?: string;
        twitter?: string;
        linkedin?: string;
        instagram?: string;
        youtube?: string;
        github?: string;
        tiktok?: string;
        threads?: string;
    };
    navbarItems?: { label: string; href: string }[];
    dynamicPages?: { title: string; slug: string }[];
}

export default function Footer({
    siteName = "ABCD Exam Hub",
    footerText = "The ultimate digital assessment platform for modern institutions.",
    footerDescription,
    logoUrl = "/abcdExamHub/branding/logo.png",
    contactInfo = {
        email: "support@abcdexamhub.com",
        phone: "8944899747",
        whatsapp: "8944899747",
        address: "Kolkata, WB",
    },
    socialLinks = {
        facebook: "#",
        twitter: "#",
        linkedin: "#",
        instagram: "#",
        youtube: "#",
        github: "#",
    },
    navbarItems = [],
    dynamicPages = [],
}: FooterProps) {
    const currentYear = new Date().getFullYear();

    const mergedContactInfo = {
        email: contactInfo?.email || "support@abcdexamhub.com",
        phone: contactInfo?.phone || "8944899747",
        whatsapp: contactInfo?.whatsapp || "8944899747",
        address: contactInfo?.address || "Kolkata, WB",
    };

    const mergedSocialLinks = {
        facebook: socialLinks?.facebook,
        twitter: socialLinks?.twitter,
        linkedin: socialLinks?.linkedin,
        instagram: socialLinks?.instagram,
        youtube: socialLinks?.youtube,
        github: socialLinks?.github,
        tiktok: socialLinks?.tiktok,
        threads: socialLinks?.threads,
    };

    const menuItems = navbarItems.length > 0 ? navbarItems : [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Pricing", href: "/pricing" },
        { label: "Support", href: "/support" },
    ];

    return (
        <footer className="bg-zinc-950 text-zinc-400 py-12 md:py-16 px-4 sm:px-6 border-t border-primary/10 relative overflow-hidden transition-colors">
            {/* Decorative Orbs */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/2 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Agency Showcase Banner: ABCD Digital Hub */}
                <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900 to-primary/10 border border-primary/20 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-2 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold">
                                <Sparkles className="size-3.5" />
                                <span>Custom EdTech & Web Applications</span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                Need a Custom Educational Platform or Web Application?
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                                Get in touch with <strong className="text-white">ABCD Digital Hub</strong> — a specialized Next.js full-stack web application agency crafting modern exam systems, school portals, and high-performance SaaS solutions.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <a
                                href="https://abcddigitalhub.com"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    size="lg"
                                    className="h-10 px-5 rounded-xl font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-transform hover:scale-102 active:scale-98 gap-1.5"
                                >
                                    <span>Contact ABCD Digital Hub</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
                    {/* Brand Identity */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            {logoUrl && (
                                <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
                            )}
                            {siteName && (
                                <span className="text-xl font-bold tracking-tight text-white">
                                    {siteName}
                                </span>
                            )}
                        </Link>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs">
                            {footerDescription || footerText}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            {mergedSocialLinks.facebook && <SocialIcon icon={<Facebook size={16} />} href={mergedSocialLinks.facebook} />}
                            {mergedSocialLinks.twitter && <SocialIcon icon={<Twitter size={16} />} href={mergedSocialLinks.twitter} />}
                            {mergedSocialLinks.linkedin && <SocialIcon icon={<Linkedin size={16} />} href={mergedSocialLinks.linkedin} />}
                            {mergedSocialLinks.instagram && <SocialIcon icon={<Instagram size={16} />} href={mergedSocialLinks.instagram} />}
                            {mergedSocialLinks.youtube && <SocialIcon icon={<Youtube size={16} />} href={mergedSocialLinks.youtube} />}
                            {mergedSocialLinks.github && <SocialIcon icon={<Github size={16} />} href={mergedSocialLinks.github} />}
                            {mergedSocialLinks.tiktok && (
                                <SocialIcon
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                        </svg>
                                    }
                                    href={mergedSocialLinks.tiktok}
                                />
                            )}
                            {mergedSocialLinks.threads && (
                                <SocialIcon
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                                            <path d="M19.25 19.25L15.35 15.35M17.15 17.15C18.65 15.65 19.25 13.6 18.95 11.55C18.45 8.1 15.65 5.3 12.2 4.8C10.15 4.5 8.1 5.1 6.6 6.6C5.1 8.1 4.5 10.15 4.8 12.2C5.3 15.65 8.1 18.45 11.55 18.95C13.6 19.25 15.65 18.65 17.15 17.15Z" />
                                        </svg>
                                    }
                                    href={mergedSocialLinks.threads}
                                />
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold tracking-wider text-white">Navigation</h4>
                        <ul className="space-y-2">
                            {menuItems.map((item) => (
                                <FooterLink key={item.href} href={item.href}>{item.label}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Legal / Policies */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold tracking-wider text-white">Trust & Security</h4>
                        <ul className="space-y-2">
                            {dynamicPages.length > 0 ? (
                                dynamicPages.map((page) => (
                                    <FooterLink key={page.slug} href={`/policies/${page.slug}`}>{page.title}</FooterLink>
                                ))
                            ) : (
                                <>
                                    <FooterLink href="#">Privacy Policy</FooterLink>
                                    <FooterLink href="#">Terms of Service</FooterLink>
                                    <FooterLink href="#">Cookie Policy</FooterLink>
                                    <FooterLink href="#">Compliance</FooterLink>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Contact info & Action */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-semibold tracking-wider text-white">Connect</h4>
                        <div className="space-y-2.5">
                            {mergedContactInfo.email && (
                                <a href={`mailto:${mergedContactInfo.email}`} className="block transition-transform hover:translate-x-1">
                                    <ContactItem icon={<Mail size={14} />} text={mergedContactInfo.email} />
                                </a>
                            )}
                            {mergedContactInfo.phone && (
                                <a href={`tel:${mergedContactInfo.phone}`} className="block transition-transform hover:translate-x-1">
                                    <ContactItem icon={<Phone size={14} />} text={mergedContactInfo.phone} />
                                </a>
                            )}
                            {mergedContactInfo.whatsapp && (
                                <a
                                    href={`https://wa.me/${mergedContactInfo.whatsapp.replace(/\+/g, "").replace(/ /g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block transition-transform hover:translate-x-1"
                                >
                                    <ContactItem
                                        icon={<FaWhatsapp className="size-3.5 text-emerald-500" />}
                                        text={mergedContactInfo.whatsapp}
                                    />
                                </a>
                            )}
                            {mergedContactInfo.address && (
                                <div className="pt-2 border-t border-white/5">
                                    <ContactItem icon={<MapPin size={14} />} text={mergedContactInfo.address} />
                                </div>
                            )}
                        </div>
                        <div className="pt-2">
                            <Link href="/support">
                                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold w-full rounded-xl h-9 gap-1.5 shadow-sm">
                                    Book a Demo <ArrowUpRight className="size-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p className="text-zinc-500">
                        © {currentYear} {siteName}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <span>Engineered by</span>
                        <a
                            href="https://abcddigitalhub.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold flex items-center gap-1"
                        >
                            <span>ABCD Digital Hub</span>
                            <ArrowUpRight className="size-3" />
                        </a>
                        <span className="hidden sm:inline text-zinc-600">• Next.js Web Agency</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span>System Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialIcon({ icon, href }: { icon: React.ReactNode; href?: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-95"
        >
            {icon}
        </a>
    );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li>
            <Link
                href={href}
                className="text-xs font-medium text-zinc-400 hover:text-primary transition-colors flex items-center group py-0.5"
            >
                <span className="w-0 group-hover:w-2 h-[1px] bg-primary mr-0 group-hover:mr-1.5 transition-all duration-200" />
                {children}
            </Link>
        </li>
    );
}

function ContactItem({ icon, text }: { icon: React.ReactNode; text?: string }) {
    return (
        <div className="flex items-center gap-3 text-xs">
            <div className="text-primary opacity-70">{icon}</div>
            <span className="font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {text}
            </span>
        </div>
    );
}
