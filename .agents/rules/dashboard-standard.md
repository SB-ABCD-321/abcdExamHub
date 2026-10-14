# Dashboard Page Standards (Mandatory)

All dashboard overview and child pages (`/admin/*`, `/super-admin/*`, `/teacher/*`, `/student/*`) must adhere to this exact layout and design specification.

## 1. Page & Header Components
Always import from `@/components/layout/DashboardTemplate`:
```tsx
import { DashboardPage, DashboardHeader } from "@/components/layout/DashboardTemplate";
```

## 2. Header Content Rules
- **Title**: Strictly 1 line, **2–3 words** (e.g. `Workspace Hub`, `Strategic Command`, `Instructor Hub`, `Student Portal`). Style with `<>Primary <span className="text-primary font-black">Secondary</span></>`.
- **Subtitle / Description**: Strictly 1 line, **10–12 words**. Clear, concise summary.
- **No Badges**: Do not put badges or category pills above the title.
- **Actions**: Compact action buttons on the right (`h-8.5 px-3.5 rounded-xl font-semibold text-xs`).

## 3. Shell Spacing & Sidebar Collapse
- **Topbar**: Fixed height `h-14` (56px) with horizontal padding `px-3.5 sm:px-6 lg:px-8`.
- **Main Shell**: Padding `px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-6 pb-8`.
- **Sidebar Collapse**:
  - Expanded: `md:w-60` / `md:pl-60`
  - Collapsed: `md:w-[70px]` / `md:pl-[70px]`
  - Content fluidly stretches full-width (`w-full`) to maintain clean left-edge alignment with the topbar toggle.
