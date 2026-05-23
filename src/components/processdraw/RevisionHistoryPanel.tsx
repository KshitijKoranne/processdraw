"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { COLORS } from "./constants";
import { buttonStyle } from "./ui";

function formatDate(value?: number) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusColor(status?: string) {
  if (status === "approved") return COLORS.success;
  if (status === "rejected") return COLORS.danger;
  if (status === "reverted") return COLORS.warn;
  return COLORS.accent;
}

function Remark({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10, color: COLORS.light, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.45, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function RevisionHistoryPanel({ diagramId, diagramName, onClose }: { diagramId: string; diagramName?: string; onClose: () => void }) {
  const versions = useQuery(api.diagrams.listVersions, { diagramId: diagramId as any });
  const sorted = [...(versions || [])].sort((a: any, b: any) => b.revisionNumber - a.revisionNumber);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,40,36,.32)", zIndex: 40, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }} onClick={onClose}>
      <aside style={{ width: "min(460px, 100vw)", height: "100%", background: COLORS.soft, borderLeft: `1px solid ${COLORS.border}`, boxShadow: "-20px 0 60px rgba(44,40,36,.18)", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
        <header style={{ padding: "18px 20px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.paper }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontFamily: "'Fraunces', Georgia, serif" }}>Revision History</h2>
              <p style={{ margin: "5px 0 0", fontSize: 12, color: COLORS.muted }}>{diagramName || "Selected diagram"}</p>
            </div>
            <button style={buttonStyle()} onClick={onClose}>Close</button>
          </div>
        </header>

        <div style={{ overflow: "auto", padding: 16, flex: 1 }}>
          {versions === undefined && <p style={{ color: COLORS.muted, fontSize: 13 }}>Loading revision history...</p>}
          {versions && versions.length === 0 && <p style={{ color: COLORS.muted, fontSize: 13 }}>No submitted revisions have been captured yet.</p>}

          {sorted.map((version: any) => (
            <article key={version._id} style={{ background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <strong style={{ fontSize: 14 }}>Revision {version.revisionNumber}</strong>
                <span style={{ background: statusColor(version.statusAtSnapshot), color: "#fff", borderRadius: 999, padding: "3px 9px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{version.statusAtSnapshot}</span>
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11, color: COLORS.muted }}>
                <div><b style={{ color: COLORS.text }}>Submitted by</b><br />{version.submittedByName || "—"}</div>
                <div><b style={{ color: COLORS.text }}>Submitted at</b><br />{formatDate(version.submittedAt)}</div>
                {version.approvedByName && <div><b style={{ color: COLORS.text }}>Approved by</b><br />{version.approvedByName}</div>}
                {version.approvedAt && <div><b style={{ color: COLORS.text }}>Approved at</b><br />{formatDate(version.approvedAt)}</div>}
                {version.revertedByName && <div><b style={{ color: COLORS.text }}>Reverted by</b><br />{version.revertedByName}</div>}
                {version.revertedAt && <div><b style={{ color: COLORS.text }}>Reverted at</b><br />{formatDate(version.revertedAt)}</div>}
                {version.rejectedByName && <div><b style={{ color: COLORS.text }}>Rejected by</b><br />{version.rejectedByName}</div>}
                {version.rejectedAt && <div><b style={{ color: COLORS.text }}>Rejected at</b><br />{formatDate(version.rejectedAt)}</div>}
              </div>

              <Remark label="Submission remarks" value={version.submittedRemarks} />
              <Remark label="Approval remarks" value={version.approvalRemarks} />
              <Remark label="Revert remarks" value={version.revertRemarks} />
              <Remark label="Rejection remarks" value={version.rejectionRemarks} />
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
