"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { apiCall } from "@/lib/api";

const B = "'Outfit', 'Helvetica Neue', sans-serif";
const C = { bg: "#f6f3ee", surface: "#fff", text: "#2c2824", mid: "#8a8078", border: "#e5e0d8", accent: "#3d8b8b", danger: "#c47a6a" };

const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: B, outline: "none", marginBottom: 10 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 10.5, color: C.mid, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 };

export function ChangePasswordForm({ onDone, forced }: { onDone: () => void; forced?: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (newPassword !== confirm) return setError("New passwords do not match");
    if (newPassword.length < 8) return setError("New password must be at least 8 characters");
    setBusy(true);
    try {
      await apiCall("/api/account/password", "POST", { currentPassword, newPassword });
      onDone();
    } catch (err: any) {
      setError(err?.message || "Password change failed");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <label style={labelStyle}>{forced ? "Temporary password" : "Current password"}</label>
      <input style={inputStyle} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoFocus autoComplete="current-password" />
      <label style={labelStyle}>New password</label>
      <input style={inputStyle} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
      <label style={labelStyle}>Confirm new password</label>
      <input style={inputStyle} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 10, padding: "7px 10px", background: "#fdf0ee", borderRadius: 8 }}>{error}</div>}
      <button type="submit" disabled={busy} style={{ width: "100%", background: C.accent, border: "none", color: "#fff", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: busy ? "wait" : "pointer", fontFamily: B, opacity: busy ? 0.7 : 1 }}>
        {busy ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}

/** Full-screen gate shown when the account has mustChangePassword set. */
export function ForcedPasswordChange({ userName, onDone }: { userName?: string; onDone: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: C.bg, fontFamily: B, padding: 16 }}>
      <div style={{ width: "min(400px, 100%)", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: "0 8px 32px rgba(44,40,36,0.1)" }}>
        <h2 style={{ margin: "0 0 6px", fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, color: C.text }}>Set a new password</h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: C.mid, lineHeight: 1.5 }}>
          {userName ? `Hi ${userName}. ` : ""}Your password was set by an administrator. Choose your own before continuing.
        </p>
        <ChangePasswordForm onDone={onDone} forced />
        <button onClick={() => signOut({ callbackUrl: "/" })} style={{ width: "100%", marginTop: 10, background: "none", border: `1px solid ${C.border}`, color: C.mid, borderRadius: 8, padding: "9px 0", fontSize: 12.5, cursor: "pointer", fontFamily: B }}>Sign out</button>
      </div>
    </div>
  );
}

export default function AccountMenu({ name, email, role }: { name?: string; email?: string; role?: string }) {
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) { setOpen(false); setChanging(false); }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); setChanging(false); }
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", fontFamily: B }}>
      <button
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
        style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.accent, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: B }}
      >
        {initial}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: changing ? 300 : 230, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 18px 60px rgba(44,40,36,.18)", zIndex: 60, padding: 14 }}>
          <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{name || "Account"}</div>
            <div style={{ fontSize: 11.5, color: C.mid, marginTop: 2 }}>{email}{role ? ` · ${role.replace("_", " ")}` : ""}</div>
          </div>
          {changing ? (
            <ChangePasswordForm onDone={() => { setChanging(false); setOpen(false); }} />
          ) : (
            <>
              <button onClick={() => setChanging(true)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: C.text, fontSize: 13, padding: "8px 6px", cursor: "pointer", fontFamily: B, borderRadius: 6 }}>Change password</button>
              <button onClick={() => signOut({ callbackUrl: "/" })} style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: C.danger, fontSize: 13, padding: "8px 6px", cursor: "pointer", fontFamily: B, borderRadius: 6 }}>Sign out</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
