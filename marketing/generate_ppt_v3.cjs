// ╔══════════════════════════════════════════════════════════════════╗
// ║  ABCD Exam Hub  ·  Workspace Admin Pitch  ·  v3 Ultimate         ║
// ║  Run:  node generate_ppt_v3.cjs                                  ║
// ╚══════════════════════════════════════════════════════════════════╝

const pptx = require("pptxgenjs");
const prs  = new pptx();

prs.layout  = "LAYOUT_WIDE";
prs.author  = "ABCD Exam Hub";
prs.title   = "ABCD Exam Hub – Workspace Admin Pitch v3";
prs.subject = "CBT Exam & Results Management Platform";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0:      "04091A",   // deepest navy
  bg1:      "0B1225",   // card dark
  bg2:      "0F1A30",   // card mid
  bg3:      "142040",   // card light
  accent:   "6366F1",   // indigo-500
  accentL:  "818CF8",   // indigo-400
  purple:   "A855F7",   // purple-500
  purpleL:  "C084FC",   // purple-400
  cyan:     "06B6D4",   // cyan-500
  cyanL:    "22D3EE",   // cyan-400
  emerald:  "10B981",   // emerald-500
  emeraldL: "34D399",   // emerald-400
  amber:    "F59E0B",   // amber-500
  amberL:   "FBBF24",   // amber-400
  rose:     "F43F5E",   // rose-500
  roseL:    "FB7185",   // rose-400
  gold:     "EAB308",   // gold
  white:    "FFFFFF",
  gray:     "94A3B8",
  grayL:    "CBD5E1",
  border:   "1E3A5F",
  borderL:  "2D4A6F",
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function bg(sl, angle=145) {
  sl.addShape(prs.ShapeType.rect, {
    x:0,y:0,w:"100%",h:"100%",
    fill:{ type:"gradient", gradType:"linear", angle,
           stops:[{position:0,color:T.bg0},{position:60,color:"080E1E"},{position:100,color:"050B18"}] },
    line:{type:"none"},
  });
}

function orb(sl, x, y, r, color, alpha=12) {
  for(let i=4;i>=1;i--){
    sl.addShape(prs.ShapeType.ellipse,{
      x: x-r*i*0.3, y: y-r*i*0.3, w: r+r*i*0.6, h: r+r*i*0.6,
      fill:{color, alpha: Math.round(alpha * (5-i)/4)}, line:{type:"none"},
    });
  }
  sl.addShape(prs.ShapeType.ellipse,{x,y,w:r,h:r,fill:{color,alpha},line:{type:"none"}});
}

function glass(sl, x, y, w, h, accent=T.border, opts={}) {
  sl.addShape(prs.ShapeType.roundRect,{
    x,y,w,h, rectRadius:opts.radius||0.14,
    fill:{color:T.bg1, alpha: opts.alpha||75},
    line:{color: accent, pt: opts.pt||1.2},
  });
}

function glassDark(sl, x, y, w, h, accent=T.border, opts={}) {
  sl.addShape(prs.ShapeType.roundRect,{
    x,y,w,h, rectRadius:opts.radius||0.12,
    fill:{color:T.bg0, alpha: opts.alpha||85},
    line:{color: accent, pt: opts.pt||1},
  });
}

function pill(sl, txt, x, y, color=T.accent, w=2.8) {
  sl.addShape(prs.ShapeType.roundRect,{
    x,y,w,h:0.36,rectRadius:0.07,
    fill:{color,alpha:22}, line:{color,pt:1.2},
  });
  sl.addText(txt,{x,y,w,h:0.36, align:"center",valign:"middle",
    fontSize:9.5,bold:true,color,fontFace:"Segoe UI"});
}

function heading(sl, h1, h2, badgeTxt, badgeColor=T.accent) {
  pill(sl, badgeTxt, 0.45, 0.28, badgeColor, 3.2);
  sl.addText(h1,{x:0.45,y:0.74,w:12.5,h:0.82,
    fontSize:36,bold:true,color:T.white,fontFace:"Segoe UI"});
  if(h2) sl.addText(h2,{x:0.45,y:1.6,w:12,h:0.48,
    fontSize:13.5,color:T.gray,fontFace:"Segoe UI Light",italic:true});
}

function neonLine(sl, x, y, w, color=T.accent, h=0.028) {
  sl.addShape(prs.ShapeType.rect,{x,y,w,h,fill:{color},line:{type:"none"}});
}

function checkItem(sl, txt, x, y, color=T.emeraldL, w=5.5) {
  sl.addShape(prs.ShapeType.ellipse,{x,y:y+0.08,w:0.2,h:0.2,fill:{color},line:{type:"none"}});
  sl.addText("✓",{x,y:y+0.05,w:0.22,h:0.25,align:"center",valign:"middle",
    fontSize:9,bold:true,color:T.bg0,fontFace:"Segoe UI"});
  sl.addText(txt,{x:x+0.28,y,w:w-0.28,h:0.38,valign:"middle",
    fontSize:11,color:T.white,fontFace:"Segoe UI"});
}

function dotItem(sl, txt, x, y, color=T.accent, w=5.5) {
  sl.addShape(prs.ShapeType.ellipse,{x:x+0.02,y:y+0.12,w:0.12,h:0.12,fill:{color},line:{type:"none"}});
  sl.addText(txt,{x:x+0.22,y,w:w-0.22,h:0.38,valign:"middle",
    fontSize:11,color:T.white,fontFace:"Segoe UI"});
}

function starRating(sl, x, y, count=5) {
  for(let i=0;i<count;i++){
    sl.addText("★",{x:x+i*0.28,y,w:0.28,h:0.35,align:"center",
      fontSize:14,color:T.gold,fontFace:"Segoe UI"});
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 1 · COVER
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 135);

  // Background orbs
  orb(sl, 9.8,  -1.0, 6.5, T.purple, 16);
  orb(sl, -1.8,  4.5, 4.5, T.cyan,   12);
  orb(sl, 12.0,  5.8, 3.5, T.accent, 12);

  // Grid lines (decorative)
  for(let i=0;i<15;i++){
    sl.addShape(prs.ShapeType.rect,{x:i*1.0,y:0,w:0.005,h:"100%",
      fill:{color:T.white,alpha:2.5},line:{type:"none"}});
  }
  for(let j=0;j<10;j++){
    sl.addShape(prs.ShapeType.rect,{x:0,y:j*0.8,w:"100%",h:0.005,
      fill:{color:T.white,alpha:2.5},line:{type:"none"}});
  }

  // Tag line
  pill(sl,"✦  WORKSPACE ADMIN PITCH  ·  v3.0",0.5,0.75,T.cyanL,4.0);

  // Main title
  sl.addText("ABCD",{x:0.5,y:1.28,w:13,h:1.35,
    fontSize:76,bold:true,color:T.white,fontFace:"Segoe UI"});
  sl.addText("Exam Hub",{x:0.5,y:2.55,w:13,h:1.2,
    fontSize:62,bold:true,fontFace:"Segoe UI",color:T.cyanL});

  neonLine(sl, 0.5, 3.9, 7.5, T.accentL);

  sl.addText("India's Smartest CBT Platform for Institutes & Coaching Centres",{x:0.5,y:4.05,w:11,h:0.7,
    fontSize:16.5,color:T.gray,fontFace:"Segoe UI Light",italic:true});

  // Stats strip (6 cards)
  const stats = [
    {v:"AI-Powered",  l:"MCQ Generator"},
    {v:"Anti-Cheat",  l:"Tab Guard + Draft"},
    {v:"3 Modes",     l:"Result Publish"},
    {v:"Real-Time",   l:"Analytics"},
    {v:"Secure",      l:"Agreement Flow"},
    {v:"Multi-Tenant",l:"Architecture"},
  ];
  stats.forEach((s,i)=>{
    const x = 0.4 + i*2.18;
    glass(sl, x, 5.0, 2.05, 1.3, T.accentL, {alpha:55});
    sl.addText(s.v,{x,y:5.1,w:2.05,h:0.5, align:"center",
      fontSize:12.5,bold:true,color:T.accentL,fontFace:"Segoe UI"});
    sl.addText(s.l,{x,y:5.6,w:2.05,h:0.35, align:"center",
      fontSize:9.5,color:T.gray,fontFace:"Segoe UI"});
  });

  sl.addText("April 2026  ·  Confidential  ·  For Authorized Recipients Only",{x:0.5,y:6.95,w:12.5,h:0.38,
    align:"center",fontSize:9.5,color:T.gray,fontFace:"Segoe UI"});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 2 · THE PROBLEM WE SOLVE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 160);
  orb(sl, 11.5, 1.0, 5.0, T.rose, 10);

  heading(sl,
    "The Problem Every Institute Faces",
    "Running exams today is fragmented, expensive, and error-prone.",
    "✦  THE PROBLEM", T.roseL
  );

  const problems = [
    { icon:"📄", t:"Paper Exams are Slow", b:"Printing, distribution, manual checking — wasted hours for every exam cycle." },
    { icon:"🔧", t:"Complex Tools, Poor UX", b:"Enterprise platforms are overly complex; teachers waste time on setup instead of teaching." },
    { icon:"💸", t:"High Per-Student Cost", b:"Legacy LMS systems charge per student seat — pricing that doesn't scale for growing institutes." },
    { icon:"📊", t:"No Real Analytics", b:"No way to track student-wise performance, topic-wise weak spots, or cohort pass rates automatically." },
    { icon:"😤", t:"Manual Result Processing", b:"Manually calculating marks, generating score sheets, and sending results takes days." },
    { icon:"🔓", t:"Zero Exam Integrity", b:"No tab monitoring, no time locks, no draft saving — students can easily cheat or lose work." },
  ];

  problems.forEach((p,i)=>{
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 4.35;
    const y = 2.1 + row * 1.78;
    glass(sl, x, y, 4.1, 1.63, T.roseL, {alpha:55, pt:1});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.15,y:y+0.14,w:0.68,h:0.68,rectRadius:0.08,
      fill:{color:T.rose,alpha:18},line:{color:T.roseL,pt:1}});
    sl.addText(p.icon,{x:x+0.15,y:y+0.1,w:0.68,h:0.72,align:"center",fontSize:20});
    sl.addText(p.t,{x:x+0.95,y:y+0.14,w:3.0,h:0.44,
      fontSize:12.5,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(p.b,{x:x+0.15,y:y+0.66,w:3.8,h:0.85,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.3});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 3 · ABCD EXAM HUB SOLUTION (PLATFORM OVERVIEW)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 150);
  orb(sl, 11.0, 1.5, 4.5, T.purple, 10);

  heading(sl,
    "One Platform. Every Role. Full Control.",
    "Designed for institutes from 50 to 50,000 students.",
    "✦  OUR SOLUTION", T.purpleL
  );

  const roles = [
    { icon:"🏛️", name:"Super Admin",  color:T.accent,   desc:"Platform owner. Manages all workspaces, subscriptions, billing, and global settings." },
    { icon:"🏢", name:"Workspace Admin", color:T.purpleL, desc:"Institute owner. Full control over teachers, exams, students, results & analytics." },
    { icon:"👩‍🏫", name:"Teacher",     color:T.emeraldL, desc:"Creates topics, uploads questions (bulk AI), builds exams, and manages results." },
    { icon:"🎓", name:"Student",      color:T.amberL,   desc:"Takes CBT exams, tracks results, gets AI-recommended next exams." },
  ];

  roles.forEach((r, i) => {
    const x = 0.38 + i * 3.25;
    glass(sl, x, 2.1, 3.1, 4.7, r.color, {alpha:65});
    orb(sl, x+1.3, 2.55, 1.2, r.color, 20);
    sl.addText(r.icon,{x,y:2.3,w:3.1,h:1.0, align:"center",fontSize:28});
    neonLine(sl, x+0.35, 3.45, 2.4, r.color);
    sl.addText(r.name,{x,y:3.58,w:3.1,h:0.55,
      align:"center",fontSize:16,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(r.desc,{x:x+0.18,y:4.2,w:2.75,h:1.7,
      align:"center",fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.4});
  });

  // Architecture note
  glass(sl, 0.4, 7.0, 12.55, 0.52, T.border, {alpha:55, pt:0.8});
  sl.addText("🏗  Multi-Tenant Architecture  ·  Each workspace is fully isolated  ·  Role-based access via Clerk OAuth  ·  Single codebase, unlimited institutes",{
    x:0.6,y:7.0,w:12.2,h:0.52, align:"center",valign:"middle",
    fontSize:9.5,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 4 · EXAM BUILDER (FEATURE DEEP DIVE)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 140);
  orb(sl, 12.5, 4.0, 5.0, T.cyan, 10);

  heading(sl,
    "Exam Builder — Full Lifecycle Control",
    "Design, schedule, secure, and control every aspect of your CBT exams.",
    "✦  EXAM MANAGEMENT", T.cyanL
  );

  const props = [
    { icon:"📝", label:"Rich Exam Setup",        sub:"Set exam name, description, logo & contact info on every exam." },
    { icon:"⏱️", label:"Timed Sessions",         sub:"Set exact duration in minutes. Students see a live countdown." },
    { icon:"📅", label:"Scheduled Windows",       sub:"Define startTime & endTime — exams lock automatically outside windows." },
    { icon:"🔐", label:"Password Protection",     sub:"Restrict access to invited-only sessions with a secret password." },
    { icon:"🌐", label:"Public / Private Toggle", sub:"Public for all students or restricted to your workspace only." },
    { icon:"⚡", label:"Live Status Control",     sub:"Instantly switch between ACTIVE, PAUSED, or INACTIVE states." },
    { icon:"➕", label:"Custom Marks Per Q",      sub:"Configure marks per question for fully weighted scoring." },
    { icon:"➖", label:"Negative Marking",        sub:"Enable negative marks with a configurable deduction value." },
    { icon:"📋", label:"Question Compiler",       sub:"Pick questions by topic from your bank — drag, filter, publish." },
  ];

  props.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 4.35;
    const y = 2.1 + row * 1.68;
    glass(sl, x, y, 4.1, 1.55, T.cyanL, {alpha:55, pt:1});
    sl.addText(p.icon + "  " + p.label,{x:x+0.2,y:y+0.12,w:3.7,h:0.48,
      fontSize:12.5,bold:true,color:T.white,fontFace:"Segoe UI"});
    neonLine(sl, x+0.2, y+0.64, 3.7, T.cyan, 0.018);
    sl.addText(p.sub,{x:x+0.2,y:y+0.7,w:3.7,h:0.75,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.3});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 5 · QUESTION BANK + AI MCQ
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 155);
  orb(sl, 0.5, 5.5, 4.0, T.purple, 10);
  orb(sl, 12.0, 1.0, 3.5, T.accent, 10);

  heading(sl,
    "Question Bank + AI Bulk MCQ Generator",
    "Build your MCQ library once, reuse forever. Let Gemini AI do the heavy lifting.",
    "✦  QUESTION BANK", T.purpleL
  );

  // Left panel — Bank features
  glass(sl, 0.4, 2.1, 5.9, 5.0, T.purple, {alpha:62});
  sl.addText("📚  Question Bank",{x:0.62,y:2.22,w:5.5,h:0.5,
    fontSize:15,bold:true,color:T.purpleL,fontFace:"Segoe UI"});
  neonLine(sl,0.62,2.8,5.5,T.purple);

  const bankFeats = [
    "MCQ format: text, 4 options, 1 correct answer",
    "Attach images to questions (image URL support)",
    "Organise by Topics — workspace-local or global",
    "Mark questions as Public (shared) or Private",
    "Filter questions by topic when compiling exams",
    "Bulk question import via AI in one click",
    "Workspace question + topic limits enforced",
    "Per-question marks and difficulty tagging",
  ];
  bankFeats.forEach((f,i) => {
    dotItem(sl, f, 0.65, 3.04+i*0.5, T.purpleL, 5.4);
  });

  // Right panel — AI generation
  glass(sl, 6.6, 2.1, 6.7, 5.0, T.accent, {alpha:62});
  sl.addText("🤖  AI Bulk MCQ Generator",{x:6.82,y:2.22,w:6.2,h:0.5,
    fontSize:15,bold:true,color:T.accentL,fontFace:"Segoe UI"});
  neonLine(sl,6.82,2.8,6.2,T.accent);

  const aiSteps = [
    { step:"01", t:"Choose Topic",     b:"Pick any existing topic from your question bank." },
    { step:"02", t:"Enter Prompt",     b:"Type subject matter, difficulty level, or specific instructions." },
    { step:"03", t:"Gemini Generates", b:"Google Gemini AI creates N fully structured MCQs instantly." },
    { step:"04", t:"Review & Save",    b:"Edit, discard, or approve — questions land directly in your bank." },
    { step:"05", t:"Compile to Exam",  b:"Select generated questions and publish your exam immediately." },
  ];
  aiSteps.forEach((a,i) => {
    const y = 3.08 + i * 0.78;
    sl.addShape(prs.ShapeType.roundRect,{x:6.75,y,w:0.58,h:0.5,rectRadius:0.07,
      fill:{color:T.accent,alpha:22},line:{color:T.accentL,pt:1.2}});
    sl.addText(a.step,{x:6.75,y,w:0.58,h:0.5,
      align:"center",valign:"middle",fontSize:10.5,bold:true,color:T.accentL,fontFace:"Segoe UI"});
    sl.addText(a.t,{x:7.45,y:y+0.02,w:5.65,h:0.26,
      fontSize:12.5,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(a.b,{x:7.45,y:y+0.28,w:5.65,h:0.35,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI"});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 6 · EXAM INTEGRITY & SECURITY
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 145);
  orb(sl, 12.5, 2.0, 4.5, T.rose, 10);

  heading(sl,
    "Exam Integrity & Security Controls",
    "Every safeguard you need to run fair, tamper-resistant online exams.",
    "✦  SECURITY", T.roseL
  );

  const controls = [
    { icon:"🔑", color:T.roseL,   t:"Password-Gated Access",     b:"Exams require a secret password before students can start — perfect for private mock tests and paid batches." },
    { icon:"⏰", color:T.amberL,  t:"Time-Windowed Scheduling",   b:"Set startTime & endTime. Platform auto-locks the exam outside the scheduled window — zero manual effort." },
    { icon:"⏸️", color:T.accentL, t:"Pause / Deactivate Instantly",b:"Switch any exam to PAUSED or INACTIVE in one click. Students in-session are gracefully halted." },
    { icon:"🚩", color:T.purpleL, t:"Flagged Question Tracking",  b:"Students flag uncertain questions during exam. Flags are preserved across reconnects and draft saves." },
    { icon:"💾", color:T.cyanL,   t:"Auto-Save Exam Draft",       b:"Answers + time remaining + question index saved continuously. Students reconnect without losing progress." },
    { icon:"📵", color:T.emeraldL,t:"Tab-Switch Detection",        b:"Every tab switch counted and stored. Admins can see suspicious behaviour in the result detail view." },
  ];

  controls.forEach((c,i) => {
    const col = i % 2;
    const row = Math.floor(i/2);
    const x = 0.4 + col * 6.65;
    const y = 2.05 + row * 1.72;
    glass(sl, x, y, 6.35, 1.58, c.color, {alpha:55, pt:1.2});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.18,y:y+0.16,w:0.72,h:0.72,rectRadius:0.09,
      fill:{color:c.color,alpha:18},line:{color:c.color,pt:1.2}});
    sl.addText(c.icon,{x:x+0.18,y:y+0.12,w:0.72,h:0.78, align:"center",fontSize:20});
    sl.addText(c.t,{x:x+1.07,y:y+0.14,w:5.1,h:0.44,
      fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(c.b,{x:x+1.07,y:y+0.6,w:5.1,h:0.85,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.25});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 7 · LIVE EXAM EXPERIENCE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 150);
  orb(sl, 1.0, 2.5, 4.0, T.emerald, 10);

  heading(sl,
    "Live Exam Experience (Student View)",
    "A distraction-free, intuitive test interface that feels premium on any device.",
    "✦  STUDENT EXPERIENCE", T.emeraldL
  );

  // Mock browser frame
  glass(sl, 0.4, 2.1, 12.55, 5.0, T.emeraldL, {alpha:55, pt:1.5});

  // Browser chrome
  sl.addShape(prs.ShapeType.roundRect,{x:0.4,y:2.1,w:12.55,h:0.5,rectRadius:0.0,
    fill:{color:T.bg0,alpha:90},line:{type:"none"}});
  ["E14D4D","F5A523","2BCC71"].forEach((c,i)=>{
    sl.addShape(prs.ShapeType.ellipse,{x:0.65+i*0.32,y:2.22,w:0.18,h:0.18,
      fill:{color:c},line:{type:"none"}});
  });
  sl.addShape(prs.ShapeType.roundRect,{x:1.8,y:2.19,w:6.5,h:0.24,rectRadius:0.04,
    fill:{color:T.border},line:{type:"none"}});
  sl.addText("abcdexamhub.app/exam/phy-chapter1",{x:1.85,y:2.2,w:6.5,h:0.22,
    valign:"middle",fontSize:8,color:T.gray,fontFace:"Segoe UI"});

  // Timer bar
  sl.addShape(prs.ShapeType.rect,{x:0.5,y:2.7,w:12.4,h:0.045,
    fill:{color:T.emerald,alpha:15},line:{type:"none"}});
  sl.addShape(prs.ShapeType.rect,{x:0.5,y:2.7,w:8.0,h:0.045,
    fill:{color:T.emerald},line:{type:"none"}});
  sl.addText("⏱ 38:21 remaining",{x:0.55,y:2.77,w:5,h:0.38,
    fontSize:11,color:T.emeraldL,fontFace:"Segoe UI",bold:true});
  sl.addText("Q 14 / 40  ·  🚩 Flag Question",{x:8.0,y:2.77,w:4.8,h:0.38,
    align:"right",fontSize:11,color:T.gray,fontFace:"Segoe UI"});

  // Question
  sl.addText("Q14.  The acceleration due to gravity at the surface of the Earth is approximately:",{
    x:0.55,y:3.22,w:11.9,h:0.55,
    fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});

  const opts = ["A.  8.2 m/s²","B.  9.8 m/s²  ✓","C.  10.5 m/s²","D.  11.0 m/s²"];
  opts.forEach((o,i) => {
    const isSelected = i===1;
    const oy = 3.9+i*0.47;
    sl.addShape(prs.ShapeType.roundRect,{x:0.55,y:oy,w:11.9,h:0.42,rectRadius:0.06,
      fill:{color: isSelected ? T.emerald : T.bg2, alpha: isSelected?22:75},
      line:{color: isSelected ? T.emeraldL : T.border, pt: isSelected?1.8:1}});
    sl.addText(o,{x:0.75,y:oy,w:11.7,h:0.42,valign:"middle",
      fontSize:12.5,color: isSelected?T.emeraldL:T.grayL,fontFace:"Segoe UI",bold:isSelected});
  });

  // Nav buttons
  sl.addShape(prs.ShapeType.roundRect,{x:0.55,y:6.22,w:2.1,h:0.44,rectRadius:0.07,
    fill:{color:T.bg2},line:{color:T.border,pt:1}});
  sl.addText("← Prev",{x:0.55,y:6.22,w:2.1,h:0.44,align:"center",valign:"middle",
    fontSize:11,color:T.gray,fontFace:"Segoe UI"});
  sl.addShape(prs.ShapeType.roundRect,{x:10.8,y:6.22,w:2.1,h:0.44,rectRadius:0.07,
    fill:{color:T.accent},line:{type:"none"}});
  sl.addText("Next →",{x:10.8,y:6.22,w:2.1,h:0.44,align:"center",valign:"middle",
    fontSize:11,bold:true,color:T.white,fontFace:"Segoe UI"});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 8 · RESULT ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 145);
  orb(sl, 11.0, 5.0, 5.0, T.amber, 10);

  heading(sl,
    "Result Engine — Three Publish Modes",
    "Flexible result visibility. Full transparency. Admin-controlled always.",
    "✦  RESULT SYSTEM", T.amberL
  );

  const modes = [
    {icon:"⚡",name:"INSTANT",     color:T.emeraldL,
     desc:"Results revealed the moment the student submits. Ideal for practice tests and mock exams where immediate feedback boosts retention."},
    {icon:"🏁",name:"EXAM END",    color:T.amberL,
     desc:"All results unlock together when the exam window closes. Perfect for competitive tests — no early reveals, complete fairness."},
    {icon:"📆",name:"CUSTOM DATE", color:T.accentL,
     desc:"Admin sets a specific date & time for results to go live. Great for board exams, semester tests, or exams with manual review."},
  ];

  modes.forEach((m,i) => {
    const x = 0.4 + i*4.35;
    glass(sl, x, 2.0, 4.1, 3.0, m.color, {alpha:62, pt:1.5});
    orb(sl, x+0.6, 2.55, 1.0, m.color, 15);
    sl.addText(m.icon,{x,y:2.1,w:1.3,h:1.2, align:"center",valign:"middle",fontSize:28});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.3,y:2.12,w:1.9,h:0.36,rectRadius:0.07,
      fill:{color:m.color,alpha:22},line:{color:m.color,pt:1.2}});
    sl.addText(m.name,{x:x+0.3,y:2.12,w:1.9,h:0.36,
      align:"center",valign:"middle",fontSize:10.5,bold:true,color:m.color,fontFace:"Segoe UI"});
    sl.addText(m.desc,{x:x+0.2,y:2.62,w:3.72,h:2.15,
      fontSize:11,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.4});
  });

  // What every result includes
  sl.addText("What Every Result Report Includes",{x:0.45,y:5.2,w:12,h:0.46,
    fontSize:15,bold:true,color:T.white,fontFace:"Segoe UI"});
  neonLine(sl, 0.45, 5.7, 12.45, T.amber);

  const resultItems = [
    "📊 Total Score & Percentage",
    "✅ Pass / Fail Status",
    "⏱  Time Taken",
    "📋 Per-Question Answer Log",
    "✔  Correct vs Wrong Breakdown",
    "📵 Tab Switch Count",
  ];
  resultItems.forEach((r,i) => {
    const x = 0.45 + (i%3)*4.35;
    const y = i<3 ? 5.82 : 6.4;
    glass(sl, x, y, 4.1, 0.5, T.amberL, {alpha:42, pt:0.8});
    sl.addText(r,{x:x+0.2,y,w:3.8,h:0.5, valign:"middle",
      fontSize:11.5,color:T.white,fontFace:"Segoe UI"});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 9 · DETAILED RESULT VIEW
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 140);
  orb(sl, 1.0, 1.5, 3.5, T.accent, 10);

  heading(sl,
    "Detailed Result Analysis",
    "Students and admins see exactly what happened on every question — with full breakdown.",
    "✦  RESULT DEEP DIVE", T.accentL
  );

  // Mock result card
  glass(sl, 0.4, 2.0, 5.3, 5.2, T.accent, {alpha:62});
  sl.addText("🎯 Your Result",{x:0.62,y:2.1,w:4.9,h:0.5,
    fontSize:15,bold:true,color:T.accentL,fontFace:"Segoe UI"});
  neonLine(sl,0.62,2.66,4.9,T.accent);

  const resultData = [
    ["Score",        "34 / 40",      T.emeraldL],
    ["Percentage",   "85.0 %",       T.emeraldL],
    ["Status",       "✅  PASS",     T.emeraldL],
    ["Time Taken",   "42 min 18 sec",T.grayL],
    ["Correct",      "34 questions", T.grayL],
    ["Wrong",        "4 questions",  T.roseL],
    ["Skipped",      "2 questions",  T.amberL],
    ["Tab Switches", "1 detected",   T.amberL],
    ["Rank",         "#3 of 48",     T.cyanL],
  ];
  resultData.forEach(([k,v,c],i) => {
    const y = 2.8 + i * 0.48;
    sl.addText(k,{x:0.65,y,w:2.6,h:0.42, fontSize:11.5,color:T.gray,fontFace:"Segoe UI"});
    sl.addText(v,{x:3.1,y,w:2.4,h:0.42,  fontSize:11.5,bold:true,color:c,fontFace:"Segoe UI"});
  });

  // Per-question log
  glass(sl, 5.95, 2.0, 7.4, 5.2, T.cyanL, {alpha:62});
  sl.addText("📋 Per-Question Log",{x:6.15,y:2.1,w:7.0,h:0.5,
    fontSize:15,bold:true,color:T.cyanL,fontFace:"Segoe UI"});
  neonLine(sl,6.15,2.66,6.9,T.cyan);

  ["Q#","Your Answer","Correct Answer","Result"].forEach((h,i)=>{
    const xOff=[0.1,0.65,2.6,4.9];
    sl.addText(h,{x:6.1+xOff[i],y:2.74,w:[0.55,2.1,2.4,1.4][i],h:0.35,
      fontSize:9.5,bold:true,color:T.cyanL,fontFace:"Segoe UI"});
  });
  neonLine(sl,6.15,3.12,6.85,T.border);

  const qLog=[
    [1,"B","B","✅"],[2,"A","C","❌"],[3,"D","D","✅"],
    [4,"—","B","⏭"],[5,"C","C","✅"],[6,"B","A","❌"],
    [7,"D","D","✅"],[8,"A","A","✅"],
  ];
  const rColor={"✅":T.emeraldL,"❌":T.roseL,"⏭":T.amberL};
  qLog.forEach(([n,ya,ca,res],i)=>{
    const y=3.2+i*0.5;
    const bgC = i%2===0 ? T.bg2 : T.bg1;
    sl.addShape(prs.ShapeType.rect,{x:5.95,y,w:7.4,h:0.44,
      fill:{color:bgC,alpha:55},line:{type:"none"}});
    [[n,0.1],[ya,0.65],[ca,2.6],[res,4.9]].forEach(([v,xOff],ci)=>{
      sl.addText(`${v}`,{x:6.05+xOff,y,w:[0.55,2.1,2.4,1.4][ci],h:0.44,
        valign:"middle",fontSize:11.5,
        color: ci===3 ? rColor[res] : T.white,
        fontFace:"Segoe UI", bold:ci===3});
    });
  });

  sl.addText("Admin controls: Show/Hide Correct Answers  ·  Show/Hide Detailed Log  ·  Per-exam configurable",{
    x:0.45,y:7.4,w:12.5,h:0.38, align:"center",
    fontSize:9.5,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 10 · AI RECOMMENDATIONS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 145);
  orb(sl, 12.5, 1.5, 5.0, T.purple, 12);
  orb(sl, 0.5, 6.5, 3.0, T.cyan, 8);

  heading(sl,
    "AI-Powered Student Recommendations",
    "Gemini AI analyses every student's history and recommends their next exam intelligently.",
    "✦  AI ENGINE", T.purpleL
  );

  const steps = [
    {n:"01", icon:"📊", t:"History Intake",   b:"Student completes exams. Scores, time, correct answers recorded per topic.", color:T.accentL},
    {n:"02", icon:"🧠", t:"Gemini Analysis",  b:"AI analyses topic affinities, weak areas, and performance trend over all results.", color:T.purpleL},
    {n:"03", icon:"🎯", t:"Smart Match",       b:"Algorithm matches student profile to available exams by topics and difficulty.", color:T.cyanL},
    {n:"04", icon:"✨", t:"Personalised Feed", b:"Student dashboard shows recommended exams — always relevant, never generic.", color:T.emeraldL},
  ];

  steps.forEach((s,i) => {
    const x = 0.4 + i * 3.25;
    glass(sl, x, 2.1, 3.05, 3.7, s.color, {alpha:62});
    orb(sl, x+0.8, 2.55, 0.9, s.color, 18);
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.2,y:2.2,w:0.58,h:0.4,rectRadius:0.07,
      fill:{color:s.color,alpha:22},line:{color:s.color,pt:1.2}});
    sl.addText(s.n,{x:x+0.2,y:2.2,w:0.58,h:0.4,
      align:"center",valign:"middle",fontSize:10.5,bold:true,color:s.color,fontFace:"Segoe UI"});
    sl.addText(s.icon,{x,y:2.65,w:3.05,h:0.85, align:"center",fontSize:25});
    neonLine(sl, x+0.25, 3.62, 2.55, s.color);
    sl.addText(s.t,{x:x+0.1,y:3.72,w:2.85,h:0.5,
      align:"center",fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(s.b,{x:x+0.1,y:4.25,w:2.85,h:1.35,
      align:"center",fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.3});
  });

  [3.47, 6.72, 9.97].forEach(x => {
    sl.addText("▶",{x,y:3.55,w:0.35,h:0.42, align:"center", fontSize:16, color:T.gray});
  });

  // Admin insight strip
  glass(sl, 0.4, 6.05, 12.55, 1.35, T.purple, {alpha:50});
  sl.addText("🔍  Admin Visibility",{x:0.65,y:6.15,w:3.5,h:0.45,
    fontSize:13,bold:true,color:T.purpleL,fontFace:"Segoe UI"});
  const adminInsights = [
    "Topic-level weak spots across your student cohort",
    "Per-student engagement and attempt frequency",
    "Cohort-wide pass/fail ratio by exam",
    "AI recommendation acceptance rate tracking",
  ];
  adminInsights.forEach((insight,i)=>{
    const col = i%2===0 ? 4.3 : 8.6;
    const row = i<2 ? 6.18 : 6.66;
    dotItem(sl, insight, col, row, T.purpleL, 4.0);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 11 · ADMIN ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 150);
  orb(sl, 10.5, 4.0, 5.0, T.emerald, 9);

  heading(sl,
    "Admin Analytics Dashboard",
    "High-level workspace intelligence — aggregated exam performance at a glance.",
    "✦  ANALYTICS", T.emeraldL
  );

  const kpis = [
    {v:"1,248", l:"Total Attempts",   icon:"📝", color:T.accentL},
    {v:"74.3%", l:"Avg. Score",       icon:"📊", color:T.emeraldL},
    {v:"89%",   l:"Pass Rate",        icon:"✅", color:T.emeraldL},
    {v:"38 min",l:"Avg. Time Taken",  icon:"⏱️", color:T.amberL},
    {v:"312",   l:"Students Enrolled",icon:"🎓", color:T.cyanL},
    {v:"8",     l:"Active Exams",     icon:"📅", color:T.purpleL},
  ];

  kpis.forEach((k,i)=>{
    const x = 0.4 + (i%3)*4.38;
    const y = i<3 ? 2.05 : 4.12;
    glass(sl, x, y, 4.1, 1.68, k.color, {alpha:58});
    orb(sl, x+3.4, y+0.2, 1.0, k.color, 15);
    sl.addText(k.icon,{x:x+0.2,y:y+0.22,w:0.65,h:0.65,align:"center",fontSize:22});
    sl.addText(k.v,{x:x+0.95,y:y+0.18,w:3.0,h:0.78,
      fontSize:27,bold:true,color:k.color,fontFace:"Segoe UI"});
    sl.addText(k.l,{x:x+0.95,y:y+0.92,w:3.0,h:0.46,
      fontSize:11,color:T.gray,fontFace:"Segoe UI"});
  });

  glass(sl, 0.4, 6.05, 12.55, 1.28, T.border, {alpha:58, pt:0.8});
  sl.addText("📋 Teacher sees per-exam:",{x:0.6,y:6.13,w:3.5,h:0.4,
    fontSize:11,bold:true,color:T.white,fontFace:"Segoe UI"});
  ["Student Name","Score","% Score","Pass/Fail","Time Taken","Submission Date"].forEach((c,i)=>{
    sl.addText("·  "+c,{x:4.1+i*1.52,y:6.13,w:1.52,h:0.4,valign:"middle",
      fontSize:10,color:T.gray,fontFace:"Segoe UI"});
  });
  sl.addText("All results filterable by exam, date, or student  ·  Export on-demand",{
    x:0.6,y:6.6,w:12,h:0.5,
    fontSize:10,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 12 · NOTICE / NOTIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 155);
  orb(sl, 11.0, 1.5, 4.5, T.cyan, 10);

  heading(sl,
    "Notice & Notification System",
    "Broadcast important updates instantly — to your workspace, teachers, or students.",
    "✦  COMMUNICATION", T.cyanL
  );

  const features = [
    { icon:"📢", color:T.cyanL,   t:"Workspace Notices",        b:"Admin publishes notices visible to all workspace members. Auto-expires after 14 days for clean UX." },
    { icon:"🔔", color:T.purpleL, t:"In-App Notifications",     b:"Real-time notification bell for teachers and students — new exam alerts, result announcements, updates." },
    { icon:"✉️", color:T.amberL,  t:"Email Notifications",      b:"Automated transactional emails for onboarding, payment confirmation, subscription renewal, and more." },
    { icon:"🏷️", color:T.emeraldL,t:"Role-Scoped Messaging",    b:"Super Admin → Workspace Admins only. Admin → Teachers + Students. Privacy-first hierarchy enforced." },
    { icon:"📅", color:T.accentL, t:"14-Day Auto-Cleanup",      b:"Notices older than 14 days are automatically archived — no manual maintenance required." },
    { icon:"🔒", color:T.roseL,   t:"Workspace Isolation",      b:"Students from Workspace A cannot see notices or notifications from Workspace B. Fully isolated." },
  ];

  features.forEach((f,i)=>{
    const col = i%2;
    const row = Math.floor(i/2);
    const x = 0.4 + col*6.65;
    const y = 2.1 + row*1.72;
    glass(sl, x, y, 6.35, 1.58, f.color, {alpha:55, pt:1.2});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.18,y:y+0.16,w:0.72,h:0.72,rectRadius:0.09,
      fill:{color:f.color,alpha:18},line:{color:f.color,pt:1.2}});
    sl.addText(f.icon,{x:x+0.18,y:y+0.12,w:0.72,h:0.78,align:"center",fontSize:20});
    sl.addText(f.t,{x:x+1.07,y:y+0.14,w:5.1,h:0.44,
      fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(f.b,{x:x+1.07,y:y+0.6,w:5.1,h:0.85,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.25});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 13 · SUBSCRIPTION & PRICING
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 140);
  orb(sl, 11.0, 2.0, 5.0, T.gold, 9);
  orb(sl, 1.0, 5.5, 3.5, T.purple, 8);

  heading(sl,
    "Subscription Plans",
    "Transparent pricing. No hidden fees. Scale as your institute grows.",
    "✦  PRICING", T.amberL
  );

  const plans = [
    {
      name:"STARTER",     icon:"🌱", color:T.emeraldL, popular:false,
      price:"₹999", per:"/month",
      features:["Up to 50 Students","5 Teachers","100 Questions","10 Exams/month","Basic Analytics","Email Support"],
    },
    {
      name:"PROFESSIONAL", icon:"🚀", color:T.accentL, popular:true,
      price:"₹2,499", per:"/month",
      features:["Up to 500 Students","20 Teachers","1,000 Questions","Unlimited Exams","AI MCQ Generator","Advanced Analytics","Priority Support"],
    },
    {
      name:"ENTERPRISE",   icon:"🏛️", color:T.purpleL, popular:false,
      price:"Custom",  per:"contact us",
      features:["Unlimited Students","Unlimited Teachers","Unlimited Questions","White-label Options","Dedicated Support","Custom Integrations","SLA Guarantee"],
    },
  ];

  plans.forEach((p,i)=>{
    const x = 0.38 + i*4.35;
    const borderColor = p.popular ? T.accentL : p.color;
    const bgAlpha = p.popular ? 70 : 58;
    glass(sl, x, 2.0, 4.1, 5.4, borderColor, {alpha:bgAlpha, pt: p.popular?1.8:1.2});

    if(p.popular){
      sl.addShape(prs.ShapeType.roundRect,{x:x+0.8,y:1.82,w:2.5,h:0.34,rectRadius:0.06,
        fill:{type:"gradient",gradType:"linear",angle:90,
          stops:[{position:0,color:T.accent},{position:100,color:T.purple}]},
        line:{type:"none"}});
      sl.addText("⭐ MOST POPULAR",{x:x+0.8,y:1.82,w:2.5,h:0.34,
        align:"center",valign:"middle",fontSize:8.5,bold:true,color:T.white,fontFace:"Segoe UI"});
    }

    orb(sl, x+1.3, 2.45, 1.0, p.color, 18);
    sl.addText(p.icon,{x,y:2.1,w:4.1,h:0.9, align:"center",fontSize:26});
    sl.addText(p.name,{x,y:3.05,w:4.1,h:0.5,
      align:"center",fontSize:16,bold:true,color:p.color,fontFace:"Segoe UI"});
    neonLine(sl, x+0.35, 3.6, 3.4, p.color);
    sl.addText(p.price,{x,y:3.72,w:4.1,h:0.65,
      align:"center",fontSize:28,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(p.per,{x,y:4.36,w:4.1,h:0.32,
      align:"center",fontSize:11,color:T.gray,fontFace:"Segoe UI"});
    p.features.forEach((f,fi)=>{
      checkItem(sl, f, x+0.22, 4.8+fi*0.42, p.color, 3.7);
    });
  });

  sl.addText("All plans include: Exam Builder · Result Engine · Student Dashboard · Anti-Cheat Controls · 14-Day Notice System",{
    x:0.45,y:7.58,w:12.5,h:0.38, align:"center",
    fontSize:9.5,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 14 · PAYMENT & BILLING WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 145);
  orb(sl, 12.0, 1.5, 4.5, T.emerald, 10);

  heading(sl,
    "Payment & Billing Workflow",
    "Transparent, admin-approved payment process with full receipt and invoice generation.",
    "✦  PAYMENTS", T.emeraldL
  );

  const steps = [
    {n:"01", icon:"🏢", t:"Admin Requests Plan",     b:"Workspace Admin selects a plan and initiates payment from their dashboard.",   color:T.accentL},
    {n:"02", icon:"📜", t:"Agreement Review",         b:"Admin reads the full User Agreement, Disclaimer & Refund Policy before proceeding.",color:T.purpleL},
    {n:"03", icon:"✅", t:"Agreement Accepted",       b:"Admin confirms agreement — timestamped, IP-logged for legal compliance (Indian law).",color:T.cyanL},
    {n:"04", icon:"💳", t:"Payment Processing",       b:"Secure payment via Razorpay/UPI/Net Banking. Payment receipt generated instantly.",color:T.emeraldL},
    {n:"05", icon:"🔑", t:"Subscription Activated",  b:"Workspace unlocked immediately. Admin receives confirmation email with invoice PDF.",color:T.amberL},
    {n:"06", icon:"📊", t:"Ledger & Audit Trail",    b:"Super Admin sees full ledger: payment date, plan, amount, workspace ID, status.",  color:T.roseL},
  ];

  steps.forEach((s,i)=>{
    const x = 0.4 + (i%3)*4.35;
    const y = 2.05 + Math.floor(i/3)*2.1;
    glass(sl, x, y, 4.1, 1.95, s.color, {alpha:58, pt:1.2});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.18,y:y+0.18,w:0.65,h:0.52,rectRadius:0.08,
      fill:{color:s.color,alpha:22},line:{color:s.color,pt:1.2}});
    sl.addText(s.n,{x:x+0.18,y:y+0.18,w:0.65,h:0.52,
      align:"center",valign:"middle",fontSize:11,bold:true,color:s.color,fontFace:"Segoe UI"});
    sl.addText(s.icon,{x:x+0.92,y:y+0.15,w:0.7,h:0.62,align:"center",fontSize:20});
    sl.addText(s.t,{x:x+1.62,y:y+0.15,w:2.3,h:0.62,valign:"middle",
      fontSize:12,bold:true,color:T.white,fontFace:"Segoe UI"});
    neonLine(sl, x+0.18, y+0.82, 3.72, s.color, 0.018);
    sl.addText(s.b,{x:x+0.18,y:y+0.92,w:3.72,h:0.9,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.3});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 15 · LEGAL AGREEMENT & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 155);
  orb(sl, 11.0, 2.0, 4.5, T.amber, 9);

  heading(sl,
    "User Agreement & Legal Compliance",
    "Fully compliant with Indian IT Act & Consumer Protection Act. Transparent for workspace admins.",
    "✦  LEGAL & COMPLIANCE", T.amberL
  );

  // Left: What admin agrees to
  glass(sl, 0.4, 2.1, 6.0, 5.2, T.amberL, {alpha:58});
  sl.addText("✅  Admin Agreement Covers",{x:0.62,y:2.2,w:5.6,h:0.5,
    fontSize:14,bold:true,color:T.amberL,fontFace:"Segoe UI"});
  neonLine(sl,0.62,2.78,5.6,T.amber);

  const agrees = [
    "Platform is for CBT exam management — educational use",
    "All payments are non-refundable post-activation",
    "Admin confirms they've tested the platform (demo available)",
    "Admin is responsible for exam content accuracy",
    "Platform not liable for indirect losses or tech limitations",
    "Admin agrees to fair use — no scraping, hacking, or fraud",
    "Subscription auto-renews unless cancelled before due date",
    "Governing law: India · Jurisdiction: Kolkata, West Bengal",
  ];
  agrees.forEach((a,i)=>{
    checkItem(sl, a, 0.65, 2.96+i*0.5, T.amberL, 5.5);
  });

  // Right: Disclaimer (key points)
  glass(sl, 6.65, 2.1, 6.7, 5.2, T.roseL, {alpha:55});
  sl.addText("⚠️  Key Disclaimer Points",{x:6.85,y:2.2,w:6.3,h:0.5,
    fontSize:14,bold:true,color:T.roseL,fontFace:"Segoe UI"});
  neonLine(sl,6.85,2.78,6.3,T.rose);

  const disclaimers = [
    { t:"No Guarantee of Results", b:"Outcomes depend on user input, usage, and external factors." },
    { t:"Platform Usage Responsibility", b:"Users solely responsible for exam content, verification & fair practices." },
    { t:"Technical Limitations", b:"Service continuity not guaranteed; disruptions may occur." },
    { t:"Limitation of Liability", b:"ABCD Exam Hub not liable for direct/indirect losses or disputes." },
    { t:"Third-Party Services", b:"Not responsible for issues from hosting, payment, or analytics partners." },
    { t:"Fair Use & Misconduct", b:"Hacking/scraping = immediate suspension + permanent ban + legal action." },
    { t:"Jurisdiction", b:"Governed by laws of India. Kolkata, West Bengal." },
  ];
  disclaimers.forEach((d,i)=>{
    const y = 2.96 + i*0.65;
    sl.addShape(prs.ShapeType.ellipse,{x:6.88,y:y+0.1,w:0.14,h:0.14,fill:{color:T.roseL},line:{type:"none"}});
    sl.addText(d.t,{x:7.1,y,w:6.1,h:0.26,
      fontSize:11,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(d.b,{x:7.1,y:y+0.26,w:6.1,h:0.3,
      fontSize:10,color:T.gray,fontFace:"Segoe UI"});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 16 · WHY CHOOSE ABCD EXAM HUB (VALUE PROPOSITION)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 140);
  orb(sl, 11.5, 1.0, 5.0, T.cyan, 10);
  orb(sl, 0.8, 6.0, 3.5, T.amber, 8);

  heading(sl,
    "Why Choose ABCD Exam Hub?",
    "The competitive edge that makes us the right choice for your institute.",
    "✦  VALUE PROPOSITION", T.cyanL
  );

  const pros = [
    { icon:"🏆", color:T.amberL,   t:"Made for Indian Institutes",      b:"Built with Indian education workflow in mind — Hindi/English support, INR pricing, Razorpay integration." },
    { icon:"⚡", color:T.accentL,  t:"Setup in Under 10 Minutes",        b:"No complex training needed. Onboard, create your first exam, and go live in a single session." },
    { icon:"🤖", color:T.purpleL,  t:"AI Does the Heavy Lifting",        b:"Google Gemini AI generates entire question sets from a topic prompt — saving hours of manual work." },
    { icon:"🔒", color:T.roseL,    t:"Built-In Exam Integrity",          b:"Tab detection, time locks, draft save, password gates — comprehensive anti-cheat without extra tools." },
    { icon:"📊", color:T.emeraldL, t:"Real Analytics, Not Just Reports",  b:"Topic-wise weak spots, cohort pass rates, AI recommendations — intelligence that drives teaching." },
    { icon:"💰", color:T.cyanL,    t:"Flat Pricing, No Per-Seat Surprises",b:"Pay a flat monthly fee. Add 1 student or 1,000 — within your plan, cost stays fixed." },
  ];

  pros.forEach((p,i)=>{
    const col = i%2;
    const row = Math.floor(i/2);
    const x = 0.4 + col*6.65;
    const y = 2.05 + row*1.75;
    glass(sl, x, y, 6.35, 1.62, p.color, {alpha:55, pt:1.2});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.18,y:y+0.18,w:0.72,h:0.72,rectRadius:0.09,
      fill:{color:p.color,alpha:18},line:{color:p.color,pt:1.2}});
    sl.addText(p.icon,{x:x+0.18,y:y+0.14,w:0.72,h:0.78,align:"center",fontSize:20});
    sl.addText(p.t,{x:x+1.07,y:y+0.14,w:5.1,h:0.44,
      fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(p.b,{x:x+1.07,y:y+0.6,w:5.1,h:0.88,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.25});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 17 · TESTIMONIALS / SOCIAL PROOF
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 145);
  orb(sl, 6.6, 2.5, 6.0, T.gold, 8);

  heading(sl,
    "What Admins Are Saying",
    "Real feedback from workspace admins who are running exams on ABCD Exam Hub.",
    "✦  TESTIMONIALS", T.amberL
  );

  const testimonials = [
    {
      name:"Priya Sharma",   role:"Admin, Excel Coaching Centre, Kolkata",
      text:"We switched from paper exams to ABCD Exam Hub in one week. The AI MCQ tool saved us 20+ hours of question paper preparation. Results are instant and students love it.",
      stars:5,
    },
    {
      name:"Rajesh Kumar",   role:"Director, TechPrep Institute, Patna",
      text:"The tab detection and draft-save features are brilliant. Our students no longer lose progress due to connectivity issues, and we can trust the integrity of every exam.",
      stars:5,
    },
    {
      name:"Anita Bose",     role:"Academic Head, Future Academy, Mumbai",
      text:"Flat monthly pricing with unlimited exams within the plan is a game changer. We run 30+ exams a month and pay the same fixed cost.",
      stars:5,
    },
  ];

  testimonials.forEach((t,i)=>{
    const x = 0.4 + i*4.35;
    glass(sl, x, 2.1, 4.1, 4.8, T.amberL, {alpha:52, pt:1.2});
    orb(sl, x+3.5, 2.35, 1.0, T.gold, 12);
    sl.addText("❝",{x:x+0.2,y:2.18,w:0.6,h:0.65, fontSize:32, color:T.amberL, fontFace:"Georgia"});
    sl.addText(t.text,{x:x+0.18,y:2.85,w:3.72,h:2.65,
      fontSize:11,color:T.grayL,fontFace:"Segoe UI",lineSpacingMultiple:1.5,italic:true});
    neonLine(sl, x+0.2, 5.6, 3.7, T.amber);
    starRating(sl, x+0.2, 5.7, t.stars);
    sl.addText(t.name,{x:x+0.18,y:6.12,w:3.72,h:0.42,
      fontSize:12,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(t.role,{x:x+0.18,y:6.52,w:3.72,h:0.38,
      fontSize:9.5,color:T.gray,fontFace:"Segoe UI",italic:true});
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 18 · GETTING STARTED (ONBOARDING STEPS)
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 150);
  orb(sl, 12.0, 1.0, 4.5, T.emerald, 10);

  heading(sl,
    "Get Started in 5 Simple Steps",
    "From registration to your first live exam — in under 30 minutes.",
    "✦  ONBOARDING", T.emeraldL
  );

  const onboarding = [
    {n:"01", icon:"📋", t:"Register Workspace",     b:"Super Admin creates your workspace. You receive login credentials via email.", color:T.accentL},
    {n:"02", icon:"💳", t:"Choose & Pay Plan",       b:"Select your subscription plan, read the agreement, and complete payment securely.", color:T.purpleL},
    {n:"03", icon:"👩‍🏫", t:"Add Teachers",           b:"Invite teachers via email. They get role-based access immediately upon signup.", color:T.cyanL},
    {n:"04", icon:"📚", t:"Build Question Bank",     b:"Upload questions manually or use AI MCQ generator to bulk-create your question library.", color:T.emeraldL},
    {n:"05", icon:"🚀", t:"Launch Your First Exam",  b:"Create an exam, configure settings, publish — students can start in minutes!", color:T.amberL},
  ];

  onboarding.forEach((s,i)=>{
    const x = 0.4 + i*2.6;
    glass(sl, x, 2.1, 2.45, 4.8, s.color, {alpha:60, pt:1.2});
    orb(sl, x+0.8, 2.55, 0.9, s.color, 18);
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.88,y:2.2,w:0.62,h:0.44,rectRadius:0.08,
      fill:{color:s.color,alpha:22},line:{color:s.color,pt:1.2}});
    sl.addText(s.n,{x:x+0.88,y:2.2,w:0.62,h:0.44,
      align:"center",valign:"middle",fontSize:10.5,bold:true,color:s.color,fontFace:"Segoe UI"});
    sl.addText(s.icon,{x,y:2.72,w:2.45,h:0.85,align:"center",fontSize:26});
    neonLine(sl, x+0.25, 3.65, 1.95, s.color);
    sl.addText(s.t,{x:x+0.1,y:3.75,w:2.25,h:0.5,
      align:"center",fontSize:12,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(s.b,{x:x+0.1,y:4.28,w:2.25,h:2.35,
      align:"center",fontSize:10,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.4});
  });

  // Support note
  glass(sl, 0.4, 7.1, 12.55, 0.5, T.border, {alpha:55, pt:0.8});
  sl.addText("⚡ Demo available before commitment  ·  📞 Support team available during onboarding  ·  📖 Full documentation provided",{
    x:0.6,y:7.1,w:12.2,h:0.5, align:"center",valign:"middle",
    fontSize:10,color:T.gray,fontFace:"Segoe UI"});
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDE 19 · CALL TO ACTION
// ═══════════════════════════════════════════════════════════════════════════════
{
  const sl = prs.addSlide();
  bg(sl, 135);

  orb(sl, 4.8, 2.5, 9.0, T.accent, 14);
  orb(sl, 10.5, 5.5, 5.0, T.purple, 10);
  orb(sl, 0.5, 6.5, 3.5, T.cyan, 8);

  // Grid overlay
  for(let i=0;i<15;i++){
    sl.addShape(prs.ShapeType.rect,{x:i*1.0,y:0,w:0.005,h:"100%",
      fill:{color:T.white,alpha:2},line:{type:"none"}});
  }

  sl.addText("Ready to Transform",{x:0.8,y:0.9,w:11.7,h:0.9,
    align:"center",fontSize:42,bold:true,color:T.white,fontFace:"Segoe UI"});
  sl.addText("Your Institute's Exams?",{x:0.8,y:1.78,w:11.7,h:0.9,
    align:"center",fontSize:42,bold:true,fontFace:"Segoe UI",color:T.cyanL});

  neonLine(sl, 3.5, 2.88, 6.3, T.accent);

  sl.addText("ABCD Exam Hub gives you everything a workspace admin needs\nto run fair, smart, and scalable CBT examinations — powered by AI.",{
    x:1.5,y:3.08,w:10.3,h:1.15,
    align:"center",fontSize:15,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.45});

  // Two CTAs
  sl.addShape(prs.ShapeType.roundRect,{x:2.1,y:4.45,w:4.5,h:0.88,rectRadius:0.12,
    fill:{type:"gradient",gradType:"linear",angle:90,
          stops:[{position:0,color:T.accent},{position:100,color:T.purple}]},
    line:{type:"none"}});
  sl.addText("🚀  Request Workspace Access",{x:2.1,y:4.45,w:4.5,h:0.88,
    align:"center",valign:"middle",fontSize:14,bold:true,color:T.white,fontFace:"Segoe UI"});

  sl.addShape(prs.ShapeType.roundRect,{x:6.75,y:4.45,w:4.5,h:0.88,rectRadius:0.12,
    fill:{color:T.bg1,alpha:80},line:{color:T.cyanL,pt:1.5}});
  sl.addText("🎯  Schedule a Demo",{x:6.75,y:4.45,w:4.5,h:0.88,
    align:"center",valign:"middle",fontSize:14,bold:true,color:T.cyanL,fontFace:"Segoe UI"});

  // Feature tag cloud
  const tags=["Exam Builder","AI MCQ","Draft AutoSave","Negative Marks","3 Result Modes","Tab Guard","Analytics","AI Recommendations","Notice System","Payment Flow","Agreement & Legal","Multi-Tenant"];
  tags.forEach((t,i)=>{
    const x = 0.4 + (i%4)*3.28;
    const y = 5.58 + Math.floor(i/4)*0.52;
    sl.addShape(prs.ShapeType.roundRect,{x,y,w:3.1,h:0.38,rectRadius:0.07,
      fill:{color:T.bg2,alpha:72},line:{color:T.border,pt:1}});
    sl.addText("✦  "+t,{x,y,w:3.1,h:0.38,
      align:"center",valign:"middle",fontSize:10,color:T.gray,fontFace:"Segoe UI"});
  });

  // Contact
  sl.addText("abcdexamhub.app  ·  Contact your Super Admin for workspace activation",{
    x:0.5,y:7.2,w:12.3,h:0.38,
    align:"center",fontSize:10,color:T.gray,fontFace:"Segoe UI"});
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────
prs.writeFile({fileName:"ABCD_ExamHub_Admin_Pitch_v3.pptx"})
  .then(() => console.log("✅  Saved: ABCD_ExamHub_Admin_Pitch_v3.pptx"))
  .catch(e  => console.error("❌  Error:", e));
