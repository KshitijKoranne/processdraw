"use client";

import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import ProcessDrawApp from "./ProcessDrawApp";

const H = "'Fraunces', 'Georgia', serif";
const B = "'Outfit', 'Helvetica Neue', sans-serif";
const C = {
  bg: "#f6f3ee", surface: "#fff", text: "#2c2824", mid: "#6b6560",
  light: "#a09890", accent: "#3d8b8b", accentDk: "#2d6b6b",
  accentLt: "#e8f3f3", border: "#e5e0d8", warm: "#f0ebe3",
};

function LandingPage() {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = ["/images/hero-launch.jpg", "/images/hero-business.jpg", "/images/hero-team.jpg"];
  const caps = ["Build process flows visually", "Professional documentation in minutes", "Collaborate with your team"];

  useEffect(() => { const t = setInterval(() => setImgIdx((p) => (p + 1) % imgs.length), 5000); return () => clearInterval(t); }, []);

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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: B, color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, fontFamily: H }}>ProcessDraw</span>
          <span style={{ fontSize: 10, color: C.light, letterSpacing: 1.5, textTransform: "uppercase" }}>KJR Labs</span>
        </div>
        <SignInButton mode="modal">
          <button style={{ background: "none", border: `1.5px solid ${C.accent}`, color: C.accent, borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: B, transition: "all 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.accent; }}>
            Sign In
          </button>
        </SignInButton>
      </nav>

      {/* Hero */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", padding: "60px 40px 80px", gap: 60 }}>
        <div style={{ flex: 1, maxWidth: 520 }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, fontFamily: H, lineHeight: 1.15, margin: "0 0 20px" }}>
            Process Flow Diagrams,<br /><span style={{ color: C.accent }}>Made Simple</span>
          </h1>
          <p style={{ fontSize: 17, color: C.mid, lineHeight: 1.7, margin: "0 0 36px" }}>
            Create clean, standardized process flow diagrams in minutes — not hours. 
            Built for manufacturing teams who need professional documentation without the complexity of CAD software.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SignInButton mode="modal">
              <button style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 10, padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: B, boxShadow: "0 4px 20px rgba(61,139,139,0.3)", transition: "all 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.accentDk}
                onMouseLeave={(e) => e.currentTarget.style.background = C.accent}>
                Sign In
              </button>
            </SignInButton>
            <span style={{ fontSize: 13, color: C.light }}>Your administrator will set up your account</span>
          </div>
        </div>
        {/* Carousel */}
        <div style={{ flex: 1, maxWidth: 540, position: "relative", height: 380 }}>
          {imgs.map((src, i) => (
            <img key={src} src={src} alt={caps[i]} style={{ position: "absolute", top: 0, right: 0, width: "100%", height: "100%", objectFit: "contain", borderRadius: 16, opacity: i === imgIdx ? 1 : 0, transition: "opacity 1s ease-in-out" }} />
          ))}
          <div style={{ position: "absolute", bottom: -12, left: 20, right: 20, background: C.surface, borderRadius: 10, padding: "10px 18px", boxShadow: "0 2px 12px rgba(44,40,36,0.08)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {imgs.map((_, i) => (<div key={i} onClick={() => setImgIdx(i)} style={{ width: 8, height: 8, borderRadius: "50%", cursor: "pointer", background: i === imgIdx ? C.accent : C.border, transition: "all 0.3s" }} />))}
            </div>
            <span style={{ fontSize: 12, color: C.mid, fontWeight: 500 }}>{caps[imgIdx]}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "72px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: H, margin: "0 0 12px" }}>Everything You Need</h2>
            <p style={{ fontSize: 15, color: C.mid, maxWidth: 520, margin: "0 auto" }}>Built for teams who create process documentation — with collaboration, approval workflows, and audit trails built in.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: "28px 24px", borderRadius: 14, background: C.bg, border: `1px solid ${C.border}`, transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = "0 4px 20px rgba(61,139,139,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: "72px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: H, margin: "0 0 12px" }}>How It Works</h2>
          <p style={{ fontSize: 15, color: C.mid }}>Three steps to a print-ready process flow diagram</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {[
            { img: "/images/hero-launch.jpg", step: "01", title: "Build Your Flow", desc: "Add process steps from the canvas. Click + to add equipment blocks, side inputs, quality checkpoints, and annotations between steps." },
            { img: "/images/hero-business.jpg", step: "02", title: "Review & Approve", desc: "Finalize the diagram, submit for approval. Approvers can review and sign off. Full audit trail tracks every change." },
            { img: "/images/hero-team.jpg", step: "03", title: "Export & Document", desc: "Export as print-ready PNG with signature footer. Auto-splits for multi-page A4. Paste directly into your documentation." },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: "100%", height: 200, borderRadius: 14, overflow: "hidden", background: C.warm, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={s.img} alt={s.title} style={{ width: "85%", height: "85%", objectFit: "contain" }} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: C.accentLt, fontFamily: H, marginBottom: 4 }}>{s.step}</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "64px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: H, margin: "0 0 12px" }}>Built for Manufacturing Teams</h2>
            <p style={{ fontSize: 14, color: C.mid }}>Process flow diagrams for any industry that needs controlled documentation</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {useCases.map((u, i) => (
              <div key={i} style={{ padding: "20px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{u.title}</div>
                <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.5 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try Demo */}
      <section style={{ padding: "64px 40px", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: H, margin: "0 0 8px" }}>Try It Yourself</h2>
          <p style={{ fontSize: 14, color: C.mid, margin: "0 0 8px" }}>Explore ProcessDraw with a demo account — no sign-up required. Data resets daily.</p>
          <p style={{ fontSize: 11, color: C.light, margin: "0 0 28px" }}>Password for all demo accounts: <strong style={{ color: C.mid }}>demo1234</strong></p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { code: "demo_user", role: "User", desc: "Create diagrams, submit for approval", color: C.accent },
              { code: "demo_approver", role: "Approver", desc: "Review and approve submitted diagrams", color: "#d4a040" },
              { code: "demo_admin", role: "IT Admin", desc: "Manage users, view audit trail", color: "#6a5acd" },
              { code: "demo_viewer", role: "Viewer", desc: "View approved diagrams (read-only)", color: "#8a8078" },
            ].map((d, i) => (
              <div key={i} style={{ padding: "20px 16px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: d.color, marginBottom: 4 }}>{d.role}</div>
                <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5, marginBottom: 12, minHeight: 32 }}>{d.desc}</div>
                <div style={{ fontSize: 11, color: C.light, marginBottom: 12 }}>Username: <strong style={{ color: C.text }}>{d.code}</strong></div>
                <SignInButton mode="modal">
                  <button style={{ background: d.color, border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: B, width: "100%" }}>
                    Try as {d.role}
                  </button>
                </SignInButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 40px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", background: C.surface, borderRadius: 20, padding: "48px 40px", border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(44,40,36,0.06)" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: H, margin: "0 0 12px" }}>Ready to simplify your process documentation?</h2>
          <p style={{ fontSize: 14, color: C.mid, margin: "0 0 28px" }}>Your administrator creates your account. Sign in with your employee credentials to get started.</p>
          <SignInButton mode="modal">
            <button style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 10, padding: "14px 40px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: B, boxShadow: "0 4px 20px rgba(61,139,139,0.3)" }}>Sign In</button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontSize: 12, color: C.light }}>ProcessDraw by KJR Labs</span>
        <span style={{ fontSize: 12, color: C.light }}>Process flow diagrams for manufacturing teams</span>
      </footer>
    </div>
  );
}

export default function AppContent() {
  return (
    <>
      <AuthLoading>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee" }}>
          <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2c2824", fontFamily: "'Fraunces', Georgia, serif" }}>ProcessDraw</div>
            <div style={{ fontSize: 13, color: "#b5ada5", marginTop: 8, fontFamily: "'Outfit', sans-serif" }}>Loading...</div>
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated><LandingPage /></Unauthenticated>
      <Authenticated><ProcessDrawApp /></Authenticated>
    </>
  );
}
