"use client";

import type { ReactNode } from "react";
import { COLORS } from "./constants";
import { buttonStyle } from "./ui";

export default function WorkflowToolbar({
  role,
  hasBlocks,
  currentId,
  isCloud,
  canEdit,
  finalized,
  status,
  canSubmit,
  userButton,
  onToggleSidebar,
  onOpenHistory,
  onSaveDraft,
  onHelp,
  onNew,
  onFinalize,
  onEdit,
  onSubmit,
  onExportPng,
  onExportPdf,
}: {
  role?: string;
  hasBlocks: boolean;
  currentId: string | null;
  isCloud: boolean;
  canEdit: boolean;
  finalized: boolean;
  status: string;
  canSubmit?: boolean;
  userButton?: ReactNode;
  onToggleSidebar: () => void;
  onOpenHistory: () => void;
  onSaveDraft: () => void;
  onHelp: () => void;
  onNew: () => void;
  onFinalize: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
}) {
  return (
    <header className="pd-top">
      <div className="pd-brand">
        <button style={buttonStyle()} onClick={onToggleSidebar}>☰</button>
        <h1>ProcessDraw</h1>
        <span style={{ color: COLORS.light, fontSize: 11 }}>by KJR Labs</span>
        {isCloud && <span style={{ background: COLORS.accentLight, color: COLORS.accent, borderRadius: 99, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>{role?.replace("_", " ")}</span>}
      </div>

      <div className="pd-actions">
        {hasBlocks && currentId && isCloud && <button style={buttonStyle()} onClick={onOpenHistory}>History</button>}
        {hasBlocks && canEdit && !finalized && <button style={buttonStyle("primary")} onClick={onSaveDraft}>Save draft</button>}
        <button style={buttonStyle()} onClick={onHelp}>?</button>
        {hasBlocks && canEdit && <button style={buttonStyle("danger")} onClick={onNew}>New</button>}
        {hasBlocks && !finalized && canEdit && <button style={buttonStyle("warn")} onClick={onFinalize}>END / Preview</button>}
        {hasBlocks && finalized && canEdit && <button style={buttonStyle()} onClick={onEdit}>Edit</button>}
        {hasBlocks && finalized && isCloud && status === "draft" && canSubmit && <button style={buttonStyle("warn")} onClick={onSubmit}>Submit</button>}
        {hasBlocks && finalized && (!isCloud || status === "approved") && <button style={buttonStyle("primary")} onClick={onExportPng}>PNG</button>}
        {hasBlocks && finalized && (!isCloud || status === "approved") && <button style={buttonStyle("purple")} onClick={onExportPdf}>PDF</button>}
        {isCloud && userButton}
      </div>
    </header>
  );
}
