# ABCD Exam Hub — Design & Content Architecture Guide

## 1. Visual Identity & Theme Tokens

### 1.1 Color Palette & Semantics
- **Primary:** Warm Amber / Gold (`oklch(0.79 0.16 80)` / `#f59e0b` family) — high-contrast, energetic, and professional.
- **Backgrounds:**
  - Light Mode: Crisp off-white `#fafafa` / OKLCH background tokens with subtle border contrasts.
  - Dark Mode: Deep zinc `#09090b` / `#18181b` with soft ambient card elevations.
- **Semantic Tokens:** Strict usage of `--background`, `--foreground`, `--card`, `--card-foreground`, `--border`, `--muted`, `--primary`, avoiding hardcoded `bg-zinc-950` or `bg-white` unless specifically isolated in rich hero canvases.

### 1.2 Spacing & Vertical Rhythm (No Oversized Bloat)
- **Section Spacing:** Standardized to `py-10 sm:py-12 md:py-16` (never `py-32` or excessive `min-h-[90vh]` that create vast dead zones).
- **Component Padding:** Standard cards use `p-4 sm:p-5` or `p-6` max. No bloated `p-10` or `p-12`.
- **Corner Radii:** Harmonized on `rounded-xl` (buttons, inputs, badges) and `rounded-2xl` (cards, containers, modals). Eliminated clumsy `rounded-[3rem]` and `rounded-[3.5rem]`.
- **Gaps & Grids:** Balanced grid gaps `gap-4 sm:gap-5 md:gap-6` to maintain information density without clutter.

### 1.3 Typography & Content Casing Policy
- **No ALL-CAPS Yelling:** Avoid screaming uppercase labels like `"THE UNIFIED ECOSYSTEM"`, `"MILITARY GRADE SECURITY"`, `"KNOWLEDGE BASE"`.
- **Heading Style:** Modern, clean Title Case or Sentence Case with crisp font weights (`font-bold` / `font-extrabold`).
- **Badges & Eyebrows:** Subtle, tasteful, uppercase tracking restricted to small 10–11px tags (`text-[10px] sm:text-[11px] font-semibold tracking-wider`), always paired with soft background tints (`bg-primary/10 text-primary border border-primary/20`).

---

## 2. Public Pages Blueprint & Content Strategy

### 2.1 Home Landing Page (`src/app/(public)/page.tsx`)
1. **Hero Section:**
   - Balanced vertical height (`py-12 md:py-20` instead of `min-h-[90vh]`) to ensure the About section flows naturally without a giant empty bottom void.
   - Punchy, inspiring headline: *"Intelligent assessment platform for modern institutions"*.
   - Live platform proof: Quick stat metrics strip, direct CTA buttons (*Get Started* & *Explore Features*), and a high-tech preview graphic.
2. **About / Legacy Section:**
   - Balanced two-column storytelling: Real photographic or vector showcase paired with core institutional pillars.
3. **Core Advantages:**
   - 6 focused value cards: Isolated Workspaces, Gemini AI Question Bank, Real-Time Proctoring, Instant Grading, Smart Onboarding, and Deep Cohort Analytics.
4. **Our Process (Enhanced Steps):**
   - 4-step clear workflow with dedicated icons (`Building2`, `Users`, `Sparkles`, `ShieldCheck`), step counters (`Step 01` to `Step 04`), and actionable guidance.
5. **Knowledge Base (FAQ) & AI Assistant:**
   - Compact, high-density accordion items (`p-4 sm:p-5`, `rounded-xl`) with smooth expand/collapse.
   - Refined live AI Chat simulation card with realistic message bubbles.
6. **Institutional Contact & Enterprise Inquiry:**
   - Quick inquiry form with clean input heights (`h-10`) alongside corporate contact channels.

### 2.2 Services Page (`src/app/(public)/services/page.tsx`)
1. **Hero Section with Dynamic Typing Effect:**
   - Unified typing animation: Fixed prefix (*"Next-Gen Online "*) with smoothly cycled dynamic phrases:
     - *"AI Question Generation"*
     - *"Examination Platform"*
     - *"Real-Time Proctoring"*
     - *"Institutional Analytics"*
   - No layout shifts or double-typing conflicts.
2. **Role Integration Cards:**
   - 3 distinct institutional personas: **Portal Administrator**, **Faculty & Educators**, and **Student Cohort**.
   - Feature checklists with icons, hover elevation, and clear CTA links.
3. **Feature Deep Dives:**
   - Interactive feature matrices showcasing AI generation speed, proctoring safeguards, and real-time grading pipelines.

### 2.3 Pricing Page (`src/app/(public)/pricing/pricing-content.tsx`)
- Sleek monthly/annual billing switch.
- Compact pricing cards with distinct highlight for the popular plan.
- Clear feature comparison with green checkmarks and no dead space.

### 2.4 Support Page (`src/app/(public)/support/support-content.tsx`)
- Standardized `h-10` input fields, interactive time-slot chips, and multi-channel reach (Email, WhatsApp, Dedicated Support).

---

## 3. Performance & Ergonomic Guidelines
- **Mobile First:** Touch targets `h-10` minimum, responsive flex/grid wrappers, no horizontal scrolling.
- **Dark/Light Mode Fidelity:** Instant toggle button at navbar; every component renders with balanced contrast in both modes.
- **Fast First Paint:** Zero blocking animations, optimized dynamic imports where appropriate.

---

## 4. Dashboard Page Template Standards (MANDATORY FOR ALL DASHBOARDS)

Every dashboard overview and sub-page across all roles (`ADMIN`, `SUPER_ADMIN`, `TEACHER`, `STUDENT`) **MUST** strictly follow this unified layout template:

### 4.1 Component Wrapper Structure
```tsx
import { DashboardPage, DashboardHeader } from "@/components/layout/DashboardTemplate";

export default function MyDashboardPage() {
    return (
        <DashboardPage>
            <DashboardHeader
                title={<>Workspace <span className="text-primary font-black">Hub</span></>}
                subtitle="Manage institutional assessments, faculty resources, and performance analytics across your workspace."
                actions={
                    <Button size="sm" className="h-8.5 px-3.5 rounded-xl font-semibold text-xs">
                        Action
                    </Button>
                }
            />
            {/* Page content, metric cards, charts, and data tables */}
        </DashboardPage>
    );
}
```

### 4.2 Header Rules & Typography
1. **Title:**
   - **Strictly 1 Line**: Never wrap onto multiple lines (`leading-none`, `font-extrabold`).
   - **Length**: 2–3 words maximum (e.g., `Workspace Hub`, `Strategic Command`, `Instructor Hub`, `Student Portal`).
   - Highlight the secondary word using `<span className="text-primary font-black">`.
2. **Subtitle / Description:**
   - **Strictly 1 Line**: Never wrap onto multiple lines (`truncate` / `line-clamp-1`, `text-xs sm:text-[13px]`).
   - **Length**: 10–12 words maximum. Clear, informative summary of the page's purpose.
   - **No Overhead Badges**: Do not add awkward category pill badges above the title (e.g. no "Root System Overview", no "Institutional Dashboard", no "Instructor Portal"). Keep the header clean and uncluttered.
3. **Action Ribbon:**
   - Right-aligned buttons on `sm:items-center`.
   - Compact height: `h-8.5 rounded-xl text-xs font-semibold`.

### 4.3 Container Spacing & Sidebar Collapse Behavior
1. **Shell Padding:**
   - Topbar: `h-14` (56px) with `px-3.5 sm:px-6 lg:px-8`.
   - Main container (`DashboardShell`): `px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-6 pb-8`.
   - Balanced breathing room: Header sits 16–24px below the topbar border (never cramped against it and never vast empty dead space).
2. **Fluid Sidebar Collapse:**
   - Expanded: Sidebar `md:w-60`, Main content `md:pl-60`.
   - Collapsed: Sidebar `md:w-[70px]`, Main content `md:pl-[70px]`.
   - Transition: `transition-all duration-300 ease-in-out`.
   - Full Width: Content container is fluid (`w-full`), never constrained by artificial `max-w-7xl mx-auto` centering, ensuring left-alignment stays perfectly flush with topbar controls when collapsed.

