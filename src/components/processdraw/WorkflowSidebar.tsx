"use client";

import { COLORS } from "./constants";
import { buttonStyle } from "./ui";
import type { DiagramRecord } from "./types";

export default function WorkflowSidebar({
  diagrams,
  saveName,
  setSaveName,
  onSaveCurrent,
  onLoadDiagram,
  onOpenHistory,
  onApprove,
  onRevert,
  onReject,
  isApprover,
}: {
  diagrams: DiagramRecord[];
  saveName: string;
  setSaveName: (value: string) => void;
  onSaveCurrent: () => void;
  onLoadDiagram: (diagram: DiagramRecord) => void;
  onOpenHistory: (diagram: DiagramRecord) => void;
  onApprove: (diagram: DiagramRecord) => void;
  onRevert: (diagram: DiagramRecord) => void;
  onReject: (diagram: DiagramRecord) => void;
  isApprover?: boolean;
}) {
  return (
    <aside className="pd-side">
      <h2>Saved diagrams</h2>
      <div style={{ padding: 12, borderBottom: `1px solid ${COLORS.border}` }}>
        <input
          value={saveName}
          onChange={(event) => setSaveName(event.target.value)}
          placeholder="Diagram name"
          style={{ width: "100%", boxSizing: "border-box", padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 8 }}
        />
        <button style={{ ...buttonStyle("primary"), width: "100%" }} onClick={onSaveCurrent}>Save current</button>
      </div>

      <div className="pd-list">
        {diagrams.length ? diagrams.map((diagram) => (
          <div className="pd-card" key={diagram._id || diagram.id || diagram.name} onClick={() => onLoadDiagram(diagram)}>
            <b>{diagram.name}</b>
            <span>
              {diagram.blocks?.length || 0} steps · {diagram.status || "draft"}
              {diagram.currentRevision !== undefined ? ` · Rev ${diagram.currentRevision}` : ""}
              {diagram.settings?.finalized ? " · finalized" : ""}
            </span>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }} onClick={(event) => event.stopPropagation()}>
              {diagram._id && <button style={buttonStyle()} onClick={() => onOpenHistory(diagram)}>History</button>}
              {isApprover && diagram.status === "submitted" && (
                <>
                  <button style={buttonStyle("success")} onClick={() => onApprove(diagram)}>Approve</button>
                  <button style={buttonStyle("warn")} onClick={() => onRevert(diagram)}>Revert</button>
                  <button style={buttonStyle("danger")} onClick={() => onReject(diagram)}>Reject</button>
                </>
              )}
            </div>
            {diagram.status === "rejected" && diagram.rejectionComment && (
              <span style={{ display: "block", color: COLORS.danger, marginTop: 6 }}>Rejected: {diagram.rejectionComment}</span>
            )}
          </div>
        )) : <p style={{ color: COLORS.light, textAlign: "center" }}>No saved diagrams yet.</p>}
      </div>
    </aside>
  );
}
