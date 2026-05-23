"use client";

import type { RefObject } from "react";
import { DiagramCanvas } from "./DiagramCanvas";
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
    return (
      <div className="pd-empty">
        <h2>{isCloud && role === "approver" ? "Review diagrams" : "Build a process flow"}</h2>
        <p>Create print-ready process flow diagrams with clean GMP-style layout.</p>
        {canEdit && <button className="pd-plus" onClick={onAddBlock}>+</button>}
        <button style={buttonStyle("primary")} onClick={onOpenSaved}>Saved diagrams</button>
      </div>
    );
  }

  return (
    <>
      <div className="pd-bar">
        <span>{name || "Untitled diagram"} · {blocks.length} steps · {layout.pages} A4 page{layout.pages > 1 ? "s" : ""} · {status.toUpperCase()} · {finalized ? "FINALIZED" : "DRAFT"}</span>
        <span>
          <button style={buttonStyle()} onClick={() => setZoom((value) => Math.max(.55, +(value - .1).toFixed(2)))}>−</button>{" "}
          <button style={buttonStyle()} onClick={() => setZoom(() => 1)}>{Math.round(zoom * 100)}%</button>{" "}
          <button style={buttonStyle()} onClick={() => setZoom((value) => Math.min(1.6, +(value + .1).toFixed(2)))}>+</button>
        </span>
      </div>
      <div className="pd-canvas">
        <div className="pd-wrap" style={{ transform: `scale(${zoom})` }}>
          <DiagramCanvas
            svgRef={svgRef}
            layout={layout}
            blocks={blocks}
            annotations={annotations}
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
