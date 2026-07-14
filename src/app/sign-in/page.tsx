"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const H = "'Fraunces', Georgia, serif";
const B = "'Outfit', system-ui, sans-serif";
const C = { bg: "#f6f3ee", surface: "#fff", text: "#2c2824", mid: "#8a8078", border: "#e5e0d8", accent: "#3d8b8b", danger: "#c47a6a" };

const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: B, outline: "none", marginBottom: 12 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, color: C.mid, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 };

export default function SignInPage() {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/setup").then((res) => res.json()).then((data) => setNeedsSetup(!!data.needsSetup)).catch(() => setNeedsSetup(false));
  }, []);

  const doSignIn = async (code: string, pass: string) => {
    const result = await signIn("credentials", { employeeCode: code, password: pass, redirect: false });
    if (result?.error) throw new Error("Invalid employee code or password");
    router.push("/");
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (needsSetup) {
        const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeCode, fullName, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Setup failed");
      }
      await doSignIn(employeeCode, password);
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, fontFamily: B, padding: 16 }}>
      <div style={{ width: "min(400px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: H, margin: 0 }}>ProcessDraw</h1>
          <p style={{ fontSize: 13, color: C.mid, margin: "6px 0 0" }}>
            {needsSetup === null ? "Loading..." : needsSetup ? "First-time setup — create the IT Admin account" : "Sign in with your employee code"}
          </p>
        </div>

        {needsSetup !== null && (
          <form onSubmit={handleSubmit} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: "0 8px 32px rgba(44,40,36,0.1)" }}>
            <label style={labelStyle} htmlFor="code">Employee Code</label>
            <input id="code" style={inputStyle} value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="e.g. EMP001" autoFocus autoComplete="username" />

            {needsSetup && (
              <>
                <label style={labelStyle} htmlFor="name">Full Name</label>
                <input id="name" style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </>
            )}

            <label style={labelStyle} htmlFor="password">Password</label>
            <input id="password" style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={needsSetup ? "Min 8 characters" : "Your password"} autoComplete={needsSetup ? "new-password" : "current-password"} />

            {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 12, padding: "8px 12px", background: "#fdf0ee", borderRadius: 8 }}>{error}</div>}

            <button type="submit" disabled={busy} style={{ width: "100%", background: C.accent, border: "none", color: "#fff", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: busy ? "wait" : "pointer", fontFamily: B, opacity: busy ? 0.7 : 1 }}>
              {busy ? "Please wait..." : needsSetup ? "Create Admin Account" : "Sign In"}
            </button>
            {!needsSetup && (
              <p style={{ fontSize: 11.5, color: C.mid, textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>
                Forgot your password? Ask your IT Admin to reset it.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
