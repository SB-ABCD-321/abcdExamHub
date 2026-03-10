"use client";

import Link from "next/link";
import { BookOpenCheck, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube, Github, ArrowUpRight } from "lucide-react";
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
    logoUrl,
    contactInfo = {
        email: "sb.abcd321@gmail.com",
        phone: "+91 8944899747",
        whatsapp: "+91 8944899747",
        address: "Kolkata, West Bengal",
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
        email: contactInfo?.email || "sb.abcd321@gmail.com",
        phone: contactInfo?.phone || "+91 8944899747",
        whatsapp: contactInfo?.whatsapp || "+91 8944899747",
        address: contactInfo?.address || "Kolkata, West Bengal",
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
        <footer className="bg-zinc-950 text-zinc-400 py-20 px-6 border-t border-primary/10 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/2 rounded-full blur-[120px] -ml-64 -mb-64" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    {/* Brand Identity */}
                    <div className="space-y-8">
                        <Link href="/" className="flex items-center gap-3 group">
                            {logoUrl && (
                                <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
                            )}
                            {siteName && (
                                <span className="text-2xl font-bold tracking-tight text-white">
                                    {siteName}
                                </span>
                            )}
                        </Link>
                        <p className="text-sm leading-relaxed max-w-xs italic">
                            {footerDescription || footerText}
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            {mergedSocialLinks.facebook && <SocialIcon icon={<Facebook size={18} />} href={mergedSocialLinks.facebook} />}
                            {mergedSocialLinks.twitter && <SocialIcon icon={<Twitter size={18} />} href={mergedSocialLinks.twitter} />}
                            {mergedSocialLinks.linkedin && <SocialIcon icon={<Linkedin size={18} />} href={mergedSocialLinks.linkedin} />}
                            {mergedSocialLinks.instagram && <SocialIcon icon={<Instagram size={18} />} href={mergedSocialLinks.instagram} />}
                            {mergedSocialLinks.youtube && <SocialIcon icon={<Youtube size={18} />} href={mergedSocialLinks.youtube} />}
                            {mergedSocialLinks.github && <SocialIcon icon={<Github size={18} />} href={mergedSocialLinks.github} />}
                            {mergedSocialLinks.tiktok && (
                                <SocialIcon
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                                            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                        </svg>
                                    }
                                    href={mergedSocialLinks.tiktok}
                                />
                            )}
                            {mergedSocialLinks.threads && (
                                <SocialIcon
                                    icon={
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                                            <path d="M19.25 19.25L15.35 15.35M17.15 17.15C18.65 15.65 19.25 13.6 18.95 11.55C18.45 8.1 15.65 5.3 12.2 4.8C10.15 4.5 8.1 5.1 6.6 6.6C5.1 8.1 4.5 10.15 4.8 12.2C5.3 15.65 8.1 18.45 11.55 18.95C13.6 19.25 15.65 18.65 17.15 17.15Z" />
                                        </svg>
                                    }
                                    href={mergedSocialLinks.threads}
                                />
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-8">
                        <h4 className="text-sm font-bold text-white">Navigation</h4>
                        <ul className="space-y-4">
                            {menuItems.map((item) => (
                                <FooterLink key={item.href} href={item.href}>{item.label}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    {/* Legal / Policies */}
                    <div className="space-y-8">
                        <h4 className="text-sm font-bold text-white">Trust & Security</h4>
                        <ul className="space-y-4">
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

                    {/* Newsletter / Contact */}
                    <div className="space-y-8">
                        <h4 className="text-sm font-bold text-white">Connect with Us</h4>
                        <div className="space-y-4">
                            {mergedContactInfo.email && (
                                <a href={`mailto:${mergedContactInfo.email}`} className="block transition-transform hover:translate-x-1">
                                    <ContactItem icon={<Mail size={16} />} text={mergedContactInfo.email} />
                                </a>
                            )}
                            {mergedContactInfo.phone && (
                                <a href={`tel:${mergedContactInfo.phone}`} className="block transition-transform hover:translate-x-1">
                                    <ContactItem icon={<Phone size={16} />} text={mergedContactInfo.phone} />
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
                                        icon={<FaWhatsapp className="w-4 h-4 text-green-500" />}
                                        text={mergedContactInfo.whatsapp}
                                    />
                                </a>
                            )}
                            {mergedContactInfo.address && (
                                <div className="pt-4 border-t border-white/5">
                                    <ContactItem icon={<MapPin size={16} />} text={mergedContactInfo.address} />
                                </div>
                            )}
                        </div>
                        <div className="pt-4">
                            <Link href="/support">
                                <Button suppressHydrationWarning className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest w-full rounded-xl">
                                    Book a Demo <ArrowUpRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-medium opacity-50">
                        © {currentYear} {siteName}. Engineered for Excellence.
                    </p>
                    <div className="flex items-center gap-8">
                        <span className="text-[10px] font-bold text-primary animate-pulse">
                            System Operational
                        </span>
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
            className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all active:scale-90"
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
                className="text-[11px] font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center group"
            >
                <span className="w-0 group-hover:w-3 h-[1px] bg-primary mr-0 group-hover:mr-2 transition-all duration-300" />
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
