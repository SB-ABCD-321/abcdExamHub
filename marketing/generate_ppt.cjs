// ╔═══════════════════════════════════════════════════════════════╗
// ║  ABCD Exam Hub  ·  Workspace Admin Pitch  ·  Modern Edition  ║
// ║  Run:  node generate_ppt.cjs                                  ║
// ╚═══════════════════════════════════════════════════════════════╝

const pptx = require("pptxgenjs");
const prs  = new pptx();

prs.layout  = "LAYOUT_WIDE";
prs.author  = "ABCD Exam Hub";
prs.title   = "ABCD Exam Hub – Feature Showcase";
prs.subject = "Exam & Results Management Platform";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0:      "060B18",   // deepest
  bg1:      "0D1528",   // card dark
  bg2:      "111827",   // card mid
  accent:   "818CF8",   // indigo-400
  purple:   "A855F7",   // purple-500
  cyan:     "22D3EE",   // cyan-400
  emerald:  "34D399",   // emerald-400
  amber:    "FBBF24",   // amber-400
  rose:     "F87171",   // rose-400
  white:    "FFFFFF",
  gray:     "94A3B8",
  border:   "1E2D45",
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function bg(sl) {
  sl.addShape(prs.ShapeType.rect, {
    x:0,y:0,w:"100%",h:"100%",
    fill:{ type:"gradient", gradType:"linear", angle:145,
           stops:[{position:0,color:T.bg0},{position:100,color:"0A0F20"}] },
    line:{type:"none"},
  });
}

// Neon glow orb
function orb(sl, x, y, r, color, alpha=12) {
  for(let i=3;i>=1;i--){
    sl.addShape(prs.ShapeType.ellipse,{
      x: x-r*i*0.25, y: y-r*i*0.25, w: r+r*i*0.5, h: r+r*i*0.5,
      fill:{color, alpha: Math.round(alpha * (4-i)/3)}, line:{type:"none"},
    });
  }
  sl.addShape(prs.ShapeType.ellipse,{x,y,w:r,h:r,fill:{color,alpha},line:{type:"none"}});
}

// Glassmorphism card
function glass(sl, x, y, w, h, accent=T.border, opts={}) {
  sl.addShape(prs.ShapeType.roundRect,{
    x,y,w,h, rectRadius:0.14,
    fill:{color:T.bg1, alpha: opts.alpha||75},
    line:{color: accent, pt: opts.pt||1.2},
  });
}

// Pill badge
function pill(sl, txt, x, y, color=T.accent) {
  sl.addShape(prs.ShapeType.roundRect,{
    x,y,w:2.6,h:0.34,rectRadius:0.06,
    fill:{color,alpha:20}, line:{color,pt:1},
  });
  sl.addText(txt,{x,y,w:2.6,h:0.34, align:"center",valign:"middle",
    fontSize:9.5,bold:true,color,fontFace:"Segoe UI"});
}

// Section heading
function heading(sl, h1, h2, badgeTxt, badgeColor=T.accent) {
  pill(sl, badgeTxt, 0.45, 0.3, badgeColor);
  sl.addText(h1,{x:0.45,y:0.75,w:12,h:0.75,
    fontSize:34,bold:true,color:T.white,fontFace:"Segoe UI"});
  if(h2) sl.addText(h2,{x:0.45,y:1.52,w:11.5,h:0.45,
    fontSize:14,color:T.gray,fontFace:"Segoe UI Light",italic:true});
}

// Thin neon line  
function neonLine(sl, x, y, w, color=T.accent) {
  sl.addShape(prs.ShapeType.rect,{x,y,w,h:0.025,fill:{color},line:{type:"none"}});
}

// ─── SLIDE 1 · COVER ──────────────────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);

  // Background orbs
  orb(sl, 9.5, -0.8, 5.5, T.purple, 14);
  orb(sl, -1.5, 5.0, 4.0, T.cyan, 10);
  orb(sl, 11.5, 5.5, 3.0, T.accent, 10);

  // Grid lines (decorative)
  for(let i=0;i<14;i++){
    sl.addShape(prs.ShapeType.rect,{x:i*1.0,y:0,w:0.006,h:"100%",
      fill:{color:T.white,alpha:3},line:{type:"none"}});
  }
  for(let j=0;j<9;j++){
    sl.addShape(prs.ShapeType.rect,{x:0,y:j*0.85,w:"100%",h:0.006,
      fill:{color:T.white,alpha:3},line:{type:"none"}});
  }

  // Tag
  pill(sl,"✦  WORKSPACE ADMIN EDITION",0.5,0.8,T.cyan);

  // Main title
  sl.addText("ABCD",{x:0.5,y:1.3,w:13,h:1.3,
    fontSize:72,bold:true,color:T.white,fontFace:"Segoe UI"});
  sl.addText("Exam Hub",{x:0.5,y:2.55,w:13,h:1.1,
    fontSize:58,bold:true,fontFace:"Segoe UI",color:T.cyan});

  neonLine(sl, 0.5, 3.8, 6.5, T.accent);

  sl.addText("Smarter Exams. Intelligent Results. Zero Compromise.",{x:0.5,y:3.95,w:10,h:0.65,
    fontSize:16,color:T.gray,fontFace:"Segoe UI Light",italic:true});

  // Stats strip
  const stats = [
    {v:"Exam Builder",l:"Full Lifecycle"},
    {v:"AI-Powered",l:"MCQ Generation"},
    {v:"Real-time",l:"Result Analytics"},
    {v:"Anti-Cheat",l:"Draft & Tab Guard"},
  ];
  stats.forEach((s,i)=>{
    const x = 0.5 + i*3.2;
    glass(sl, x, 5.0, 3.0, 1.3, T.accent);
    sl.addText(s.v,{x,y:5.1,w:3.0,h:0.5, align:"center",
      fontSize:14,bold:true,color:T.accent,fontFace:"Segoe UI"});
    sl.addText(s.l,{x,y:5.6,w:3.0,h:0.35, align:"center",
      fontSize:10,color:T.gray,fontFace:"Segoe UI"});
  });

  sl.addText("March 2026  ·  Confidential",{x:0.5,y:6.95,w:12,h:0.35,
    align:"center",fontSize:9.5,color:T.gray,fontFace:"Segoe UI"});
}

// ─── SLIDE 2 · PLATFORM OVERVIEW ─────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 11.5, 1.5, 4.0, T.purple, 10);

  heading(sl,
    "One Platform, Every Role",
    "Built for institute admins who need full control — from question to result.",
    "✦  PLATFORM OVERVIEW", T.purple
  );

  const roles = [
    { icon:"🏛️", name:"Admin",   color:T.accent,  desc:"Workspace owner. Full control over teachers, exams, students & analytics." },
    { icon:"👩‍🏫", name:"Teacher", color:T.emerald, desc:"Creates topics, questions, drafts and publishes exams. AI-assisted MCQ generation." },
    { icon:"🎓", name:"Student", color:T.amber,   desc:"Takes exams, views results, gets AI-driven recommendations on next tests." },
  ];

  roles.forEach((r, i) => {
    const x = 0.4 + i * 4.35;
    glass(sl, x, 2.15, 4.1, 4.5, r.color, {alpha:70});
    orb(sl, x+1.4, 2.5, 1.1, r.color, 20);
    sl.addText(r.icon,{x,y:2.35,w:4.1,h:0.9, align:"center",fontSize:26});
    neonLine(sl, x+0.4, 3.4, 3.3, r.color);
    sl.addText(r.name,{x,y:3.55,w:4.1,h:0.55,
      align:"center",fontSize:18,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(r.desc,{x:x+0.2,y:4.2,w:3.7,h:1.6,
      align:"center",fontSize:11.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.4});
  });

  // Flow arrows
  [4.52, 8.87].forEach(x => {
    sl.addText("▶",{x,y:4.0,w:0.5,h:0.5, align:"center", fontSize:16, color:T.gray});
  });

  sl.addText("Role-based access control powered by Clerk OAuth · Every action is gated by role + workspace ownership",{
    x:0.45,y:6.85,w:12.5,h:0.4, align:"center",
    fontSize:9.5,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ─── SLIDE 3 · EXAM BUILDER ───────────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 12.5, 4.0, 5.0, T.cyan, 10);

  heading(sl,
    "Exam Builder",
    "Design, schedule, and control every aspect of your exams — visually and precisely.",
    "✦  EXAM MANAGEMENT", T.cyan
  );

  const props = [
    { icon:"📝", label:"Rich Title & Description",  sub:"Set exam name, description, logo & contact info on every exam." },
    { icon:"⏱️", label:"Timed Sessions",             sub:"Set exact duration (minutes). Students see a live countdown timer." },
    { icon:"📅", label:"Scheduled Windows",          sub:"Define a startTime & endTime — exams lock automatically outside windows." },
    { icon:"🔐", label:"Password Protection",        sub:"Add a password to restrict access to invited-only sessions." },
    { icon:"🌐", label:"Public / Private Toggle",    sub:"Make an exam public for all students or restrict to your workspace." },
    { icon:"⚡", label:"Exam Status Control",        sub:"Instantly switch between ACTIVE, PAUSED, or INACTIVE." },
    { icon:"➕", label:"Marks per Question",         sub:"Configure custom marks per question for weighted scoring." },
    { icon:"➖", label:"Negative Marking",           sub:"Enable negative marks with a configurable deduction value." },
    { icon:"📋", label:"Question Compiler",          sub:"Pick questions from your bank by topic — drag, drop, publish." },
  ];

  props.forEach((p, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 4.35;
    const y = 2.1 + row * 1.65;
    glass(sl, x, y, 4.1, 1.5, T.cyan, {alpha:60, pt:1});
    sl.addText(p.icon + "  " + p.label,{x:x+0.2,y:y+0.12,w:3.7,h:0.48,
      fontSize:12.5,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(p.sub,{x:x+0.2,y:y+0.62,w:3.7,h:0.78,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.3});
  });
}

// ─── SLIDE 4 · QUESTION BANK & AI MCQ ────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 0.5, 5.5, 4.0, T.purple, 10);
  orb(sl, 12.0, 1.0, 3.5, T.accent, 10);

  heading(sl,
    "Question Bank + AI Generation",
    "Build your MCQ library once, reuse forever. Let Gemini AI do the heavy lifting.",
    "✦  QUESTION BANK", T.purple
  );

  // Left panel — Bank features
  glass(sl, 0.4, 2.1, 5.9, 4.7, T.purple, {alpha:65});
  sl.addText("📚  Question Bank",{x:0.6,y:2.25,w:5.5,h:0.5,
    fontSize:15,bold:true,color:T.purple,fontFace:"Segoe UI"});
  neonLine(sl,0.6,2.82,5.5,T.purple);

  const bankFeats = [
    "MCQ format: text, 4 options, 1 correct answer",
    "Attach images to questions (image URL support)",
    "Organise by Topics — workspace-local or global",
    "Mark questions as Public (shared) or Private",
    "Filter questions by topic when compiling exams",
    "Bulk question import via AI in one click",
    "Workspace question + topic limits enforced",
  ];
  bankFeats.forEach((f,i) => {
    sl.addShape(prs.ShapeType.ellipse,{x:0.65,y:3.14+i*0.52,w:0.15,h:0.15,
      fill:{color:T.purple},line:{type:"none"}});
    sl.addText(f,{x:0.9,y:3.07+i*0.52,w:5.2,h:0.4,
      fontSize:11.5,color:T.white,fontFace:"Segoe UI"});
  });

  // Right panel — AI generation
  glass(sl, 6.6, 2.1, 6.7, 4.7, T.accent, {alpha:65});
  sl.addText("🤖  AI Bulk MCQ Generator",{x:6.8,y:2.25,w:6.2,h:0.5,
    fontSize:15,bold:true,color:T.accent,fontFace:"Segoe UI"});
  neonLine(sl,6.8,2.82,6.2,T.accent);

  const aiSteps = [
    { step:"01", t:"Choose Topic",       b:"Pick any topic from your question bank." },
    { step:"02", t:"Enter Prompt",       b:"Type subject matter, difficulty, or specific instructions." },
    { step:"03", t:"Gemini Generates",   b:"Google Gemini AI creates N fully structured MCQs instantly." },
    { step:"04", t:"Review & Save",      b:"Edit, discard, or approve — questions land in your bank." },
    { step:"05", t:"Compile to Exam",    b:"Select generated questions and publish the exam." },
  ];
  aiSteps.forEach((a,i) => {
    const y = 3.1 + i * 0.72;
    sl.addShape(prs.ShapeType.roundRect,{x:6.75,y,w:0.55,h:0.46,rectRadius:0.06,
      fill:{color:T.accent,alpha:20},line:{color:T.accent,pt:1}});
    sl.addText(a.step,{x:6.75,y,w:0.55,h:0.46,
      align:"center",valign:"middle",fontSize:10,bold:true,color:T.accent,fontFace:"Segoe UI"});
    sl.addText(a.t,{x:7.4,y:y+0.0,w:5.7,h:0.25,
      fontSize:12,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(a.b,{x:7.4,y:y+0.24,w:5.7,h:0.3,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI"});
  });
}

// ─── SLIDE 5 · EXAM CONTROLS & SECURITY ──────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 12.5, 2.0, 4.5, T.rose, 10);

  heading(sl,
    "Exam Controls & Integrity",
    "Every safeguard you need to run fair, tamper-resistant online exams.",
    "✦  EXAM SECURITY", T.rose
  );

  const controls = [
    { icon:"🔑", color:T.rose,    t:"Password-Gated Access",     b:"Exams can require a secret password before students can start — ideal for private mock tests and paid sessions." },
    { icon:"⏰", color:T.amber,   t:"Time-Windowed Exams",        b:"Set startTime and endTime. The platform auto-locks the exam outside the scheduled window — zero manual effort." },
    { icon:"⏸️", color:T.accent,  t:"Pause / Deactivate on Fly",  b:"Switch any exam to PAUSED or INACTIVE in one click. Students in-session are gracefully halted." },
    { icon:"🚩", color:T.purple,  t:"Flagged Question Tracking",  b:"Students can flag uncertain questions during the exam. Drafts preserve flags across reconnects." },
    { icon:"💾", color:T.cyan,    t:"Auto-Save Exam Draft",       b:"Answers + time remaining + current question index saved continuously. Reconnect without losing progress." },
    { icon:"📵", color:T.emerald, t:"Tab-Switch Detection",       b:"Every time a student switches browser tabs, it's counted and stored — giving admins visibility of suspicious behaviour." },
  ];

  controls.forEach((c,i) => {
    const col = i % 2;
    const row = Math.floor(i/2);
    const x = 0.4 + col * 6.65;
    const y = 2.05 + row * 1.65;
    glass(sl, x, y, 6.35, 1.5, c.color, {alpha:60, pt:1.2});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.18,y:y+0.15,w:0.7,h:0.7,rectRadius:0.08,
      fill:{color:c.color,alpha:20},line:{color:c.color,pt:1}});
    sl.addText(c.icon,{x:x+0.18,y:y+0.12,w:0.7,h:0.75, align:"center",fontSize:20});
    sl.addText(c.t,{x:x+1.05,y:y+0.12,w:5.1,h:0.42,
      fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(c.b,{x:x+1.05,y:y+0.56,w:5.1,h:0.8,
      fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.25});
  });
}

// ─── SLIDE 6 · LIVE EXAM EXPERIENCE ──────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 1.0, 2.5, 4.0, T.emerald, 10);

  heading(sl,
    "Live Exam Experience (Student View)",
    "A distraction-free, intuitive test interface that feels premium on any device.",
    "✦  EXAM EXPERIENCE", T.emerald
  );

  // Mockup browser frame
  glass(sl, 0.4, 2.1, 12.55, 4.75, T.emerald, {alpha:60, pt:1.5});

  // Browser chrome strip
  sl.addShape(prs.ShapeType.roundRect,{x:0.4,y:2.1,w:12.55,h:0.5,rectRadius:0.0,
    fill:{color:T.bg0,alpha:90},line:{type:"none"}});
  ["E14D4D","F5A523","2BCC71"].forEach((c,i)=>{
    sl.addShape(prs.ShapeType.ellipse,{x:0.65+i*0.32,y:2.22,w:0.18,h:0.18,
      fill:{color:c},line:{type:"none"}});
  });
  sl.addShape(prs.ShapeType.roundRect,{x:1.8,y:2.2,w:6.0,h:0.22,rectRadius:0.04,
    fill:{color:T.border},line:{type:"none"}});
  sl.addText("abcdexamhub.app/exam/[id]",{x:1.85,y:2.2,w:6.0,h:0.22,
    valign:"middle",fontSize:8,color:T.gray,fontFace:"Segoe UI"});

  // Exam content area
  // — Timer bar
  sl.addShape(prs.ShapeType.rect,{x:0.5,y:2.7,w:12.4,h:0.04,
    fill:{color:T.emerald,alpha:15},line:{type:"none"}});
  sl.addShape(prs.ShapeType.rect,{x:0.5,y:2.7,w:7.5,h:0.04,
    fill:{color:T.emerald},line:{type:"none"}});
  sl.addText("⏱ 38:21 remaining",{x:0.5,y:2.77,w:5,h:0.38,
    fontSize:11,color:T.emerald,fontFace:"Segoe UI",bold:true});
  sl.addText("Q 14 / 40  ·  🚩 Flag",{x:8.5,y:2.77,w:4.3,h:0.38,
    align:"right",fontSize:11,color:T.gray,fontFace:"Segoe UI"});

  // — Question
  sl.addText("Q14.  The acceleration due to gravity at the surface of the Earth is approximately:",{
    x:0.55,y:3.22,w:11.9,h:0.55,
    fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});

  const opts = ["A.  8.2 m/s²","B.  9.8 m/s²  ✓","C.  10.5 m/s²","D.  11.0 m/s²"];
  opts.forEach((o,i) => {
    const isCorrect = i===1;
    const oy = 3.88+i*0.47;
    sl.addShape(prs.ShapeType.roundRect,{x:0.55,y:oy,w:11.9,h:0.4,rectRadius:0.06,
      fill:{color: isCorrect ? T.emerald : T.bg2, alpha: isCorrect?20:80},
      line:{color: isCorrect ? T.emerald : T.border, pt: isCorrect?1.5:1}});
    sl.addText(o,{x:0.75,y:oy,w:11.7,h:0.4,valign:"middle",
      fontSize:12,color: isCorrect?T.emerald:T.white,fontFace:"Segoe UI",
      bold:isCorrect});
  });

  // nav buttons
  sl.addShape(prs.ShapeType.roundRect,{x:0.55,y:5.85,w:2.0,h:0.42,rectRadius:0.06,
    fill:{color:T.bg2},line:{color:T.border,pt:1}});
  sl.addText("← Prev",{x:0.55,y:5.85,w:2.0,h:0.42,align:"center",valign:"middle",
    fontSize:11,color:T.gray,fontFace:"Segoe UI"});
  sl.addShape(prs.ShapeType.roundRect,{x:10.85,y:5.85,w:2.1,h:0.42,rectRadius:0.06,
    fill:{color:T.accent},line:{type:"none"}});
  sl.addText("Next →",{x:10.85,y:5.85,w:2.1,h:0.42,align:"center",valign:"middle",
    fontSize:11,bold:true,color:T.white,fontFace:"Segoe UI"});
}

// ─── SLIDE 7 · RESULT SYSTEM ──────────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 11.0, 5.0, 5.0, T.amber, 10);

  heading(sl,
    "Result Engine",
    "Three flexible publish modes. Zero ambiguity. Full transparency for students.",
    "✦  RESULT SYSTEM", T.amber
  );

  // Publish modes
  const modes = [
    {icon:"⚡",name:"INSTANT",     color:T.emerald,
     desc:"Results are revealed the moment the student submits. Ideal for practice tests and mock exams where immediate feedback boosts learning."},
    {icon:"🏁",name:"EXAM END",    color:T.amber,
     desc:"All results unlock together when the exam window closes. Perfect for competitive tests where fairness matters — no early reveals."},
    {icon:"📆",name:"CUSTOM DATE", color:T.accent,
     desc:"Admin sets a specific date & time for results to go live. Great for board exams, semester tests, or exams with manual review."},
  ];

  modes.forEach((m,i) => {
    const x = 0.4 + i*4.35;
    glass(sl, x, 2.0, 4.1, 2.8, m.color, {alpha:65, pt:1.5});
    orb(sl, x+0.6, 2.5, 1.0, m.color, 15);
    sl.addText(m.icon,{x,y:2.1,w:1.2,h:1.2, align:"center",valign:"middle",fontSize:28});
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.3,y:2.15,w:1.8,h:0.34,rectRadius:0.06,
      fill:{color:m.color,alpha:20},line:{color:m.color,pt:1}});
    sl.addText(m.name,{x:x+0.3,y:2.15,w:1.8,h:0.34,
      align:"center",valign:"middle",fontSize:10,bold:true,color:m.color,fontFace:"Segoe UI"});
    sl.addText(m.desc,{x:x+0.2,y:2.62,w:3.72,h:2.0,
      fontSize:11,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.4});
  });

  // What the result shows
  sl.addText("What Every Result Includes",{x:0.45,y:5.0,w:12,h:0.45,
    fontSize:15,bold:true,color:T.white,fontFace:"Segoe UI"});
  neonLine(sl, 0.45, 5.5, 12.45, T.amber);

  const resultItems = [
    "📊 Total Score",
    "✅ Pass / Fail",
    "⏱ Time Taken",
    "📋 Per-question Answers",
    "✔ Correct Answers Log",
    "💬 Detailed Answer Log",
  ];
  resultItems.forEach((r,i) => {
    const x = 0.45 + (i%3)*4.35;
    const y = i<3 ? 5.65 : 6.25;
    glass(sl, x, y, 4.1, 0.48, T.amber, {alpha:45, pt:0.8});
    sl.addText(r,{x:x+0.2,y,w:3.8,h:0.48, valign:"middle",
      fontSize:12,color:T.white,fontFace:"Segoe UI"});
  });
}

// ─── SLIDE 8 · RESULT DETAIL VIEW ────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 1.0, 1.5, 3.5, T.accent, 10);

  heading(sl,
    "Detailed Result Analysis",
    "Students and teachers see exactly what happened on every question.",
    "✦  RESULT DEEP DIVE", T.accent
  );

  // Mock result card
  glass(sl, 0.4, 2.0, 5.3, 4.75, T.accent, {alpha:65});
  sl.addText("🎯 Your Result",{x:0.6,y:2.1,w:4.9,h:0.5,
    fontSize:15,bold:true,color:T.accent,fontFace:"Segoe UI"});
  neonLine(sl,0.6,2.65,4.9,T.accent);

  const resultData = [
    ["Score",        "34 / 40", T.emerald],
    ["Percentage",   "85.0 %",  T.emerald],
    ["Status",       "✅  PASS",T.emerald],
    ["Time Taken",   "42 min 18 sec", T.white],
    ["Correct",      "34 questions", T.white],
    ["Wrong",        "4 questions",  T.rose],
    ["Skipped",      "2 questions",  T.amber],
    ["Tab Switches", "1 detected",   T.amber],
  ];
  resultData.forEach(([k,v,c],i) => {
    const y = 2.8 + i * 0.47;
    sl.addText(k,{x:0.65,y,w:2.5,h:0.4, fontSize:11.5,color:T.gray,fontFace:"Segoe UI"});
    sl.addText(v,{x:3.0,y,w:2.5,h:0.4,  fontSize:11.5,bold:true,color:c,fontFace:"Segoe UI"});
  });

  // Per-question log
  glass(sl, 5.95, 2.0, 7.4, 4.75, T.cyan, {alpha:65});
  sl.addText("📋 Per-Question Log",{x:6.15,y:2.1,w:7.0,h:0.5,
    fontSize:15,bold:true,color:T.cyan,fontFace:"Segoe UI"});
  neonLine(sl,6.15,2.65,6.9,T.cyan);

  // Header
  ["Q#","Your Answer","Correct Answer","Result"].forEach((h,i)=>{
    const xOff=[0.1,0.65,2.6,4.9];
    sl.addText(h,{x:6.1+xOff[i],y:2.72,w:[0.55,2.1,2.4,1.4][i],h:0.35,
      fontSize:9,bold:true,color:T.cyan,fontFace:"Segoe UI"});
  });
  neonLine(sl,6.15,3.1,6.85,T.border);

  const qLog=[
    [1,"B","B","✅"],
    [2,"A","C","❌"],
    [3,"D","D","✅"],
    [4,"—","B","⏭"],
    [5,"C","C","✅"],
    [6,"B","A","❌"],
  ];
  const resultColor={"✅":T.emerald,"❌":T.rose,"⏭":T.amber};
  qLog.forEach(([n,ya,ca,res],i)=>{
    const y=3.18+i*0.52;
    const bg2 = i%2===0 ? T.bg2 : T.bg1;
    sl.addShape(prs.ShapeType.rect,{x:5.95,y,w:7.4,h:0.46,
      fill:{color:bg2,alpha:50},line:{type:"none"}});
    [[n,0.1],[ya,0.65],[ca,2.6],[res,4.9]].forEach(([v,xOff],ci)=>{
      sl.addText(`${v}`,{x:6.05+xOff,y,w:[0.55,2.1,2.4,1.4][ci],h:0.46,
        valign:"middle",fontSize:11.5,
        color: ci===3 ? resultColor[res] : T.white,
        fontFace:"Segoe UI", bold:ci===3});
    });
  });

  sl.addText("Admin toggle controls: Show Correct Answers  ·  Show Detailed Log  ·  Per-exam settings",{
    x:0.45,y:7.0,w:12.5,h:0.35, align:"center",
    fontSize:9.5,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ─── SLIDE 9 · AI RECOMMENDATIONS ────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 12.5, 1.5, 5.0, T.purple, 12);
  orb(sl, 0.5, 6.5, 3.0, T.cyan, 8);

  heading(sl,
    "AI-Powered Student Recommendations",
    "Gemini AI analyses every student's history to recommend their next exam intelligently.",
    "✦  AI ENGINE", T.purple
  );

  // How it works flow
  const steps = [
    {n:"01", icon:"📊", t:"History Intake",     b:"Student completes exams. Scores, time taken, correct answers recorded per topic.", color:T.accent},
    {n:"02", icon:"🧠", t:"Gemini Analysis",     b:"AI analyses topic affinities, weak areas, and performance trend over all results.", color:T.purple},
    {n:"03", icon:"🎯", t:"Smart Match",          b:"Algorithm matches the student's profile to available exams by topics and difficulty.", color:T.cyan},
    {n:"04", icon:"✨", t:"Personalised Feed",   b:"Student dashboard shows recommended exams — always relevant, never generic.", color:T.emerald},
  ];

  steps.forEach((s,i) => {
    const x = 0.4 + i * 3.25;
    glass(sl, x, 2.1, 3.05, 3.5, s.color, {alpha:65});
    orb(sl, x+0.8, 2.55, 0.9, s.color, 18);
    sl.addShape(prs.ShapeType.roundRect,{x:x+0.2,y:2.2,w:0.55,h:0.38,rectRadius:0.06,
      fill:{color:s.color,alpha:20},line:{color:s.color,pt:1}});
    sl.addText(s.n,{x:x+0.2,y:2.2,w:0.55,h:0.38,
      align:"center",valign:"middle",fontSize:10,bold:true,color:s.color,fontFace:"Segoe UI"});
    sl.addText(s.icon,{x,y:2.65,w:3.05,h:0.8, align:"center",fontSize:24});
    neonLine(sl, x+0.25, 3.58, 2.55, s.color);
    sl.addText(s.t,{x:x+0.1,y:3.7,w:2.85,h:0.48,
      align:"center",fontSize:13,bold:true,color:T.white,fontFace:"Segoe UI"});
    sl.addText(s.b,{x:x+0.1,y:4.22,w:2.85,h:1.25,
      align:"center",fontSize:10.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.3});
  });

  // Arrows between steps
  [3.47, 6.72, 9.97].forEach(x => {
    sl.addText("▶",{x,y:3.4,w:0.35,h:0.4, align:"center", fontSize:16, color:T.gray});
  });

  // Insight strip
  glass(sl, 0.4, 5.85, 12.55, 1.35, T.purple, {alpha:55});
  sl.addText("🔍  Admin Visibility",{x:0.65,y:5.95,w:3.5,h:0.45,
    fontSize:13,bold:true,color:T.purple,fontFace:"Segoe UI"});
  const adminInsights = [
    "Topic-level weak spots across student cohort",
    "Per-student engagement and attempt frequency",
    "Cohort-wide pass/fail ratio by exam",
    "AI recommendation acceptance rate",
  ];
  adminInsights.forEach((insight,i)=>{
    const col = i%2===0?4.2:8.4;
    const row = i<2?6.02:6.52;
    sl.addShape(prs.ShapeType.ellipse,{x:col,y:row+0.09,w:0.13,h:0.13,
      fill:{color:T.purple},line:{type:"none"}});
    sl.addText(insight,{x:col+0.22,y:row,w:4.0,h:0.38,
      fontSize:11,color:T.white,fontFace:"Segoe UI"});
  });
}

// ─── SLIDE 10 · ADMIN ANALYTICS DASHBOARD ────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);
  orb(sl, 10.5, 4.0, 5.0, T.emerald, 9);

  heading(sl,
    "Admin Results & Analytics",
    "High-level workspace intelligence — aggregated exam performance at a glance.",
    "✦  ADMIN ANALYTICS", T.emerald
  );

  // KPI cards
  const kpis = [
    {v:"1,248", l:"Total Attempts",       icon:"📝", color:T.accent},
    {v:"74.3 %",l:"Avg. Score",           icon:"📊", color:T.emerald},
    {v:"89 %",  l:"Pass Rate",            icon:"✅", color:T.emerald},
    {v:"38 min",l:"Avg. Time Taken",      icon:"⏱️", color:T.amber},
    {v:"312",   l:"Students Enrolled",    icon:"🎓", color:T.cyan},
    {v:"8",     l:"Active Exams",         icon:"📅", color:T.purple},
  ];

  kpis.forEach((k,i)=>{
    const x = 0.4 + (i%3)*4.38;
    const y = i<3 ? 2.05 : 4.1;
    glass(sl, x, y, 4.1, 1.65, k.color, {alpha:60});
    orb(sl, x+3.4, y+0.2, 1.0, k.color, 15);
    sl.addText(k.icon,{x:x+0.2,y:y+0.2,w:0.65,h:0.65,align:"center",fontSize:22});
    sl.addText(k.v,{x:x+0.95,y:y+0.18,w:3.0,h:0.75,
      fontSize:26,bold:true,color:k.color,fontFace:"Segoe UI"});
    sl.addText(k.l,{x:x+0.95,y:y+0.9,w:3.0,h:0.45,
      fontSize:11,color:T.gray,fontFace:"Segoe UI"});
  });

  // Teacher-view strip: per-exam result table
  glass(sl, 0.4, 6.0, 12.55, 1.25, T.border, {alpha:60, pt:0.8});
  sl.addText("📋 Teacher sees per-exam:",{x:0.6,y:6.08,w:3.5,h:0.4,
    fontSize:11,bold:true,color:T.white,fontFace:"Segoe UI"});
  const teacherCols=[
    "Student Name","Score","% Score","Pass/Fail","Time Taken","Submission Date"
  ];
  teacherCols.forEach((c,i)=>{
    sl.addText("·  "+c,{x:4.1+i*1.5,y:6.08,w:1.5,h:0.4,valign:"middle",
      fontSize:10,color:T.gray,fontFace:"Segoe UI"});
  });
  sl.addText("All results exported on-demand  ·  Filterable by exam, date, or student",{
    x:0.6,y:6.55,w:12,h:0.55,
    fontSize:10,color:T.gray,fontFace:"Segoe UI",italic:true});
}

// ─── SLIDE 11 · CTA ───────────────────────────────────────────────────────────
{
  const sl = prs.addSlide();
  bg(sl);

  // Full-page background glow
  orb(sl, 4.8, 2.5, 8.0, T.accent, 14);
  orb(sl, 10.0, 5.0, 4.5, T.purple, 10);
  orb(sl, 0.5, 6.0, 3.0, T.cyan, 8);

  // Grid overlay
  for(let i=0;i<14;i++){
    sl.addShape(prs.ShapeType.rect,{x:i*1.0,y:0,w:0.006,h:"100%",
      fill:{color:T.white,alpha:2},line:{type:"none"}});
  }

  sl.addText("Ready to Elevate Your",{x:0.8,y:1.1,w:11.7,h:1.0,
    align:"center",fontSize:40,bold:true,color:T.white,fontFace:"Segoe UI"});
  sl.addText("Exam Operations?",{x:0.8,y:2.05,w:11.7,h:1.0,
    align:"center",fontSize:40,bold:true,fontFace:"Segoe UI",color:T.cyan});

  neonLine(sl, 3.5, 3.2, 6.33, T.accent);

  sl.addText("ABCD Exam Hub combines every tool a workspace admin needs\nto run fair, smart, and scalable online examinations.",{
    x:1.5,y:3.4,w:10.3,h:1.1,
    align:"center",fontSize:14.5,color:T.gray,fontFace:"Segoe UI",lineSpacingMultiple:1.4});

  // CTA pill
  sl.addShape(prs.ShapeType.roundRect,{x:3.9,y:4.75,w:5.5,h:0.82,rectRadius:0.12,
    fill:{type:"gradient",gradType:"linear",angle:90,
          stops:[{position:0,color:T.accent},{position:100,color:T.purple}]},
    line:{type:"none"}
  });
  sl.addText("🚀  Request Workspace Access",{x:3.9,y:4.75,w:5.5,h:0.82,
    align:"center",valign:"middle",fontSize:15,bold:true,color:T.white,fontFace:"Segoe UI"});

  // Feature summary pills
  const tags=["Exam Builder","AI MCQ","Draft Save","Negative Marks","Result Engine","Tab Guard","3 Publish Modes","Analytics"];
  tags.forEach((t,i)=>{
    const x = 0.5 + (i%4)*3.28;
    const y = 5.9 + Math.floor(i/4)*0.52;
    sl.addShape(prs.ShapeType.roundRect,{x,y,w:3.0,h:0.38,rectRadius:0.06,
      fill:{color:T.bg2,alpha:75},line:{color:T.border,pt:1}});
    sl.addText("✦  "+t,{x,y,w:3.0,h:0.38,
      align:"center",valign:"middle",fontSize:10,color:T.gray,fontFace:"Segoe UI"});
  });

  sl.addText("abcdexamhub.app  ·  Contact your Super Admin",{
    x:0.5,y:7.1,w:12.3,h:0.35,
    align:"center",fontSize:9.5,color:T.gray,fontFace:"Segoe UI"});
}

// ─── SAVE ─────────────────────────────────────────────────────────────────────
prs.writeFile({fileName:"ABCD_ExamHub_Admin_Pitch_v2.pptx"})
  .then(() => console.log("✅  Saved: ABCD_ExamHub_Admin_Pitch_v2.pptx"))
  .catch(e  => console.error("❌  Error:", e));
