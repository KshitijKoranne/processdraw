"use client";

import { useState, type RefObject } from "react";
import { A4_PAGE_HEIGHT, ARROW_SIZE, CANVAS_CENTER_X, COLORS, SIDE_GAP, SVG_WIDTH } from "./constants";
import { sideDimensions } from "./geometry";
import type { ArrowAnnotations, Block, Side } from "./types";

function Plus({ x, y, onClick }: any) {
  return <g className="pd-ctl" onClick={onClick}><circle cx={x} cy={y} r={9} fill="#fff" stroke={COLORS.accent} /><path d={`M${x - 4} ${y}H${x + 4}M${x} ${y - 4}V${y + 4}`} stroke={COLORS.accent} /><circle cx={x} cy={y} r={18} fill="transparent" /></g>;
}

function Delete({ x, y, onClick }: any) {
  return <g className="pd-del" onClick={onClick}><circle cx={x} cy={y} r={8} fill={COLORS.danger} /><text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#fff">×</text><circle cx={x} cy={y} r={16} fill="transparent" /></g>;
}

export function DiagramCanvas({
  svgRef,
  layout,
  blocks,
  annotations,
  readOnly,
  onEditBlock,
  onDeleteBlock,
  onAddBlock,
  onFinalize,
  onPickSide,
  onPickBetween,
  onToggleSideArrow,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  layout: any;
  blocks: Block[];
  annotations: ArrowAnnotations;
  readOnly: boolean;
  onEditBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onAddBlock: () => void;
  onFinalize: () => void;
  onPickSide: (blockId: string, side: Side) => void;
  onPickBetween: (index: number) => void;
  onToggleSideArrow?: (blockId: string, side: Side, itemId: string) => void;
}) {
  void blocks;
  const [, forceRender] = useState(0);
  const output: any[] = [];

  const toggleArrow = (blockId: string, side: Side, item: any) => {
    if (onToggleSideArrow) {
      onToggleSideArrow(blockId, side, item.id);
      return;
    }
    item.arrowDir = item.arrowDir === "right" ? "left" : "right";
    forceRender((value) => value + 1);
  };

  for (let page = 1; page < layout.pages; page++) {
    output.push(<g key={`page-${page}`}><line x1={42} x2={SVG_WIDTH - 42} y1={page * A4_PAGE_HEIGHT} y2={page * A4_PAGE_HEIGHT} stroke={COLORS.border} strokeDasharray="7 5" /><text x={SVG_WIDTH / 2} y={page * A4_PAGE_HEIGHT - 10} textAnchor="middle" fontSize="11" fill={COLORS.light}>A4 page break</text></g>);
  }

  layout.positions.forEach((pos: any, index: number) => {
    output.push(<rect key={pos.block.id} x={pos.blockX} y={pos.blockY} width={pos.width} height={pos.height} rx="2" fill="#fff" stroke={COLORS.ink} strokeWidth="1.5" className={!readOnly ? "pd-shape" : ""} onClick={() => !readOnly && onEditBlock(pos.block.id)} />);
    pos.lines.forEach((line: string, lineIndex: number) => output.push(<text key={`${pos.block.id}-${lineIndex}`} x={pos.blockX + pos.width / 2} y={pos.blockY + pos.height / 2 - ((pos.lines.length - 1) * 18) / 2 + lineIndex * 18} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={COLORS.ink}>{line}</text>));

    if (!readOnly) output.push(<Delete key={`del-${pos.block.id}`} x={pos.blockX + pos.width + 5} y={pos.blockY - 5} onClick={(event: any) => { event.stopPropagation(); onDeleteBlock(pos.block.id); }} />);

    if (index < layout.positions.length - 1) {
      const next = layout.positions[index + 1];
      const y1 = pos.blockY + pos.height;
      const y2 = next.blockY;
      const mid = (y1 + y2) / 2;
      output.push(<g key={`arrow-${index}`}><line x1={CANVAS_CENTER_X} x2={CANVAS_CENTER_X} y1={y1} y2={y2} stroke={COLORS.ink} /><polygon points={`${CANVAS_CENTER_X},${y2} ${CANVAS_CENTER_X - 4},${y2 - ARROW_SIZE} ${CANVAS_CENTER_X + 4},${y2 - ARROW_SIZE}`} fill={COLORS.ink} /></g>);
      const ann = annotations[index] || { left: [], right: [] };
      (["left", "right"] as Side[]).forEach((side) => (ann[side] || []).forEach((item: any, annIndex: number) => {
        const dimensions = sideDimensions(item.text);
        const textX = side === "left" ? CANVAS_CENTER_X - 18 : CANVAS_CENTER_X + 18;
        const textY = mid + annIndex * (dimensions.height + 4);
        dimensions.lines.forEach((line, lineIndex) => output.push(<text key={`ann-${side}-${index}-${annIndex}-${lineIndex}`} x={textX} y={textY + lineIndex * 14} textAnchor={side === "left" ? "end" : "start"} fontSize="11">{line}</text>));
      }));
      if (!readOnly) output.push(<Plus key={`between-${index}`} x={CANVAS_CENTER_X + 18} y={mid + 18} onClick={() => onPickBetween(index)} />);
    }

    const drawSide = (items: any[], side: Side) => items.forEach((itemPos) => {
      const isBox = itemPos.item.type !== "label";
      if (isBox) output.push(<rect key={`side-box-${itemPos.item.id}`} x={itemPos.x} y={itemPos.y} width={itemPos.width} height={itemPos.height} fill="#fff" stroke={COLORS.ink} />);
      itemPos.lines.forEach((line: string, lineIndex: number) => output.push(<text key={`side-text-${itemPos.item.id}-${lineIndex}`} x={isBox ? itemPos.x + itemPos.width / 2 : side === "left" ? itemPos.x + itemPos.width : itemPos.x} y={itemPos.y + itemPos.height / 2 - ((itemPos.lines.length - 1) * 14) / 2 + lineIndex * 14} textAnchor={isBox ? "middle" : side === "left" ? "end" : "start"} dominantBaseline="middle" fontSize="11">{line}</text>));

      const x1 = side === "left" ? itemPos.x + itemPos.width + 4 : pos.blockX + pos.width + 4;
      const x2 = side === "left" ? pos.blockX - 4 : itemPos.x - 4;
      const leftX = Math.min(x1, x2) + 4;
      const rightX = Math.max(x1, x2) - 4;
      const headX = itemPos.item.arrowDir === "right" ? rightX : leftX;
      output.push(
        <g
          key={`side-arrow-${itemPos.item.id}`}
          className={!readOnly ? "pd-ctl" : undefined}
          onClick={(event: any) => {
            if (readOnly) return;
            event.stopPropagation();
            toggleArrow(pos.block.id, side, itemPos.item);
          }}
        >
          <line x1={leftX} x2={rightX} y1={itemPos.centerY} y2={itemPos.centerY} stroke={COLORS.ink} strokeWidth={2} />
          <polygon points={itemPos.item.arrowDir === "right" ? `${headX},${itemPos.centerY} ${headX - ARROW_SIZE},${itemPos.centerY - 4} ${headX - ARROW_SIZE},${itemPos.centerY + 4}` : `${headX},${itemPos.centerY} ${headX + ARROW_SIZE},${itemPos.centerY - 4} ${headX + ARROW_SIZE},${itemPos.centerY + 4}`} fill={COLORS.ink} />
          {!readOnly && <line x1={leftX} x2={rightX} y1={itemPos.centerY} y2={itemPos.centerY} stroke="transparent" strokeWidth={18} />}
        </g>
      );
    });

    drawSide(pos.left, "left");
    drawSide(pos.right, "right");

    if (!readOnly) {
      output.push(<Plus key={`left-plus-${pos.block.id}`} x={pos.blockX - SIDE_GAP / 2} y={pos.left.length ? pos.left[pos.left.length - 1].y + pos.left[pos.left.length - 1].height + 16 : pos.blockY + pos.height / 2} onClick={() => onPickSide(pos.block.id, "left")} />);
      output.push(<Plus key={`right-plus-${pos.block.id}`} x={pos.blockX + pos.width + SIDE_GAP / 2} y={pos.right.length ? pos.right[pos.right.length - 1].y + pos.right[pos.right.length - 1].height + 16 : pos.blockY + pos.height / 2} onClick={() => onPickSide(pos.block.id, "right")} />);
    }

    if (index === layout.positions.length - 1 && !readOnly) {
      output.push(<g key="end-row"><Plus x={CANVAS_CENTER_X - 30} y={pos.blockY + pos.height + 36} onClick={onAddBlock} /><g className="pd-ctl" onClick={onFinalize}><rect x={CANVAS_CENTER_X + 6} y={pos.blockY + pos.height + 26} width="52" height="22" rx="5" fill="#fff" stroke={COLORS.danger} /><text x={CANVAS_CENTER_X + 32} y={pos.blockY + pos.height + 41} textAnchor="middle" fontSize="10" fontWeight="700" fill={COLORS.danger}>END</text></g></g>);
    }
  });

  return <svg ref={svgRef} className="pd-svg" xmlns="http://www.w3.org/2000/svg" width={SVG_WIDTH} height={layout.height} viewBox={`0 0 ${SVG_WIDTH} ${layout.height}`}>{output}</svg>;
}
