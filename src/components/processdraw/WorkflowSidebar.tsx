"use client";

import { COLORS, STATUS_COLORS, STATUS_LABELS } from "./constants";
import { buttonStyle } from "./ui";
import type { DiagramRecord } from "./types";

export default function WorkflowSidebar({
  diagrams,
  saveName,
  setSaveName,
  canEdit,
  onSaveCurrent,
  onLoadDiagram,
  onOpenHistory,
  onDelete,
  onApprove,
  onRevert,
  onReject,
  isApprover,
}: {
  diagrams: DiagramRecord[];
  saveName: string;
  setSaveName: (value: string) => void;
  canEdit?: boolean;
  onSaveCurrent: () => void;
  onLoadDiagram: (diagram: DiagramRecord) => void;
  onOpenHistory: (diagram: DiagramRecord) => void;
  onDelete: (diagram: DiagramRecord) => void;
  onApprove: (diagram: DiagramRecord) => void;
  onRevert: (diagram: DiagramRecord) => void;
  onReject: (diagram: DiagramRecord) => void;
  isApprover?: boolean;
}) {
  return (
    <aside className="pd-side">
      <h2>Saved diagrams</h2>
      {canEdit && (
        <div style={{ padding: 12, borderBottom: `1px solid ${COLORS.border}` }}>
          <input
            value={saveName}
            onChange={(event) => setSaveName(event.target.value)}
            placeholder="Diagram name"
            aria-label="Diagram name"
            style={{ width: "100%", boxSizing: "border-box", padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 8 }}
          />
          <button style={{ ...buttonStyle("primary"), width: "100%" }} onClick={onSaveCurrent}>Save current</button>
        </div>
      )}

      <div className="pd-list">
        {diagrams.length ? diagrams.map((diagram) => {
          const status = diagram.status || "draft";
          return (
            <div className="pd-card" key={diagram._id || diagram.id || diagram.name} onClick={() => onLoadDiagram(diagram)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                <b style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{diagram.name}</b>
                <span style={{ flexShrink: 0, background: STATUS_COLORS[status] || COLORS.muted, color: "#fff", borderRadius: 99, padding: "2px 8px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {STATUS_LABELS[status] || status}
                </span>
              </div>
              <span>
                {diagram.blocks?.length || 0} steps
                {diagram.ownerName ? ` · ${diagram.ownerName}` : ""}
                {diagram.currentRevision !== undefined ? ` · Rev ${diagram.currentRevision}` : ""}
              </span>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }} onClick={(event) => event.stopPropagation()}>
                {diagram._id && <button style={buttonStyle()} onClick={() => onOpenHistory(diagram)}>History</button>}
                {canEdit && diagram.isOwn && status === "draft" && diagram._id && (
                  <button style={buttonStyle("danger")} onClick={() => onDelete(diagram)}>Delete</button>
                )}
                {isApprover && status === "submitted" && (
                  <>
                    <button style={buttonStyle("success")} onClick={() => onApprove(diagram)}>Approve</button>
                    <button style={buttonStyle("warn")} onClick={() => onRevert(diagram)}>Revert</button>
                    <button style={buttonStyle("danger")} onClick={() => onReject(diagram)}>Reject</button>
                  </>
                )}
              </div>
              {status === "rejected" && diagram.rejectionComment && (
                <span style={{ display: "block", color: COLORS.danger, marginTop: 6 }}>Rejected: {diagram.rejectionComment}</span>
              )}
              {status === "draft" && diagram.revertComment && (
                <span style={{ display: "block", color: COLORS.warn, marginTop: 6 }}>Reverted by {diagram.revertedByName || "approver"}: {diagram.revertComment}</span>
              )}
            </div>
          );
        }) : <p style={{ color: COLORS.light, textAlign: "center" }}>No saved diagrams yet.</p>}
      </div>
    </aside>
  );
}
