import {
    ShieldCheck, Zap, BarChart3, Bot, Users, Star, ArrowRight, Rocket,
    Building2, Globe, LucideIcon, TrainFront, GraduationCap, School,
    BookOpen, Brain, Lightbulb, Trophy, Cpu, Cloud, Globe2, Shield,
    Lock, Mail, Phone, MapPin, Database, Terminal, Settings2,
    Anvil, Wrench, Hammer, Construction, Toolbox, HardHat, Pickaxe,
    Briefcase, Layout, LayoutGrid, FileSearch, Search,
    Monitor, Mouse, Keyboard, Headphones, Speaker, Wifi,
    AlertTriangle, Info, CheckCircle2, XCircle, HelpCircle,
    ShoppingBag, ShoppingCart, CreditCard, Wallet, Banknote,
    Plane, Ship, Bus, Car, Bike, Train,
    Award, Target, Fingerprint, HardDrive, Cpu as CpuIcon,
    Laptop, Server, Watch, Tv, Smartphone, Tablet
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
    "shieldcheck": ShieldCheck,
    "zap": Zap,
    "barchart3": BarChart3,
    "bot": Bot,
    "users": Users,
    "star": Star,
    "arrowright": ArrowRight,
    "rocket": Rocket,
    "building2": Building2,
    "globe": Globe,
    "trainfront": TrainFront,
    "graduationcap": GraduationCap,
    "school": School,
    "bookopen": BookOpen,
    "brain": Brain,
    "lightbulb": Lightbulb,
    "trophy": Trophy,
    "cpu": Cpu,
    "cloud": Cloud,
    "globe2": Globe2,
    "shield": Shield,
    "lock": Lock,
    "mail": Mail,
    "phone": Phone,
    "mappin": MapPin,
    "database": Database,
    "terminal": Terminal,
    "settings2": Settings2,
    "anvil": Anvil,
    "wrench": Wrench,
    "hammer": Hammer,
    "construction": Construction,
    "toolbox": Toolbox,
    "hardhat": HardHat,
    "pickaxe": Pickaxe,
    "briefcase": Briefcase,
    "layout": Layout,
    "layoutgrid": LayoutGrid,
    "filesearch": FileSearch,
    "search": Search,
    "monitor": Monitor,
    "mouse": Mouse,
    "keyboard": Keyboard,
    "headphones": Headphones,
    "speaker": Speaker,
    "wifi": Wifi,
    "alerttriangle": AlertTriangle,
    "info": Info,
    "checkcircle2": CheckCircle2,
    "xcircle": XCircle,
    "helpcircle": HelpCircle,
    "shoppingbag": ShoppingBag,
    "shoppingcart": ShoppingCart,
    "creditcard": CreditCard,
    "wallet": Wallet,
    "banknote": Banknote,
    "plane": Plane,
    "ship": Ship,
    "bus": Bus,
    "car": Car,
    "bike": Bike,
    "train": Train,
    "award": Award,
    "target": Target,
    "fingerprint": Fingerprint,
    "harddrive": HardDrive,
    "cpuicon": CpuIcon,
    "laptop": Laptop,
    "server": Server,
    "watch": Watch,
    "tv": Tv,
    "smartphone": Smartphone,
    "tablet": Tablet
};

export function getIconByName(name: string | null | undefined): LucideIcon {
    if (!name) return Settings2;

    const normalizedName = name.toLowerCase().trim();
    const icon = ICON_MAP[normalizedName];

    if (!icon) {
        // Log to server console only (if SSR)
        if (typeof window === "undefined") {
            console.warn(`[Icons] Icon "${name}" not found in ICON_MAP. Falling back to Settings2.`);
        }
        return Settings2;
    }

    return icon;
}
