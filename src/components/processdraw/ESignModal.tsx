"use client";

import { useMemo, useState } from "react";
import { COLORS } from "./constants";
import { buttonStyle } from "./ui";

export type ESignActionType = "submit" | "approve" | "revert" | "reject";

const ACTION_COPY: Record<ESignActionType, { title: string; verb: string; warning: string; tone: "primary" | "success" | "warn" | "danger" }> = {
  submit: {
    title: "Submit for Approval",
    verb: "Submit",
    warning: "This will lock the current finalized diagram and send it for approval.",
    tone: "warn",
  },
  approve: {
    title: "Approve Diagram",
    verb: "Approve",
    warning: "This will approve the submitted revision and make it available as an approved record.",
    tone: "success",
  },
  revert: {
    title: "Revert for Correction",
    verb: "Revert",
    warning: "This will return the diagram to the user for correction. The user must finalize and resubmit it.",
    tone: "warn",
  },
  reject: {
    title: "Reject Diagram",
    verb: "Reject",
    warning: "This will reject the diagram and close the workflow. The diagram cannot be revised after rejection.",
    tone: "danger",
  },
};

export default function ESignModal({
  action,
  diagramName,
  userName,
  userEmail,
  role,
  onCancel,
  onConfirm,
}: {
  action: ESignActionType;
  diagramName?: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  onCancel: () => void;
  onConfirm: (remarks: string) => Promise<void> | void;
}) {
  const copy = ACTION_COPY[action];
  const [remarks, setRemarks] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timestamp = useMemo(() => new Date().toLocaleString(), []);
  const canConfirm = remarks.trim().length > 0 && confirmed && !busy;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm(remarks.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,40,36,.36)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 60 }} onClick={onCancel}>
      <div style={{ width: "min(520px, 100%)", background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 18, boxShadow: "0 28px 90px rgba(44,40,36,.24)", overflow: "hidden" }} onClick={(event) => event.stopPropagation()}>
        <header style={{ padding: "18px 22px", borderBottom: `1px solid ${COLORS.border}`, background: action === "reject" ? "#fff7f5" : COLORS.soft }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: 21 }}>{copy.title}</h2>
              <p style={{ margin: "5px 0 0", color: COLORS.muted, fontSize: 12 }}>{diagramName || "Selected diagram"}</p>
            </div>
            <span style={{ borderRadius: 999, padding: "4px 10px", fontSize: 10, fontWeight: 800, color: "#fff", background: copy.tone === "success" ? COLORS.success : copy.tone === "danger" ? COLORS.danger : COLORS.warn, textTransform: "uppercase" }}>{copy.verb}</span>
          </div>
        </header>

        <div style={{ padding: 22 }}>
          <div style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: COLORS.text }}>{copy.warning}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14, fontSize: 12 }}>
            <div><b style={{ color: COLORS.text }}>Signed by</b><br /><span style={{ color: COLORS.muted }}>{userName || "Current user"}</span></div>
            <div><b style={{ color: COLORS.text }}>Role</b><br /><span style={{ color: COLORS.muted }}>{role?.replace("_", " ") || "—"}</span></div>
            <div><b style={{ color: COLORS.text }}>Account</b><br /><span style={{ color: COLORS.muted }}>{userEmail || "—"}</span></div>
            <div><b style={{ color: COLORS.text }}>Timestamp</b><br /><span style={{ color: COLORS.muted }}>{timestamp}</span></div>
          </div>

          <label style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: COLORS.muted, marginBottom: 6 }}>Mandatory remarks</label>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={5}
            autoFocus
            placeholder={`Enter ${copy.verb.toLowerCase()} remarks...`}
            style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${COLORS.border}`, borderRadius: 10, background: COLORS.bg, padding: 12, fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 14, lineHeight: 1.45, resize: "vertical", outline: "none" }}
          />

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, fontSize: 12, color: COLORS.text, lineHeight: 1.45, cursor: "pointer" }}>
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} style={{ marginTop: 2 }} />
            <span>I confirm that I am performing this action using my authenticated account and the above remarks are accurate.</span>
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button style={buttonStyle()} onClick={onCancel} disabled={busy}>Cancel</button>
            <button style={{ ...buttonStyle(copy.tone), opacity: canConfirm ? 1 : 0.55, cursor: canConfirm ? "pointer" : "not-allowed" }} onClick={handleConfirm} disabled={!canConfirm}>{busy ? "Signing..." : `${copy.verb} with E-Sign`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
