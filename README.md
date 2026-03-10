# ABCD Exam Hub Documentation

Welcome to the ABCD Exam Hub repository. This is a Next.js (App Router) based SaaS platform for conducting examinations, mock tests, and managing institute workspaces.

## Tech Stack Overview
- **Framework**: Next.js 16 with React 19 (App Router)
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Prisma (v7 config format)
- **Authentication**: Clerk (OAuth & Email) with Webhooks
- **UI & Styling**: TailwindCSS + shadcn/ui components (Light/Dark mode supported)
- **AI Integration**: Google Gemini SDK for intelligent mock test recommendations

## Platform Roles
The platform utilizes Clerk coupled with a Prisma generic User model to handle role-based routing and permissions:
1. **SUPER_ADMIN**: Global system controller. Manages site branding (`SiteSettings`) and broadcast notices. Can promote users to Admins.
2. **ADMIN**: An Institute Workspace owner. Has a customized dashboard to declare public profile settings, appoint teachers, and track high-level analytics.
3. **TEACHER**: Staff appointed by an Admin to a workspace. Can create Topics, draft MCQs into the Question Bank (local or public), and schedule/compile Exams.
4. **STUDENT**: The default role. Students can take public mock tests. Their dashboard features AI driven exam recommendations based on their historical topic affinities.

## Setup & Local Development
1. Clone the repository and `npm install`
2. Configure `.env` with keys:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
WEBHOOK_SECRET=... // From Clerk dashboard

DATABASE_URL=...

CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

GEMINI_API_KEY=...
```
3. Sync database schema: `npx prisma db push`
4. Generate client: `npx prisma generate`
5. Run development server: `npm run dev`

## File Structure & Routing Guide
- `/src/lib/` - Houses the instantiated singletons (`prisma.ts`, `ai.ts`).
- `/src/components/ui` - Shadcn UI functional components.
- `/src/components/layout` - Core application shells (`Sidebar.tsx`, `Topbar.tsx`, etc.).
- `/src/app/(dashboard)` - The protected routes matrix (Admin, Teacher, Student, SuperAdmin specific folders).
- `/src/app/api/webhooks/clerk` - Essential synchronization tunnel translating Clerk user changes to the Postgres Database.

## Future Upgrades
- **Cloudinary Hookup**: The database schema fields (`logoUrl`, `imageUrl`) are prepared. For image uploads directly from Next.js, integrating `next-cloudinary` for dropzones in the Question creation and Settings pages is recommended.
- **Payment Gateways**: Currently, workspace provisioning is manual via the Super Admin. Stripe or Razorpay can be wired to automate Admin upgrades.
