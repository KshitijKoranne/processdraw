"use client";

import { useQuery, useMutation } from "convex/react";
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
};

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const users = useQuery(api.users.listUsers) || [];
  const auditLogs = useQuery(api.auditLog.list, { limit: 200 }) || [];
  const updateRole = useMutation(api.users.updateUserRole);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "audit">("users");

  const handleRoleChange = async (userId: any, role: string) => {
    setUpdating(userId);
    try { await updateRole({ userId, role }); } catch (e) { console.error(e); }
    setUpdating(null);
  };

  const tabStyle = (active: boolean): any => ({
    background: active ? C.accent : "none", color: active ? "#fff" : C.textMuted,
    border: active ? "none" : `1px solid ${C.border}`, borderRadius: 6,
    padding: "6px 16px", fontSize: 13, cursor: "pointer", fontFamily: BODY, fontWeight: 500,
  });

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: BODY }}>← Back</button>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: HEADING, color: C.text }}>Administration</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={() => setTab("users")} style={tabStyle(tab === "users")}>Users</button>
          <button onClick={() => setTab("audit")} style={tabStyle(tab === "audit")}>Audit Log</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        {tab === "users" && (
          <>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
              <strong>IT Admin:</strong> Full access, manage users &nbsp;·&nbsp;
              <strong>User:</strong> Create/edit own diagrams &nbsp;·&nbsp;
              <strong>Approver:</strong> Review & approve &nbsp;·&nbsp;
              <strong>Viewer:</strong> Read-only
            </div>
            {users.map((user: any) => (
              <div key={user._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", marginBottom: 6, borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{user.email}</div>
                </div>
                <select value={user.role} onChange={(e) => handleRoleChange(user._id, e.target.value)} disabled={updating === user._id}
                  style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: "6px 12px", fontSize: 13, fontFamily: BODY, cursor: updating === user._id ? "wait" : "pointer", outline: "none" }}>
                  {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </select>
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
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: "#888" };
                    let details = "";
                    try {
                      if (log.details) {
                        const d = JSON.parse(log.details);
                        if (d.oldRole && d.newRole) details = `${d.oldRole} → ${d.newRole}`;
                        else if (d.previousStatus) details = `was ${d.previousStatus}`;
                        else if (d.isFirstUser) details = "First user (auto IT Admin)";
                      }
                    } catch (e) { details = log.details || ""; }

                    return (
                      <tr key={log._id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "8px 14px", color: C.textLight, whiteSpace: "nowrap" }}>
                          {new Date(log.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "8px 14px" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: actionInfo.color, padding: "2px 8px", borderRadius: 8, textTransform: "uppercase" }}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: "8px 14px", color: C.text }}>
                          <div>{log.actorName}</div>
                          <div style={{ fontSize: 10, color: C.textLight }}>{log.actorEmail}</div>
                        </td>
                        <td style={{ padding: "8px 14px", color: C.textMuted }}>
                          {log.targetName || "—"}
                          {log.targetType && <span style={{ fontSize: 10, color: C.textLight, marginLeft: 4 }}>({log.targetType})</span>}
                        </td>
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
    </div>
  );
}
