"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, Sparkles, ShieldCheck, CheckCircle2,
  ArrowRight, QrCode, Terminal, Check, Laptop, Clock,
  FileSpreadsheet, Lock, Bot, BarChart3, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProcessStep {
  step: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  previewType: "workspace" | "onboarding" | "authoring" | "analytics";
}

const defaultSteps: ProcessStep[] = [
  {
    step: "01",
    icon: <Building2 className="size-4" />,
    title: "Initialize Workspace",
    description: "Provision your branded institutional domain, configure proctoring policies, and establish faculty permissions.",
    tag: "Instant tenant setup",
    previewType: "workspace"
  },
  {
    step: "02",
    icon: <Users className="size-4" />,
    title: "Onboard Educators & Students",
    description: "Invite faculty leads with granular permissions and enroll student cohorts via secure links, dynamic QR codes, or CSV.",
    tag: "Role-based access",
    previewType: "onboarding"
  },
  {
    step: "03",
    icon: <Sparkles className="size-4" />,
    title: "Author with Gemini AI",
    description: "Generate syllabus-aligned question pools in seconds with custom difficulty levels, or upload existing question sets in bulk.",
    tag: "Multi-variant questions",
    previewType: "authoring"
  },
  {
    step: "04",
    icon: <ShieldCheck className="size-4" />,
    title: "Execute & Analyze",
    description: "Deliver timed exams with automated tamper monitoring, and access instantaneous cohort performance analytics and exportable grade books.",
    tag: "Live proctor logs",
    previewType: "analytics"
  }
];

export function InteractiveProcess() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Gentle auto-cycle every 7 seconds, pauses when user clicks a step
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % defaultSteps.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentStep = defaultSteps[activeStep];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Top Stepper Track for Desktop & Tablet */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
        {defaultSteps.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveStep(idx);
                setIsAutoPlaying(false);
              }}
              className={cn(
                "relative text-left p-3.5 sm:p-4 rounded-2xl transition-all duration-300 border text-xs sm:text-sm flex flex-col justify-between group min-w-0 w-full",
                isActive
                  ? "bg-card border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                  : "bg-card/60 hover:bg-card border-border/60 hover:border-border"
              )}
            >
              {/* Active top progress highlight bar */}
              {isActive && (
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={cn(
                      "size-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-black shadow-xs"
                        : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {step.step}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-muted/50 border-border/40 text-muted-foreground"
                    )}
                  >
                    {step.tag}
                  </span>
                </div>

                <h3
                  className={cn(
                    "font-bold text-xs sm:text-sm tracking-tight transition-colors mb-1",
                    isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                  )}
                >
                  {step.title}
                </h3>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-medium">
                  {isActive ? "Active phase" : "View preview"}
                </span>
                <ChevronRight
                  className={cn(
                    "size-3 transition-transform",
                    isActive ? "translate-x-0.5 text-primary" : "text-muted-foreground/60"
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage Console Preview */}
      <div className="rounded-2xl bg-card border border-border/70 shadow-lg overflow-hidden transition-all">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-rose-500/80" />
              <div className="size-2.5 rounded-full bg-amber-500/80" />
              <div className="size-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-3 w-px bg-border/60 mx-1" />
            <span className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
              <Terminal className="size-3.5 text-primary" />
              <span>pipeline_stage_{currentStep.step}.run</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Step {activeStep + 1} of 4:
            </span>
            <span className="text-xs font-semibold text-primary">
              {currentStep.title}
            </span>
          </div>
        </div>

        {/* Dynamic Console Body */}
        <div className="p-4 sm:p-6 lg:p-8 min-h-[300px] flex items-center justify-center bg-zinc-950/5 dark:bg-zinc-950/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-4xl"
            >
              {activeStep === 0 && <WorkspacePreview />}
              {activeStep === 1 && <OnboardingPreview />}
              {activeStep === 2 && <AuthoringPreview />}
              {activeStep === 3 && <AnalyticsPreview />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Console Footer */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-foreground">Zero infrastructure setup needed</span>
            <span className="hidden sm:inline">— ready in under 2 minutes.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveStep((prev) => (prev - 1 + defaultSteps.length) % defaultSteps.length);
                setIsAutoPlaying(false);
              }}
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setActiveStep((prev) => (prev + 1) % defaultSteps.length);
                setIsAutoPlaying(false);
              }}
              className="h-7 px-3 text-xs bg-primary text-primary-foreground font-semibold"
            >
              Next step
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-preview 1: Workspace Initialization
function WorkspacePreview() {
  return (
    <div className="grid md:grid-cols-12 gap-4 items-center">
      <div className="md:col-span-5 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
          <Building2 className="size-3" />
          <span>Tenant Configuration</span>
        </div>
        <h4 className="text-base sm:text-lg font-bold text-foreground">
          Dedicated Institutional Instance
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Provision an isolated environment complete with custom branding, seat governance, and domain routing within seconds.
        </p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Dedicated subdomain routing (e.g. acme.abcdexamhub.com)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Custom institutional watermark and brand colors</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Granular role permission matrices (Admin, Faculty, Student)</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-7 bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3 text-xs font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <span className="font-semibold text-foreground">Workspace Settings</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
            Status: Active
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-1.5 py-1 px-2.5 rounded-lg bg-muted/50">
            <span className="text-muted-foreground shrink-0">Domain:</span>
            <span className="font-mono text-primary font-semibold text-xs break-all">apex-academy.abcdexamhub.com</span>
          </div>
          <div className="flex justify-between items-center py-1 px-2.5 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Proctoring Mode:</span>
            <span className="font-semibold text-foreground">Strict Window Blur & Tab Limits</span>
          </div>
          <div className="flex justify-between items-center py-1 px-2.5 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Active Seat Capacity:</span>
            <span className="font-semibold text-foreground">2,500 Registered Candidates</span>
          </div>
          <div className="flex justify-between items-center py-1 px-2.5 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">AI Generation Engine:</span>
            <span className="font-semibold text-primary">Gemini 1.5 Flash Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-preview 2: Onboarding
function OnboardingPreview() {
  return (
    <div className="grid md:grid-cols-12 gap-4 items-center">
      <div className="md:col-span-5 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
          <Users className="size-3" />
          <span>Frictionless Cohorts</span>
        </div>
        <h4 className="text-base sm:text-lg font-bold text-foreground">
          Single-Click Cohort Enrollment
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enroll hundreds of students instantly using dynamic QR codes, secure single-use invitation links, or direct CSV roster imports.
        </p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Classroom QR codes for immediate exam-hall check-in</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Bulk CSV import supporting thousands of candidates</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Zero app download required — 100% web responsive</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-7 bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
          <span className="font-semibold text-foreground">Recent Cohorts & Faculty</span>
          <span className="text-[10px] text-muted-foreground">420 Active Students</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-md bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px]">
                CS
              </div>
              <div>
                <div className="font-semibold text-foreground">Computer Science — Batch 2026</div>
                <div className="text-[10px] text-muted-foreground">Lead: Prof. Sarah Jenkins</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              120 Enrolled
            </span>
          </div>

          <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-md bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px]">
                EE
              </div>
              <div>
                <div className="font-semibold text-foreground">Electrical Circuits — Term II</div>
                <div className="text-[10px] text-muted-foreground">Lead: Dr. Robert Vance</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
              95 Enrolled
            </span>
          </div>

          <div className="p-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-primary">Classroom QR Code generated for upcoming exam</span>
            <QrCode className="size-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-preview 3: Authoring with Gemini AI
function AuthoringPreview() {
  return (
    <div className="grid md:grid-cols-12 gap-4 items-center">
      <div className="md:col-span-5 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
          <Sparkles className="size-3" />
          <span>Gemini AI Studio</span>
        </div>
        <h4 className="text-base sm:text-lg font-bold text-foreground">
          Intelligent Question Generation
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Input your course syllabus, topic, or learning objectives. Google Gemini formats high-caliber multiple choice and conceptual questions with rationales.
        </p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Configurable Bloom's taxonomy & difficulty curves</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Automatic distractor verification & answer explanations</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>One-click export into institutional question banks</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-7 bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3 text-xs">
        <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-100 dark:bg-zinc-950 font-mono text-[11px] flex items-center justify-between border border-white/10">
          <span>prompt: "Generate 15 Graph Algorithms MCQs • Level: Hard"</span>
          <span className="text-primary font-bold">2.4s</span>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Sample Generated Item (Q4)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
              Difficulty: Advanced
            </span>
          </div>
          <p className="text-foreground text-[11px]">
            What is the time complexity of Dijkstra's algorithm implemented with a Fibonacci heap on a graph with V vertices and E edges?
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[10px]">
            <div className="p-1.5 rounded bg-card border border-border/60 text-muted-foreground">A) O(V^2)</div>
            <div className="p-1.5 rounded bg-primary/15 border border-primary/30 text-primary font-bold">B) O(E + V log V) ✓</div>
            <div className="p-1.5 rounded bg-card border border-border/60 text-muted-foreground">C) O(E log V)</div>
            <div className="p-1.5 rounded bg-card border border-border/60 text-muted-foreground">D) O(V log E)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-preview 4: Execute & Analyze
function AnalyticsPreview() {
  return (
    <div className="grid md:grid-cols-12 gap-4 items-center">
      <div className="md:col-span-5 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
          <ShieldCheck className="size-3" />
          <span>Integrity & Analytics</span>
        </div>
        <h4 className="text-base sm:text-lg font-bold text-foreground">
          Anti-Cheat Monitoring & Telemetry
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Monitor candidates in real time with automated blur triggers and tab logs, followed by instant cohort grade curve analytics.
        </p>
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Automated tab-switch counters and blur audit timestamps</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>Instantaneous cohort median, percentile, and bell curve stats</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            <span>One-click export to official CSV/Excel grade sheets</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-7 bg-card border border-border/70 rounded-xl p-4 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <span className="font-semibold text-foreground">Mid-Term Examination Telemetry</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
            Integrity Score: 99.8%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-base font-bold text-primary">148</div>
            <div className="text-[10px] text-muted-foreground">Submitted</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-base font-bold text-foreground">84.2%</div>
            <div className="text-[10px] text-muted-foreground">Class Average</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">0</div>
            <div className="text-[10px] text-muted-foreground">Flags Raised</div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <span className="text-[11px] font-medium text-foreground">Grade curve computed & item difficulty calibrated</span>
          </div>
          <span className="font-semibold text-primary text-[10px]">Ready to Export</span>
        </div>
      </div>
    </div>
  );
}
