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
