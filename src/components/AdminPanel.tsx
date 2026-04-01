"use client";

import { useQuery, useMutation } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

const HEADING = "'Fraunces', 'Georgia', serif";
const BODY = "'Outfit', 'Helvetica Neue', sans-serif";
const C = { bg: "#f6f3ee", surface: "#ffffff", surfaceAlt: "#faf8f5", border: "#e5e0d8", text: "#2c2824", textMuted: "#8a8078", textLight: "#b5ada5", accent: "#3d8b8b", accentLight: "#e8f3f3", danger: "#c47a6a", success: "#5a9e7a" };
const ROLES = [
  { value: "it_admin", label: "IT Admin" },
  { value: "user", label: "User" },
  { value: "approver", label: "Approver" },
  { value: "viewer", label: "Viewer" },
];
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  user_created: { label: "User Created", color: "#3d8b8b" },
  user_login: { label: "Login", color: "#8a8078" },
  role_changed: { label: "Role Changed", color: "#d4a040" },
  diagram_created: { label: "Diagram Created", color: "#3d8b8b" },
  diagram_updated: { label: "Diagram Updated", color: "#6a8ab5" },
  diagram_deleted: { label: "Diagram Deleted", color: "#c47a6a" },
  diagram_submitted: { label: "Submitted", color: "#d4a040" },
  diagram_approved: { label: "Approved", color: "#5a9e7a" },
  diagram_rejected: { label: "Rejected", color: "#c47a6a" },
  employee_created: { label: "Employee Created", color: "#3d8b8b" },
};
const btnS = (bg: string, color: string, border?: string): any => ({ background: bg, color, border: border || "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", fontFamily: BODY, fontWeight: 500 });
const inputS: any = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: BODY, outline: "none", boxSizing: "border-box" };

function CreateEmployeeForm({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    if (!employeeCode.trim() || !fullName.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeCode: employeeCode.trim(), fullName: fullName.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create employee");
      } else {
        onSuccess(`Employee ${employeeCode} created. They can now sign in with their employee code and password.`);
        setEmployeeCode(""); setFullName(""); setPassword(""); setRole("user");
      }
    } catch (e: any) {
      setError(e.message || "Network error");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 28px", marginBottom: 28 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 20, fontFamily: HEADING }}>Create New Employee</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Employee Code</label>
          <input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="e.g. EMP001" style={inputS} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Rahul Sharma" style={inputS} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Temporary Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" type="password" style={inputS} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.textMuted, display: "block", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...inputS, cursor: "pointer" }}>
            {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
        </div>
      </div>
      {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 12, padding: "8px 12px", background: "#fdf0ee", borderRadius: 6 }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleCreate} disabled={loading} style={{ ...btnS(C.accent, "#fff"), opacity: loading ? 0.6 : 1, padding: "10px 28px" }}>
          {loading ? "Creating..." : "Create Employee"}
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.textLight, marginTop: 12, lineHeight: 1.5 }}>
        The employee will sign in using their employee code as username and the password you set.
        They should change their password after first login.
      </div>
    </div>
  );
}

export default function AdminPanel({ onBack, isFullScreen }: { onBack: () => void; isFullScreen?: boolean }) {
  const users = useQuery(api.users.listUsers) || [];
  const auditLogs = useQuery(api.auditLog.list, { limit: 200 }) || [];
  const updateRole = useMutation(api.users.updateUserRole);
  const toggleDisabled = useMutation(api.users.toggleDisabled);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "create" | "audit">("users");
  const [toast, setToast] = useState<string | null>(null);

  const handleRoleChange = async (userId: any, role: string) => {
    setUpdating(userId);
    try { await updateRole({ userId, role }); } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const handleToggleDisabled = async (userId: any, disabled: boolean) => {
    setUpdating(userId);
    try { await toggleDisabled({ userId, disabled }); } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const tabBtn = (id: string, label: string) => (
    <button onClick={() => setTab(id as any)} style={{
      background: tab === id ? C.accent : "none", color: tab === id ? "#fff" : C.textMuted,
      border: tab === id ? "none" : `1px solid ${C.border}`, borderRadius: 6,
      padding: "6px 16px", fontSize: 13, cursor: "pointer", fontFamily: BODY, fontWeight: 500,
    }}>{label}</button>
  );

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: 16 }}>
        {!isFullScreen && <button onClick={onBack} style={{ ...btnS(C.surfaceAlt, C.textMuted, `1px solid ${C.border}`), padding: "6px 14px", fontSize: 12 }}>← Back</button>}
        {isFullScreen && <span style={{ fontSize: 18, fontWeight: 700, fontFamily: HEADING, color: C.text }}>ProcessDraw</span>}
        <span style={{ fontSize: isFullScreen ? 14 : 20, fontWeight: isFullScreen ? 500 : 700, fontFamily: HEADING, color: isFullScreen ? C.textMuted : C.text }}>{isFullScreen ? "— Administration" : "Administration"}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {tabBtn("create", "Create Employee")}
          {tabBtn("users", "Users")}
          {tabBtn("audit", "Audit Log")}
          {isFullScreen && <div style={{ marginLeft: 8 }}><UserButton appearance={{ elements: { profileSectionPrimaryButton__danger: { display: "none" }, profileSectionContent__danger: { display: "none" } } }} /></div>}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", maxWidth: 960, margin: "0 auto", width: "100%" }}>

        {tab === "create" && (
          <CreateEmployeeForm onSuccess={(msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); setTab("users"); }} />
        )}

        {tab === "users" && (
          <>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
              <strong>IT Admin:</strong> Full access &nbsp;·&nbsp;
              <strong>User:</strong> Create/edit own diagrams &nbsp;·&nbsp;
              <strong>Approver:</strong> Review & approve &nbsp;·&nbsp;
              <strong>Viewer:</strong> Read-only
            </div>
            {users.map((user: any) => (
              <div key={user._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", marginBottom: 6, borderRadius: 10, background: user.disabled ? "#fdf5f3" : C.surface, border: `1px solid ${user.disabled ? "#e8c4bc" : C.border}`, opacity: user.disabled ? 0.7 : 1 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{user.name}</span>
                    {user.disabled && <span style={{ fontSize: 9, color: "#fff", background: C.danger, padding: "1px 6px", borderRadius: 8, fontWeight: 600, textTransform: "uppercase" as any }}>Disabled</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>Employee Code: {user.email || "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)} disabled={updating === user._id || user.disabled}
                    style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: "6px 12px", fontSize: 13, fontFamily: BODY, cursor: updating === user._id ? "wait" : "pointer", outline: "none" }}>
                    {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                  </select>
                  <button onClick={() => handleToggleDisabled(user._id, !user.disabled)} disabled={updating === user._id}
                    style={{ background: user.disabled ? C.success : C.danger, border: "none", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: BODY, minWidth: 65 }}>
                    {user.disabled ? "Enable" : "Disable"}
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.textLight }}>Loading users...</div>}
          </>
        )}

        {tab === "audit" && (
          <>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
              Showing last {auditLogs.length} actions. All entries are immutable.
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: BODY }}>
                <thead>
                  <tr style={{ background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600 }}>Timestamp</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600 }}>Action</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600 }}>Performed By</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600 }}>Target</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: C.textMuted, fontWeight: 600 }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any, i: number) => {
                    const info = ACTION_LABELS[log.action] || { label: log.action, color: "#888" };
                    let details = "";
                    try { if (log.details) { const d = JSON.parse(log.details); if (d.oldRole && d.newRole) details = `${d.oldRole} → ${d.newRole}`; else if (d.previousStatus) details = `was ${d.previousStatus}`; else if (d.isFirstUser) details = "First user (auto IT Admin)"; else if (d.employeeCode) details = `Code: ${d.employeeCode}`; } } catch (e) { details = log.details || ""; }
                    return (
                      <tr key={log._id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "8px 14px", color: C.textLight, whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td style={{ padding: "8px 14px" }}><span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: info.color, padding: "2px 8px", borderRadius: 8, textTransform: "uppercase" }}>{info.label}</span></td>
                        <td style={{ padding: "8px 14px", color: C.text }}><div>{log.actorName}</div><div style={{ fontSize: 10, color: C.textLight }}>{log.actorEmail}</div></td>
                        <td style={{ padding: "8px 14px", color: C.textMuted }}>{log.targetName || "—"}{log.targetType && <span style={{ fontSize: 10, color: C.textLight, marginLeft: 4 }}>({log.targetType})</span>}</td>
                        <td style={{ padding: "8px 14px", color: C.textMuted, fontSize: 11 }}>{details || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {auditLogs.length === 0 && <div style={{ textAlign: "center", padding: 32, color: C.textLight }}>No audit entries yet.</div>}
            </div>
          </>
        )}
      </div>

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.success, color: "#fff", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontFamily: BODY, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", zIndex: 999 }}>{toast}</div>}
    </div>
  );
}
