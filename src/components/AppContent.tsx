"use client";

import { useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import ProcessDrawApp from "./ProcessDrawApp";

const H = "'Fraunces', 'Georgia', serif";
const B = "'Outfit', 'Helvetica Neue', sans-serif";
const C = {
  bg: "#f6f3ee",
  surface: "#fff",
  text: "#2c2824",
  mid: "#6b6560",
  light: "#a09890",
  accent: "#3d8b8b",
  accentDk: "#2d6b6b",
  accentLt: "#e8f3f3",
  border: "#e5e0d8",
  warm: "#f0ebe3",
};

function PrimaryButton({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <button className="lp-primary-btn" style={style}>{children}</button>;
}

function LandingPage() {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = ["/images/hero-launch.jpg", "/images/hero-business.jpg", "/images/hero-team.jpg"];
  const caps = ["Build process flows visually", "Professional documentation in minutes", "Collaborate with your team"];

  useEffect(() => {
    const timer = setInterval(() => setImgIdx((index) => (index + 1) % imgs.length), 5000);
    return () => clearInterval(timer);
  }, [imgs.length]);

  const features = [
    { icon: "✏️", title: "Visual Canvas Builder", desc: "Add process steps, side inputs, outputs, and annotations from an intuitive canvas. No drawing skills or expensive software needed." },
    { icon: "📄", title: "Print-Ready Export", desc: "Export as high-resolution PNGs, automatically split at A4 page boundaries. Copy to clipboard or paste directly into documents." },
    { icon: "✍️", title: "Document-Ready Footer", desc: "Every export includes Prepared by / Checked by fields with signature lines and date — ready for controlled documentation." },
    { icon: "👥", title: "Role-Based Access", desc: "IT Admin, User, Approver, Viewer — each role sees exactly what they need. Built-in approval workflow for document control." },
    { icon: "📋", title: "Complete Audit Trail", desc: "Every action is logged: creation, edits, approvals, rejections. Immutable records for compliance and traceability." },
    { icon: "☁️", title: "Cloud-Based", desc: "Diagrams saved securely in the cloud. Access from any device, manage your team, never lose work." },
  ];
  const useCases = [
    { title: "Pharmaceutical Manufacturing", desc: "BPCR documentation, equipment qualification flows, cleaning validation sequences" },
    { title: "Chemical Processing", desc: "Reaction pathways, distillation sequences, batch processing workflows" },
    { title: "Food & Beverage", desc: "Production line flows, HACCP process diagrams, quality control checkpoints" },
    { title: "General Manufacturing", desc: "Assembly line documentation, process optimization, standard operating procedures" },
  ];
  const steps = [
    { img: "/images/hero-launch.jpg", step: "01", title: "Build Your Flow", desc: "Add process steps from the canvas. Click + to add equipment blocks, side inputs, quality checkpoints, and annotations between steps." },
    { img: "/images/hero-business.jpg", step: "02", title: "Review & Approve", desc: "Finalize the diagram, submit for approval. Approvers can review and sign off. Full audit trail tracks every change." },
    { img: "/images/hero-team.jpg", step: "03", title: "Export & Document", desc: "Export as print-ready PNG with signature footer. Auto-splits for multi-page A4. Paste directly into your documentation." },
  ];
  const demos = [
    { code: "demo_user", role: "User", desc: "Create diagrams, submit for approval", color: C.accent },
    { code: "demo_approver", role: "Approver", desc: "Review and approve submitted diagrams", color: "#d4a040" },
    { code: "demo_admin", role: "IT Admin", desc: "Manage users, view audit trail", color: "#6a5acd" },
    { code: "demo_viewer", role: "Viewer", desc: "View approved diagrams (read-only)", color: "#8a8078" },
  ];

  return (
    <div className="lp-root">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .lp-root{min-height:100vh;background:${C.bg};font-family:${B};color:${C.text};overflow-x:hidden}.lp-shell{max-width:1200px;margin:0 auto;padding-left:40px;padding-right:40px}.lp-nav{display:flex;align-items:center;justify-content:space-between;padding-top:16px;padding-bottom:16px}.lp-logo{display:flex;align-items:baseline;gap:10px}.lp-logo-main{font-size:22px;font-weight:700;font-family:${H}}.lp-logo-sub{font-size:10px;color:${C.light};letter-spacing:1.5px;text-transform:uppercase}.lp-outline-btn{background:none;border:1.5px solid ${C.accent};color:${C.accent};border-radius:8px;padding:8px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:${B};transition:all .2s}.lp-outline-btn:hover{background:${C.accent};color:#fff}.lp-primary-btn{background:${C.accent};border:none;color:#fff;border-radius:10px;padding:14px 36px;font-size:15px;font-weight:600;cursor:pointer;font-family:${B};box-shadow:0 4px 20px rgba(61,139,139,.3);transition:all .2s}.lp-primary-btn:hover{background:${C.accentDk}}.lp-hero{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:60px;padding-top:60px;padding-bottom:80px}.lp-hero-copy{max-width:540px}.lp-hero h1{font-size:48px;font-weight:700;font-family:${H};line-height:1.15;margin:0 0 20px;letter-spacing:-.03em}.lp-accent{color:${C.accent}}.lp-lead{font-size:17px;color:${C.mid};line-height:1.7;margin:0 0 36px}.lp-cta-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.lp-small-note{font-size:13px;color:${C.light}}.lp-hero-visual{position:relative;height:380px;min-width:0}.lp-hero-visual img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;border-radius:16px;transition:opacity 1s ease-in-out}.lp-carousel-caption{position:absolute;bottom:-12px;left:20px;right:20px;background:${C.surface};border-radius:10px;padding:10px 18px;box-shadow:0 2px 12px rgba(44,40,36,.08);border:1px solid ${C.border};display:flex;align-items:center;gap:12px}.lp-dots{display:flex;gap:6px}.lp-dot{width:8px;height:8px;border-radius:50%;cursor:pointer;transition:all .3s}.lp-caption-text{font-size:12px;color:${C.mid};font-weight:500}.lp-section{padding-top:72px;padding-bottom:72px}.lp-section.alt{background:${C.surface};border-top:1px solid ${C.border};border-bottom:1px solid ${C.border}}.lp-section-heading{text-align:center;margin-bottom:52px}.lp-section-heading h2{font-size:32px;font-weight:700;font-family:${H};margin:0 0 12px;letter-spacing:-.025em}.lp-section-heading p{font-size:15px;color:${C.mid};max-width:560px;margin:0 auto;line-height:1.6}.lp-grid{display:grid;gap:28px}.lp-features{grid-template-columns:repeat(3,minmax(0,1fr))}.lp-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:40px}.lp-usecases{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.lp-demos{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.lp-card{padding:28px 24px;border-radius:14px;background:${C.bg};border:1px solid ${C.border};transition:all .2s}.lp-card:hover{border-color:${C.accent};box-shadow:0 4px 20px rgba(61,139,139,.08)}.lp-feature-icon{font-size:24px;margin-bottom:12px}.lp-card-title{font-size:16px;font-weight:600;margin-bottom:8px}.lp-card-desc{font-size:13px;color:${C.mid};line-height:1.6}.lp-step{text-align:center}.lp-step-img{width:100%;height:200px;border-radius:14px;overflow:hidden;background:${C.warm};margin-bottom:20px;display:flex;align-items:center;justify-content:center}.lp-step-img img{width:85%;height:85%;object-fit:contain}.lp-step-num{font-size:36px;font-weight:700;color:${C.accentLt};font-family:${H};margin-bottom:4px}.lp-step-title{font-size:18px;font-weight:600;margin-bottom:8px}.lp-usecase{padding:20px 18px;border-radius:10px;border:1px solid ${C.border};background:${C.bg}}.lp-usecase-title{font-size:14px;font-weight:600;margin-bottom:6px}.lp-demo-wrap{max-width:880px;margin:0 auto;text-align:center}.lp-demo-card{padding:20px 16px;border-radius:12px;border:1px solid ${C.border};background:${C.bg};text-align:center}.lp-demo-role{font-size:14px;font-weight:700;margin-bottom:4px}.lp-demo-desc{font-size:11px;color:${C.mid};line-height:1.5;margin-bottom:12px;min-height:32px}.lp-demo-user{font-size:11px;color:${C.light};margin-bottom:12px}.lp-demo-btn{border:none;color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:${B};width:100%}.lp-cta-section{padding-top:64px;padding-bottom:80px;text-align:center}.lp-cta-box{max-width:640px;margin:0 auto;background:${C.surface};border-radius:20px;padding:48px 40px;border:1px solid ${C.border};box-shadow:0 4px 24px rgba(44,40,36,.06)}.lp-cta-box h2{font-size:28px;font-weight:700;font-family:${H};margin:0 0 12px}.lp-cta-box p{font-size:14px;color:${C.mid};margin:0 0 28px;line-height:1.6}.lp-footer{border-top:1px solid ${C.border};padding-top:24px;padding-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:16px}.lp-footer span{font-size:12px;color:${C.light}}
        @media(max-width:980px){.lp-hero{grid-template-columns:1fr;gap:36px;padding-top:36px;padding-bottom:56px}.lp-hero-copy{max-width:720px;text-align:center;margin:0 auto}.lp-cta-row{justify-content:center}.lp-hero-visual{height:320px;max-width:620px;width:100%;margin:0 auto}.lp-features{grid-template-columns:repeat(2,minmax(0,1fr))}.lp-steps{grid-template-columns:1fr}.lp-usecases{grid-template-columns:repeat(2,minmax(0,1fr))}.lp-demos{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:640px){.lp-shell{padding-left:18px;padding-right:18px}.lp-nav{padding-top:14px;padding-bottom:14px}.lp-logo{gap:6px;flex-direction:column;align-items:flex-start}.lp-logo-main{font-size:20px}.lp-logo-sub{font-size:9px}.lp-outline-btn{padding:8px 16px;font-size:12px}.lp-hero{padding-top:22px;padding-bottom:44px;gap:28px}.lp-hero-copy{text-align:left}.lp-hero h1{font-size:38px;line-height:1.08;margin-bottom:16px}.lp-lead{font-size:15px;line-height:1.65;margin-bottom:26px}.lp-cta-row{align-items:stretch;justify-content:flex-start;flex-direction:column}.lp-primary-btn{width:100%;padding:13px 22px}.lp-small-note{font-size:12px;line-height:1.45}.lp-hero-visual{height:240px}.lp-carousel-caption{left:8px;right:8px;bottom:-10px;padding:9px 12px}.lp-caption-text{font-size:11px}.lp-section{padding-top:48px;padding-bottom:48px}.lp-section-heading{margin-bottom:28px;text-align:left}.lp-section-heading h2{font-size:28px}.lp-section-heading p{font-size:14px;margin:0}.lp-features,.lp-steps,.lp-usecases,.lp-demos{grid-template-columns:1fr;gap:16px}.lp-card{padding:20px 18px}.lp-step{text-align:left}.lp-step-img{height:170px}.lp-step-num{font-size:30px}.lp-demo-wrap{text-align:left}.lp-demo-card{text-align:left}.lp-demo-desc{min-height:auto}.lp-cta-section{padding-top:42px;padding-bottom:56px}.lp-cta-box{padding:28px 20px;border-radius:16px;text-align:left}.lp-cta-box h2{font-size:25px}.lp-footer{flex-direction:column;align-items:flex-start;padding-top:20px;padding-bottom:20px}.lp-footer span{font-size:11px}}
        @media(max-width:380px){.lp-hero h1{font-size:34px}.lp-hero-visual{height:210px}.lp-section-heading h2{font-size:25px}.lp-card-title{font-size:15px}}
      `}</style>
      <nav className="lp-shell lp-nav"><div className="lp-logo"><span className="lp-logo-main">ProcessDraw</span><span className="lp-logo-sub">KJR Labs</span></div><SignInButton mode="modal"><button className="lp-outline-btn">Sign In</button></SignInButton></nav>
      <section className="lp-shell lp-hero"><div className="lp-hero-copy"><h1>Process Flow Diagrams,<br /><span className="lp-accent">Made Simple</span></h1><p className="lp-lead">Create clean, standardized process flow diagrams in minutes — not hours. Built for manufacturing teams who need professional documentation without the complexity of CAD software.</p><div className="lp-cta-row"><SignInButton mode="modal"><PrimaryButton>Sign In</PrimaryButton></SignInButton><span className="lp-small-note">Your administrator will set up your account</span></div></div><div className="lp-hero-visual">{imgs.map((src, index) => <img key={src} src={src} alt={caps[index]} style={{ opacity: index === imgIdx ? 1 : 0 }} />)}<div className="lp-carousel-caption"><div className="lp-dots">{imgs.map((_, index) => <button key={index} aria-label={`Show slide ${index + 1}`} className="lp-dot" onClick={() => setImgIdx(index)} style={{ background: index === imgIdx ? C.accent : C.border, border: 0 }} />)}</div><span className="lp-caption-text">{caps[imgIdx]}</span></div></div></section>
      <section className="lp-section alt"><div className="lp-shell"><div className="lp-section-heading"><h2>Everything You Need</h2><p>Built for teams who create process documentation — with collaboration, approval workflows, and audit trails built in.</p></div><div className="lp-grid lp-features">{features.map((feature) => <div key={feature.title} className="lp-card"><div className="lp-feature-icon">{feature.icon}</div><div className="lp-card-title">{feature.title}</div><div className="lp-card-desc">{feature.desc}</div></div>)}</div></div></section>
      <section className="lp-shell lp-section"><div className="lp-section-heading"><h2>How It Works</h2><p>Three steps to a print-ready process flow diagram</p></div><div className="lp-grid lp-steps">{steps.map((step) => <div key={step.step} className="lp-step"><div className="lp-step-img"><img src={step.img} alt={step.title} /></div><div className="lp-step-num">{step.step}</div><div className="lp-step-title">{step.title}</div><div className="lp-card-desc">{step.desc}</div></div>)}</div></section>
      <section className="lp-section alt"><div className="lp-shell"><div className="lp-section-heading"><h2>Built for Manufacturing Teams</h2><p>Process flow diagrams for any industry that needs controlled documentation</p></div><div className="lp-grid lp-usecases">{useCases.map((useCase) => <div key={useCase.title} className="lp-usecase"><div className="lp-usecase-title">{useCase.title}</div><div className="lp-card-desc">{useCase.desc}</div></div>)}</div></div></section>
      <section className="lp-section alt"><div className="lp-shell lp-demo-wrap"><div className="lp-section-heading"><h2>Try It Yourself</h2><p>Explore ProcessDraw with a demo account — no sign-up required. Data resets daily.<br />Password for all demo accounts: <strong>demo1234</strong></p></div><div className="lp-grid lp-demos">{demos.map((demo) => <div key={demo.code} className="lp-demo-card"><div className="lp-demo-role" style={{ color: demo.color }}>{demo.role}</div><div className="lp-demo-desc">{demo.desc}</div><div className="lp-demo-user">Username: <strong style={{ color: C.text }}>{demo.code}</strong></div><SignInButton mode="modal"><button className="lp-demo-btn" style={{ background: demo.color }}>Try as {demo.role}</button></SignInButton></div>)}</div></div></section>
      <section className="lp-shell lp-cta-section"><div className="lp-cta-box"><h2>Ready to simplify your process documentation?</h2><p>Your administrator creates your account. Sign in with your employee credentials to get started.</p><SignInButton mode="modal"><PrimaryButton>Sign In</PrimaryButton></SignInButton></div></section>
      <footer className="lp-shell lp-footer"><span>ProcessDraw by KJR Labs</span><span>Process flow diagrams for manufacturing teams</span></footer>
    </div>
  );
}

export default function AppContent() {
  return (
    <>
      <AuthLoading><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee" }}><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" /><div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 700, color: "#2c2824", fontFamily: "'Fraunces', Georgia, serif" }}>ProcessDraw</div><div style={{ fontSize: 13, color: "#b5ada5", marginTop: 8, fontFamily: "'Outfit', sans-serif" }}>Loading...</div></div></div></AuthLoading>
      <Unauthenticated><LandingPage /></Unauthenticated>
      <Authenticated><ProcessDrawApp /></Authenticated>
    </>
  );
}
