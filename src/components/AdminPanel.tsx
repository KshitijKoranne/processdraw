"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

const DISPLAY = "'Playfair Display', Georgia, serif";
const BODY = "'Source Sans 3', sans-serif";
const C = {
  bg: "#f5f0e8", surface: "#ffffff", surfaceAlt: "#faf7f2",
  border: "#e2ddd3", text: "#2c2a26", textMid: "#6b6560",
  textLight: "#a09890", accent: "#c06030", green: "#5a9a6a", red: "#b54a4a",
};

const ROLES = [
  { value: "it_admin", label: "IT Admin", desc: "Full access, manage users" },
  { value: "user", label: "User", desc: "Create/edit own diagrams" },
  { value: "approver", label: "Approver", desc: "Review and approve diagrams" },
  { value: "viewer", label: "Viewer", desc: "View approved diagrams only" },
];

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const users = useQuery(api.users.listUsers) || [];
  const updateRole = useMutation(api.users.updateUserRole);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleRoleChange = async (userId: any, role: string) => {
    setUpdating(userId);
    try {
      await updateRole({ userId, role });
    } catch (e) {
      console.error(e);
    }
    setUpdating(null);
  };

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: BODY, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textMid, borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: BODY }}>← Back</button>
        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: DISPLAY, color: C.text }}>User Management</span>
        <span style={{ fontSize: 12, color: C.textLight }}>{users.length} user{users.length !== 1 ? "s" : ""}</span>
      </div>

      {/* User list */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 32px", maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {/* Role legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {ROLES.map((r) => (
            <div key={r.value} style={{ fontSize: 12, color: C.textMid }}>
              <strong style={{ color: C.text }}>{r.label}:</strong> {r.desc}
            </div>
          ))}
        </div>

        {users.map((user: any) => (
          <div key={user._id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", marginBottom: 8, borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{user.name}</div>
              <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{user.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                disabled={updating === user._id}
                style={{
                  background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text,
                  borderRadius: 6, padding: "6px 12px", fontSize: 13, fontFamily: BODY,
                  cursor: updating === user._id ? "wait" : "pointer", outline: "none",
                }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {updating === user._id && <span style={{ fontSize: 11, color: C.textLight }}>Saving...</span>}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: C.textLight, fontSize: 14 }}>Loading users...</div>
        )}
      </div>
    </div>
  );
}
