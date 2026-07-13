"use client";

import type { RefObject } from "react";
import { DiagramCanvas } from "./DiagramCanvas";
import { STATUS_LABELS } from "./constants";
import { buttonStyle } from "./ui";
import type { ArrowAnnotations, Block, Side } from "./types";

export default function WorkflowCanvasArea({
  svgRef,
  blocks,
  annotations,
  layout,
  readOnly,
  canEdit,
  isCloud,
  role,
  name,
  status,
  finalized,
  zoom,
  setZoom,
  onEditBlock,
  onDeleteBlock,
  onAddBlock,
  onFinalize,
  onPickSide,
  onPickBetween,
  onToggleSideArrow,
  onOpenSaved,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  blocks: Block[];
  annotations: ArrowAnnotations;
  layout: any;
  readOnly: boolean;
  canEdit: boolean;
  isCloud: boolean;
  role?: string;
  name: string;
  status: string;
  finalized: boolean;
  zoom: number;
  setZoom: (updater: (value: number) => number) => void;
  onEditBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: () => void;
  onFinalize: () => void;
  onPickSide: (blockId: string, side: Side) => void;
  onPickBetween: (index: number) => void;
  onToggleSideArrow: (blockId: string, side: Side, itemId: string) => void;
  onOpenSaved: () => void;
}) {
  if (!blocks.length) {
    const heading = isCloud && role === "approver" ? "Review diagrams" : isCloud && role === "viewer" ? "View approved diagrams" : "Build a process flow";
    const sub = isCloud && role === "approver"
      ? "Open a submitted diagram from the sidebar to review, approve, revert, or reject it."
      : isCloud && role === "viewer"
        ? "Open an approved diagram from the sidebar. Viewers have read-only access."
        : "Create print-ready process flow diagrams with clean GMP-style layout.";
    return (
      <div className="pd-empty">
        <h2>{heading}</h2>
        <p>{sub}</p>
        {canEdit && <button className="pd-plus" aria-label="Add first process step" onClick={onAddBlock}>+</button>}
        <button style={buttonStyle("primary")} onClick={onOpenSaved}>Saved diagrams</button>
      </div>
    );
  }

  return (
    <>
      <div className="pd-bar">
        <span>
          {name || "Untitled diagram"} · {blocks.length} step{blocks.length > 1 ? "s" : ""} · {layout.pages} A4 page{layout.pages > 1 ? "s" : ""} · {(STATUS_LABELS[status] || status).toUpperCase()}
          {status === "draft" && finalized ? " · FINALIZED (ready to submit)" : ""}
        </span>
        <span>
          <button style={buttonStyle()} aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.55, +(value - .1).toFixed(2)))}>−</button>{" "}
          <button style={buttonStyle()} aria-label="Reset zoom" onClick={() => setZoom(() => 1)}>{Math.round(zoom * 100)}%</button>{" "}
          <button style={buttonStyle()} aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.6, +(value + .1).toFixed(2)))}>+</button>
        </span>
      </div>
      <div className="pd-canvas">
        <div className="pd-wrap" style={{ transform: `scale(${zoom})` }}>
          <DiagramCanvas
            svgRef={svgRef}
            layout={layout}
            blocks={blocks}
            annotations={annotations}
            title={name || "Untitled diagram"}
            readOnly={readOnly}
            onEditBlock={onEditBlock}
            onDeleteBlock={onDeleteBlock}
            onAddBlock={onAddBlock}
            onFinalize={onFinalize}
            onPickSide={onPickSide}
            onPickBetween={onPickBetween}
            onToggleSideArrow={onToggleSideArrow}
          />
        </div>
      </div>
    </>
  );
}
