"use client";

import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import ProcessDrawApp from "./ProcessDrawApp";

const HEADING = "'Fraunces', 'Georgia', serif";
const BODY = "'Outfit', 'Helvetica Neue', sans-serif";

const C = {
  bg: "#f6f3ee",
  surface: "#ffffff",
  text: "#2c2824",
  textMid: "#6b6560",
  textLight: "#a09890",
  accent: "#3d8b8b",
  accentDark: "#2d6b6b",
  accentLight: "#e8f3f3",
  border: "#e5e0d8",
  warm: "#f0ebe3",
};

function LandingPage() {
  const [imageIdx, setImageIdx] = useState(0);
  const images = ["/images/hero-launch.jpg", "/images/hero-business.jpg", "/images/hero-team.jpg"];
  const captions = [
    "Launch your documentation workflow",
    "Professional process diagrams in minutes",
    "Built for pharma manufacturing teams",
  ];

  useEffect(() => {
    const timer = setInterval(() => setImageIdx((p) => (p + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: "⬜", title: "Canvas-First Builder", desc: "Add process steps, side inputs, IPQC checkpoints — all from an intuitive canvas. No drawing skills needed." },
    { icon: "📄", title: "A4 Auto-Split Export", desc: "Export as print-ready PNGs, automatically split at A4 page boundaries. Paste directly into Word/BPCR documents." },
    { icon: "✍️", title: "Signature-Ready Footer", desc: "Every export includes Prepared by / Checked by fields with signature lines and date — GMP documentation ready." },
    { icon: "👥", title: "Role-Based Access", desc: "IT Admin, User, Approver, Viewer — each role sees exactly what they need. Submit diagrams for approval." },
    { icon: "📋", title: "Full Audit Trail", desc: "Every action is logged: creation, edits, approvals, rejections. Immutable records for compliance." },
    { icon: "☁️", title: "Cloud Save", desc: "Diagrams saved securely in the cloud. Access from any device, share with your team, never lose work." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: BODY, color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, fontFamily: HEADING, color: C.text }}>ProcessDraw</span>
          <span style={{ fontSize: 10, color: C.textLight, letterSpacing: 1.5, textTransform: "uppercase" }}>KJR Labs</span>
        </div>
        <SignInButton mode="modal">
          <button style={{
            background: "none", border: `1.5px solid ${C.accent}`, color: C.accent, borderRadius: 8,
            padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY,
            transition: "all 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.accent; }}
          >Sign In</button>
        </SignInButton>
      </nav>

      {/* Hero */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", padding: "60px 40px 80px", gap: 60 }}>
        <div style={{ flex: 1, maxWidth: 520 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
            For Pharma API Manufacturing
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 700, fontFamily: HEADING, lineHeight: 1.15, color: C.text, margin: "0 0 20px" }}>
            Process Flow Diagrams,<br />
            <span style={{ color: C.accent }}>Made Simple</span>
          </h1>
          <p style={{ fontSize: 17, color: C.textMid, lineHeight: 1.7, margin: "0 0 36px" }}>
            Create clean, standardized PFDs for BPCR documentation in minutes — not hours.
            No design skills needed. Export print-ready diagrams with signature lines, ready for GMP compliance.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SignInButton mode="modal">
              <button style={{
                background: C.accent, border: "none", color: "#fff", borderRadius: 10,
                padding: "14px 36px", fontSize: 15, fontWeight: 600, cursor: "pointer",
                fontFamily: BODY, boxShadow: "0 4px 20px rgba(61,139,139,0.3)",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.accentDark}
                onMouseLeave={(e) => e.currentTarget.style.background = C.accent}
              >Sign In</button>
            </SignInButton>
            <span style={{ fontSize: 13, color: C.textLight }}>Contact your IT Admin for access</span>
          </div>
        </div>

        {/* Hero illustration with crossfade */}
        <div style={{ flex: 1, maxWidth: 540, position: "relative", height: 380 }}>
          {images.map((src, i) => (
            <img key={src} src={src} alt={captions[i]}
              style={{
                position: "absolute", top: 0, right: 0, width: "100%", height: "100%",
                objectFit: "contain", borderRadius: 16,
                opacity: i === imageIdx ? 1 : 0,
                transition: "opacity 1s ease-in-out",
              }} />
          ))}
          {/* Caption */}
          <div style={{
            position: "absolute", bottom: -12, left: 20, right: 20,
            background: C.surface, borderRadius: 10, padding: "10px 18px",
            boxShadow: "0 2px 12px rgba(44,40,36,0.08)", border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {images.map((_, i) => (
                <div key={i} onClick={() => setImageIdx(i)} style={{
                  width: 8, height: 8, borderRadius: "50%", cursor: "pointer",
                  background: i === imageIdx ? C.accent : C.border,
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>{captions[imageIdx]}</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "72px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: HEADING, color: C.text, margin: "0 0 12px" }}>
              Built for Pharma Documentation
            </h2>
            <p style={{ fontSize: 15, color: C.textMid, maxWidth: 520, margin: "0 auto" }}>
              Every feature designed around how pharmaceutical manufacturing teams actually work with process flow diagrams.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: "28px 24px", borderRadius: 14, background: C.bg,
                border: `1px solid ${C.border}`, transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = "0 4px 20px rgba(61,139,139,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: BODY }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — using remaining illustrations */}
      <section style={{ padding: "72px 40px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: HEADING, color: C.text, margin: "0 0 12px" }}>How It Works</h2>
          <p style={{ fontSize: 15, color: C.textMid }}>Three steps to a print-ready process flow diagram</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
          {[
            { img: "/images/hero-launch.jpg", step: "01", title: "Build Your Flow", desc: "Add process steps from the canvas. Click + to add equipment blocks, side inputs, IPQC checkpoints, and connecting annotations." },
            { img: "/images/hero-business.jpg", step: "02", title: "Review & Finalize", desc: "Click END to freeze the diagram. Review the layout with A4 page guides. Submit for approval if your organization requires it." },
            { img: "/images/hero-team.jpg", step: "03", title: "Export & Use", desc: "Export as print-ready PNG (auto-split for multi-page). Copy to clipboard. Paste into Word documents with signature-ready footer." },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: "100%", height: 200, borderRadius: 14, overflow: "hidden",
                background: C.warm, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={s.img} alt={s.title} style={{ width: "85%", height: "85%", objectFit: "contain" }} />
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: C.accentLight, fontFamily: HEADING, marginBottom: 4 }}>{s.step}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 40px 80px", textAlign: "center" }}>
        <div style={{
          maxWidth: 640, margin: "0 auto", background: C.surface, borderRadius: 20,
          padding: "48px 40px", border: `1px solid ${C.border}`,
          boxShadow: "0 4px 24px rgba(44,40,36,0.06)",
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: HEADING, color: C.text, margin: "0 0 12px" }}>
            Ready to simplify your PFD workflow?
          </h2>
          <p style={{ fontSize: 14, color: C.textMid, margin: "0 0 28px" }}>
            Your IT Admin will create your account. Sign in with your employee code and password.
          </p>
          <SignInButton mode="modal">
            <button style={{
              background: C.accent, border: "none", color: "#fff", borderRadius: 10,
              padding: "14px 40px", fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: BODY, boxShadow: "0 4px 20px rgba(61,139,139,0.3)",
            }}>Sign In</button>
          </SignInButton>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${C.border}`, padding: "24px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <span style={{ fontSize: 12, color: C.textLight }}>ProcessDraw by KJR Labs</span>
        <span style={{ fontSize: 12, color: C.textLight }}>Built for Pharma API Manufacturing</span>
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

      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>

      <Authenticated>
        <ProcessDrawApp />
      </Authenticated>
    </>
  );
}
