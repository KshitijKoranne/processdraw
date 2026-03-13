"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/*
  ProcessDraw V2 — Canvas-first builder (Fixed)
  Fixes:
  1. Left arrow toggle now flips entire arrow (line + head), not just the tip
  2. + between blocks adds side annotations near the arrow, NOT new rectangles
*/

const FONT = "'DM Sans', sans-serif";
const BLOCK_MIN_W = 160;
const BLOCK_H_PAD = 24;
const BLOCK_V_PAD = 14;
const LINE_H = 18;
const V_GAP = 80;
const SIDE_GAP = 60;
const CANVAS_CENTER = 400;
const ARROW_SZ = 7;

const SIDE_TYPES = [
  { id: "label", name: "Label", desc: "Text annotation (e.g. Methanol)" },
  { id: "equipment", name: "Equipment Block", desc: "Side reactor, tank, etc." },
  { id: "ipqc", name: "IPQC Check", desc: "In-process quality check" },
];

const BETWEEN_SIDE_OPTIONS = [
  { id: "left", name: "Add to Left of Arrow" },
  { id: "right", name: "Add to Right of Arrow" },
];

const uid = () => "n" + Math.random().toString(36).slice(2, 8);

function textToLines(text, maxCharsPerLine = 22) {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    if (cur && (cur + " " + w).length > maxCharsPerLine) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function blockDimensions(text) {
  const lines = textToLines(text);
  const h = lines.length * LINE_H + BLOCK_V_PAD * 2;
  const maxLine = Math.max(...lines.map((l) => l.length));
  const w = Math.max(BLOCK_MIN_W, maxLine * 8.5 + BLOCK_H_PAD * 2);
  return { w, h, lines };
}

function sideItemDimensions(text) {
  const lines = textToLines(text, 20);
  const h = lines.length * LINE_H + 14;
  const maxLine = Math.max(...lines.map((l) => l.length));
  const w = Math.max(110, maxLine * 7.5 + 24);
  return { w, h, lines };
}

// ---- Modal Component ----
function TextModal({ title, initial, onConfirm, onCancel, placeholder }) {
  const [val, setVal] = useState(initial || "");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)"
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#1c1c1e", borderRadius: 12, padding: "24px 28px", width: 340,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "1px solid #333"
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0", marginBottom: 14, fontFamily: FONT }}>{title}</div>
        <textarea ref={ref} value={val} onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder || "Enter text..."}
          rows={3}
          style={{
            width: "100%", background: "#2a2a2c", border: "1px solid #444", color: "#f0f0f0",
            borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: FONT, resize: "vertical",
            outline: "none", boxSizing: "border-box", lineHeight: 1.5
          }}
          onFocus={(e) => e.target.style.borderColor = "#6a9ff8"}
          onBlur={(e) => e.target.style.borderColor = "#444"}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (val.trim()) onConfirm(val.trim()); } }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: "#333", border: "none", color: "#aaa", borderRadius: 6, padding: "8px 18px",
            fontSize: 13, cursor: "pointer", fontFamily: FONT
          }}>Cancel</button>
          <button onClick={() => { if (val.trim()) onConfirm(val.trim()); }} disabled={!val.trim()} style={{
            background: val.trim() ? "#2563eb" : "#333", border: "none", color: "#fff", borderRadius: 6,
            padding: "8px 18px", fontSize: 13, cursor: val.trim() ? "pointer" : "default",
            fontFamily: FONT, opacity: val.trim() ? 1 : 0.4
          }}>OK</button>
        </div>
      </div>
    </div>
  );
}

// ---- Side Type Picker ----
function SidePicker({ side, onPick, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)"
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#1c1c1e", borderRadius: 12, padding: "20px 24px", width: 280,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "1px solid #333"
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginBottom: 14, fontFamily: FONT }}>
          Add to {side === "left" ? "Left" : "Right"} Side
        </div>
        {SIDE_TYPES.map((st) => (
          <button key={st.id} onClick={() => onPick(st.id)} style={{
            display: "block", width: "100%", background: "#2a2a2c", border: "1px solid #3a3a3c",
            borderRadius: 8, padding: "10px 14px", marginBottom: 6, textAlign: "left",
            cursor: "pointer", transition: "all 0.12s"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.borderColor = "#555"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#2a2a2c"; e.currentTarget.style.borderColor = "#3a3a3c"; }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0", fontFamily: FONT }}>{st.name}</div>
            <div style={{ fontSize: 11, color: "#777", fontFamily: FONT, marginTop: 2 }}>{st.desc}</div>
          </button>
        ))}
        <button onClick={onCancel} style={{
          width: "100%", background: "none", border: "1px solid #444", color: "#888",
          borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: FONT, marginTop: 6
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ---- Between-arrow side picker ----
function BetweenPicker({ onPick, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)"
    }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#1c1c1e", borderRadius: 12, padding: "20px 24px", width: 280,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "1px solid #333"
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginBottom: 14, fontFamily: FONT }}>
          Add annotation near arrow
        </div>
        {BETWEEN_SIDE_OPTIONS.map((opt) => (
          <button key={opt.id} onClick={() => onPick(opt.id)} style={{
            display: "block", width: "100%", background: "#2a2a2c", border: "1px solid #3a3a3c",
            borderRadius: 8, padding: "12px 14px", marginBottom: 6, textAlign: "left",
            cursor: "pointer", transition: "all 0.12s"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.borderColor = "#555"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#2a2a2c"; e.currentTarget.style.borderColor = "#3a3a3c"; }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0", fontFamily: FONT }}>{opt.name}</div>
          </button>
        ))}
        <button onClick={onCancel} style={{
          width: "100%", background: "none", border: "1px solid #444", color: "#888",
          borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: FONT, marginTop: 6
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ---- Plus Button (SVG) ----
function PlusBtn({ x, y, size = 24, onClick, frozen }) {
  if (frozen) return null;
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick}>
      <circle cx={x} cy={y} r={size / 2} fill="#2563eb" stroke="#1a1a1a" strokeWidth={1} opacity={0.85} />
      <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke="white" strokeWidth={2} />
      <line x1={x} y1={y - 6} x2={x} y2={y + 6} stroke="white" strokeWidth={2} />
    </g>
  );
}

// ---- End Button (SVG) ----
function EndBtn({ x, y, onClick, frozen }) {
  if (frozen) return null;
  const w = 52, h = 26;
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill="#dc2626" stroke="#1a1a1a" strokeWidth={1} opacity={0.85} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={11} fontWeight={600} fill="white">END</text>
    </g>
  );
}

// ---- Main App ----
export default function ProcessDrawV2() {
  const [blocks, setBlocks] = useState([]);
  const [arrowAnnotations, setArrowAnnotations] = useState({});
  const [frozen, setFrozen] = useState(false);
  const [modal, setModal] = useState(null);
  const [picker, setPicker] = useState(null);
  const [betweenPicker, setBetweenPicker] = useState(null);
  const [toast, setToast] = useState(null);
  const svgRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const addBlock = (text) => {
    setBlocks((prev) => [...prev, { id: uid(), text, leftItems: [], rightItems: [] }]);
  };

  const editBlock = (id, text) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, text } : b));
  };

  const addSideItem = (blockId, side, sideType, text) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const item = { id: uid(), type: sideType, text, arrowDir: side === "left" ? "right" : "left" };
      if (side === "left") return { ...b, leftItems: [...b.leftItems, item] };
      return { ...b, rightItems: [...b.rightItems, item] };
    }));
  };

  const addArrowAnnotation = (arrowIdx, side, text) => {
    setArrowAnnotations((prev) => {
      const existing = prev[arrowIdx] || { left: [], right: [] };
      const updated = { ...existing };
      updated[side] = [...updated[side], { id: uid(), text }];
      return { ...prev, [arrowIdx]: updated };
    });
  };

  const removeArrowAnnotation = (arrowIdx, side, itemIdx) => {
    setArrowAnnotations((prev) => {
      const existing = prev[arrowIdx];
      if (!existing) return prev;
      const updated = { ...existing };
      updated[side] = updated[side].filter((_, i) => i !== itemIdx);
      return { ...prev, [arrowIdx]: updated };
    });
  };

  const toggleArrow = (blockId, side, itemIdx) => {
    if (frozen) return;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const key = side === "left" ? "leftItems" : "rightItems";
      const items = [...b[key]];
      items[itemIdx] = { ...items[itemIdx], arrowDir: items[itemIdx].arrowDir === "left" ? "right" : "left" };
      return { ...b, [key]: items };
    }));
  };

  const removeSideItem = (blockId, side, itemIdx) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b;
      const key = side === "left" ? "leftItems" : "rightItems";
      return { ...b, [key]: b[key].filter((_, i) => i !== itemIdx) };
    }));
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleEnd = () => setFrozen(true);
  const handleUnfreeze = () => setFrozen(false);

  const exportPNG = useCallback(async () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const vb = svgEl.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 800, 600];
    const scale = 2; const w = vb[2] * scale; const h = vb[3] * scale;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    return new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
        canvas.toBlob((b: any) => {
          const a = document.createElement("a"); a.href = URL.createObjectURL(b);
          a.download = "ProcessDraw_Diagram.png"; a.click();
          showToast("PNG exported!"); resolve();
        }, "image/png");
      };
      img.src = url;
    });
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const vb = svgEl.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 800, 600];
    const scale = 2; const w = vb[2] * scale; const h = vb[3] * scale;
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = async () => {
      ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      canvas.toBlob(async (b) => {
        try { await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); showToast("Copied to clipboard!"); }
        catch (e) { showToast("Copy failed — try download"); }
      }, "image/png");
    };
    img.src = url;
  }, []);

  // ---- Layout ----
  const layout = useCallback(() => {
    const positions = [];
    let y = 50;
    const cx = CANVAS_CENTER;

    blocks.forEach((block, i) => {
      const dim = blockDimensions(block.text);
      const bx = cx - dim.w / 2;
      const by = y;

      const leftPositions = block.leftItems.map((item, li) => {
        const sd = sideItemDimensions(item.text);
        const iy = by + 16 + li * (sd.h + 8);
        return { ...sd, x: bx - SIDE_GAP - sd.w, y: iy - sd.h / 2, item, idx: li };
      });

      const rightPositions = block.rightItems.map((item, ri) => {
        const sd = sideItemDimensions(item.text);
        const iy = by + 16 + ri * (sd.h + 8);
        return { ...sd, x: bx + dim.w + SIDE_GAP, y: iy - sd.h / 2, item, idx: ri };
      });

      const leftH = leftPositions.length ? leftPositions[leftPositions.length - 1].y + leftPositions[leftPositions.length - 1].h - by : 0;
      const rightH = rightPositions.length ? rightPositions[rightPositions.length - 1].y + rightPositions[rightPositions.length - 1].h - by : 0;
      const effectiveH = Math.max(dim.h, leftH, rightH);

      positions.push({ block, dim, bx, by, leftPositions, rightPositions, effectiveH });
      y += effectiveH + V_GAP;
    });

    return { positions, totalH: y + 60, totalW: CANVAS_CENTER * 2 };
  }, [blocks]);

  const { positions, totalH, totalW } = layout();

  // ---- SVG Rendering ----
  const renderDiagram = () => {
    const els = [];

    positions.forEach((pos, i) => {
      const { block, dim, bx, by, leftPositions, rightPositions } = pos;

      // Main block
      els.push(
        <rect key={`b-${i}`} x={bx} y={by} width={dim.w} height={dim.h}
          fill="white" stroke="#1a1a1a" strokeWidth={1.5} rx={1}
          style={{ cursor: frozen ? "default" : "pointer" }}
          onClick={() => { if (!frozen) setModal({ type: "edit", blockId: block.id }); }}
        />
      );

      // Block text
      const startTY = by + dim.h / 2 - ((dim.lines.length - 1) * LINE_H) / 2;
      dim.lines.forEach((line, li) => {
        els.push(
          <text key={`bt-${i}-${li}`} x={bx + dim.w / 2} y={startTY + li * LINE_H}
            textAnchor="middle" dominantBaseline="central"
            fontFamily={FONT} fontSize={13} fontWeight="600" fill="#1a1a1a"
            style={{ pointerEvents: "none" }}>
            {line}
          </text>
        );
      });

      // Delete block button
      if (!frozen) {
        els.push(
          <g key={`del-${i}`} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}>
            <circle cx={bx + dim.w - 1} cy={by - 1} r={9} fill="#555" />
            <text x={bx + dim.w - 1} y={by - 1} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="#eee" fontFamily={FONT}>×</text>
          </g>
        );
      }

      // Arrow to next block
      if (i < positions.length - 1) {
        const arrowStartY = by + dim.h;
        const arrowEndY = positions[i + 1].by;
        const midY = (arrowStartY + arrowEndY) / 2;

        els.push(
          <line key={`arr-${i}`} x1={CANVAS_CENTER} y1={arrowStartY} x2={CANVAS_CENTER} y2={arrowEndY} stroke="#1a1a1a" strokeWidth={1.2} />,
          <polygon key={`arh-${i}`} points={`${CANVAS_CENTER},${arrowEndY} ${CANVAS_CENTER - ARROW_SZ / 2},${arrowEndY - ARROW_SZ} ${CANVAS_CENTER + ARROW_SZ / 2},${arrowEndY - ARROW_SZ}`} fill="#1a1a1a" />
        );

        // Arrow annotations
        const annotations = arrowAnnotations[i] || { left: [], right: [] };

        annotations.left.forEach((ann, ai) => {
          const sd = sideItemDimensions(ann.text);
          const totalAnnotH = annotations.left.length * (sd.h + 4) - 4;
          const annY = midY - totalAnnotH / 2 + ai * (sd.h + 4) + sd.h / 2;
          const annX = CANVAS_CENTER - 20;
          sd.lines.forEach((sl, sli) => {
            els.push(
              <text key={`ann-l-${i}-${ai}-${sli}`} x={annX} y={annY - ((sd.lines.length - 1) * 14) / 2 + sli * 14}
                textAnchor="end" dominantBaseline="central"
                fontFamily={FONT} fontSize={11} fill="#1a1a1a" style={{ pointerEvents: "none" }}>
                {sl}
              </text>
            );
          });
          if (!frozen) {
            els.push(
              <g key={`ann-ldel-${i}-${ai}`} style={{ cursor: "pointer" }} onClick={() => removeArrowAnnotation(i, "left", ai)}>
                <circle cx={annX - sd.w - 8} cy={annY} r={8} fill="#555" />
                <text x={annX - sd.w - 8} y={annY} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#eee" fontFamily={FONT}>×</text>
              </g>
            );
          }
        });

        annotations.right.forEach((ann, ai) => {
          const sd = sideItemDimensions(ann.text);
          const totalAnnotH = annotations.right.length * (sd.h + 4) - 4;
          const annY = midY - totalAnnotH / 2 + ai * (sd.h + 4) + sd.h / 2;
          const annX = CANVAS_CENTER + 20;
          sd.lines.forEach((sl, sli) => {
            els.push(
              <text key={`ann-r-${i}-${ai}-${sli}`} x={annX} y={annY - ((sd.lines.length - 1) * 14) / 2 + sli * 14}
                textAnchor="start" dominantBaseline="central"
                fontFamily={FONT} fontSize={11} fill="#1a1a1a" style={{ pointerEvents: "none" }}>
                {sl}
              </text>
            );
          });
          if (!frozen) {
            els.push(
              <g key={`ann-rdel-${i}-${ai}`} style={{ cursor: "pointer" }} onClick={() => removeArrowAnnotation(i, "right", ai)}>
                <circle cx={annX + sd.w + 8} cy={annY} r={8} fill="#555" />
                <text x={annX + sd.w + 8} y={annY} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#eee" fontFamily={FONT}>×</text>
              </g>
            );
          }
        });

        // + between blocks — offset to right side of arrow so it doesn't overlap the arrow line
        if (!frozen) {
          els.push(
            <PlusBtn key={`plus-between-${i}`} x={CANVAS_CENTER + 26} y={midY + 16} size={18}
              onClick={() => setBetweenPicker({ arrowIdx: i })} frozen={frozen} />
          );
        }
      }

      // ---- Left side items (FIXED arrow rendering) ----
      leftPositions.forEach((lp) => {
        const { x: sx, y: sy, w: sw, h: sh, lines: slines, item, idx: li } = lp;
        const isEquipOrIPQC = item.type === "equipment" || item.type === "ipqc";
        const anchorY = sy + sh / 2;
        const blockEdgeX = bx;
        const sideEdgeX = sx + sw;

        if (isEquipOrIPQC) {
          els.push(<rect key={`lb-${i}-${li}`} x={sx} y={sy} width={sw} height={sh} fill="white" stroke="#1a1a1a" strokeWidth={1} rx={1} />);
        }

        const txtStartY = sy + sh / 2 - ((slines.length - 1) * 14) / 2;
        slines.forEach((sl, sli) => {
          els.push(
            <text key={`lt-${i}-${li}-${sli}`} x={isEquipOrIPQC ? sx + sw / 2 : sx + sw} y={txtStartY + sli * 14}
              textAnchor={isEquipOrIPQC ? "middle" : "end"} dominantBaseline="central"
              fontFamily={FONT} fontSize={11} fill="#1a1a1a" style={{ pointerEvents: "none" }}>
              {sl}
            </text>
          );
        });

        // FIXED ARROW: arrowDir "right" = points toward block (→), "left" = points away from block (←)
        const lineX1 = sideEdgeX + 4;
        const lineX2 = blockEdgeX - 4;
        const headX = item.arrowDir === "right" ? lineX2 : lineX1;
        const ahPoints = item.arrowDir === "right"
          ? `${headX},${anchorY} ${headX - ARROW_SZ},${anchorY - ARROW_SZ / 2} ${headX - ARROW_SZ},${anchorY + ARROW_SZ / 2}`
          : `${headX},${anchorY} ${headX + ARROW_SZ},${anchorY - ARROW_SZ / 2} ${headX + ARROW_SZ},${anchorY + ARROW_SZ / 2}`;

        els.push(
          <line key={`la-${i}-${li}`} x1={lineX1} y1={anchorY} x2={lineX2} y2={anchorY}
            stroke="#1a1a1a" strokeWidth={1} style={{ cursor: frozen ? "default" : "pointer" }}
            onClick={() => toggleArrow(block.id, "left", li)} />,
          <polygon key={`lah-${i}-${li}`} points={ahPoints} fill="#1a1a1a"
            style={{ cursor: frozen ? "default" : "pointer" }}
            onClick={() => toggleArrow(block.id, "left", li)} />
        );

        if (!frozen) {
          els.push(
            <g key={`ldel-${i}-${li}`} style={{ cursor: "pointer" }} onClick={() => removeSideItem(block.id, "left", li)}>
              <circle cx={sx - 1} cy={sy - 1} r={8} fill="#555" />
              <text x={sx - 1} y={sy - 1} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#eee" fontFamily={FONT}>×</text>
            </g>
          );
        }
      });

      // ---- Right side items (FIXED arrow rendering) ----
      rightPositions.forEach((rp) => {
        const { x: sx, y: sy, w: sw, h: sh, lines: slines, item, idx: ri } = rp;
        const isEquipOrIPQC = item.type === "equipment" || item.type === "ipqc";
        const anchorY = sy + sh / 2;
        const blockEdgeX = bx + dim.w;
        const sideEdgeX = sx;

        if (isEquipOrIPQC) {
          els.push(<rect key={`rb-${i}-${ri}`} x={sx} y={sy} width={sw} height={sh} fill="white" stroke="#1a1a1a" strokeWidth={1} rx={1} />);
        }

        const txtStartY = sy + sh / 2 - ((slines.length - 1) * 14) / 2;
        slines.forEach((sl, sli) => {
          els.push(
            <text key={`rt-${i}-${ri}-${sli}`} x={isEquipOrIPQC ? sx + sw / 2 : sx} y={txtStartY + sli * 14}
              textAnchor={isEquipOrIPQC ? "middle" : "start"} dominantBaseline="central"
              fontFamily={FONT} fontSize={11} fill="#1a1a1a" style={{ pointerEvents: "none" }}>
              {sl}
            </text>
          );
        });

        // FIXED ARROW: arrowDir "right" = points away from block (→), "left" = points toward block (←)
        const lineX1 = blockEdgeX + 4;
        const lineX2 = sideEdgeX - 4;
        const headX = item.arrowDir === "right" ? lineX2 : lineX1;
        const ahPoints = item.arrowDir === "right"
          ? `${headX},${anchorY} ${headX - ARROW_SZ},${anchorY - ARROW_SZ / 2} ${headX - ARROW_SZ},${anchorY + ARROW_SZ / 2}`
          : `${headX},${anchorY} ${headX + ARROW_SZ},${anchorY - ARROW_SZ / 2} ${headX + ARROW_SZ},${anchorY + ARROW_SZ / 2}`;

        els.push(
          <line key={`ra-${i}-${ri}`} x1={lineX1} y1={anchorY} x2={lineX2} y2={anchorY}
            stroke="#1a1a1a" strokeWidth={1} style={{ cursor: frozen ? "default" : "pointer" }}
            onClick={() => toggleArrow(block.id, "right", ri)} />,
          <polygon key={`rah-${i}-${ri}`} points={ahPoints} fill="#1a1a1a"
            style={{ cursor: frozen ? "default" : "pointer" }}
            onClick={() => toggleArrow(block.id, "right", ri)} />
        );

        if (!frozen) {
          els.push(
            <g key={`rdel-${i}-${ri}`} style={{ cursor: "pointer" }} onClick={() => removeSideItem(block.id, "right", ri)}>
              <circle cx={sx + sw + 1} cy={sy - 1} r={8} fill="#555" />
              <text x={sx + sw + 1} y={sy - 1} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#eee" fontFamily={FONT}>×</text>
            </g>
          );
        }
      });

      // + buttons on left and right of block — always below the last side item so user can keep adding
      if (!frozen) {
        const leftPlusY = leftPositions.length
          ? leftPositions[leftPositions.length - 1].y + leftPositions[leftPositions.length - 1].h + 16
          : by + dim.h / 2;
        const rightPlusY = rightPositions.length
          ? rightPositions[rightPositions.length - 1].y + rightPositions[rightPositions.length - 1].h + 16
          : by + dim.h / 2;

        els.push(
          <PlusBtn key={`plus-l-${i}`} x={bx - SIDE_GAP / 2} y={leftPlusY} size={20}
            onClick={() => setPicker({ blockId: block.id, side: "left" })} frozen={frozen} />
        );
        els.push(
          <PlusBtn key={`plus-r-${i}`} x={bx + dim.w + SIDE_GAP / 2} y={rightPlusY} size={20}
            onClick={() => setPicker({ blockId: block.id, side: "right" })} frozen={frozen} />
        );
      }

      // + below last block and END button
      if (i === positions.length - 1 && !frozen) {
        const belowY = by + pos.effectiveH + 30;
        els.push(
          <PlusBtn key="plus-end" x={CANVAS_CENTER - 30} y={belowY} size={22}
            onClick={() => setModal({ type: "new" })} frozen={frozen} />
        );
        els.push(
          <EndBtn key="end-btn" x={CANVAS_CENTER + 30} y={belowY} onClick={handleEnd} frozen={frozen} />
        );
      }
    });

    return els;
  };

  // ---- Modal handlers ----
  const handleModalConfirm = (text) => {
    if (!modal) return;
    if (modal.type === "new") addBlock(text);
    else if (modal.type === "edit") editBlock(modal.blockId, text);
    else if (modal.type === "side") addSideItem(modal.blockId, modal.side, modal.sideType, text);
    else if (modal.type === "between") addArrowAnnotation(modal.arrowIdx, modal.side, text);
    setModal(null);
  };

  const handlePickerSelect = (sideType) => {
    const { blockId, side } = picker;
    setPicker(null);
    setModal({ type: "side", blockId, side, sideType });
  };

  const handleBetweenSideSelect = (side) => {
    const { arrowIdx } = betweenPicker;
    setBetweenPicker(null);
    setModal({ type: "between", arrowIdx, side });
  };

  const getModalTitle = () => {
    if (!modal) return "";
    if (modal.type === "new") return "Add Process Step";
    if (modal.type === "edit") return "Edit Block Text";
    if (modal.type === "side") {
      const st = SIDE_TYPES.find((s) => s.id === modal.sideType);
      return `Add ${st?.name || "Item"} (${modal.side})`;
    }
    if (modal.type === "between") return `Add annotation (${modal.side} of arrow)`;
    return "Enter Text";
  };

  const getModalInitial = () => {
    if (!modal) return "";
    if (modal.type === "edit") return blocks.find((b) => b.id === modal.blockId)?.text || "";
    return "";
  };

  const getPlaceholder = () => {
    if (!modal) return "";
    if (modal.type === "side") {
      if (modal.sideType === "label") return "e.g. Methanol, Through SP-804";
      if (modal.sideType === "equipment") return "e.g. Reactor SSR-806\nMethanol";
      if (modal.sideType === "ipqc") return "e.g. IPQC check for % M/C\n& %LOD (Limit: NMT 0.5%)";
    }
    if (modal.type === "between") return "e.g. Wet cake, Filtrate, Through SP-804";
    return "e.g. Reactor\nGLR-805";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: FONT, background: "#0f0f0f", color: "#eee" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "1px solid #2a2a2a", background: "#161618",
        flexWrap: "wrap", gap: 8
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.5 }}>ProcessDraw</span>
          <span style={{ fontSize: 11, color: "#555" }}>by KJR Labs</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {frozen && (
            <button onClick={handleUnfreeze} style={{
              background: "#333", border: "1px solid #555", color: "#ccc", borderRadius: 6,
              padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: FONT
            }}>Edit Again</button>
          )}
          {frozen && (
            <>
              <button onClick={exportPNG} style={{
                background: "#2563eb", border: "none", color: "#fff", borderRadius: 6,
                padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: FONT, fontWeight: 500
              }}>Export PNG</button>
              <button onClick={copyToClipboard} style={{
                background: "#059669", border: "none", color: "#fff", borderRadius: 6,
                padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: FONT, fontWeight: 500
              }}>Copy</button>
            </>
          )}
          {!frozen && blocks.length > 0 && (
            <span style={{ fontSize: 11, color: "#666" }}>Click blocks to edit · Click arrows to toggle direction · Press END to finalize</span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: "auto", background: "#f7f6f2" }}>
        {blocks.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: "100%", gap: 16
          }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#333" }}>Start your process flow</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>Click + to add your first process step</div>
            <button onClick={() => setModal({ type: "new" })} style={{
              width: 52, height: 52, borderRadius: "50%", background: "#2563eb", border: "none",
              color: "white", fontSize: 28, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
              transition: "transform 0.15s"
            }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
              +
            </button>
          </div>
        ) : (
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            viewBox={`0 0 ${totalW} ${totalH}`} style={{ background: "white", minHeight: totalH }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
            {renderDiagram()}
          </svg>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <TextModal
          title={getModalTitle()}
          initial={getModalInitial()}
          placeholder={getPlaceholder()}
          onConfirm={handleModalConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {picker && (
        <SidePicker
          side={picker.side}
          onPick={handlePickerSelect}
          onCancel={() => setPicker(null)}
        />
      )}

      {betweenPicker && (
        <BetweenPicker
          onPick={handleBetweenSideSelect}
          onCancel={() => setBetweenPicker(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#eee", padding: "10px 24px", borderRadius: 8,
          fontSize: 13, fontFamily: FONT, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 999
        }}>{toast}</div>
      )}
    </div>
  );
}
