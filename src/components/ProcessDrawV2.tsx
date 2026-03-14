"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const FONT = "'DM Sans', sans-serif";
const BLOCK_MIN_W = 180;
const BLOCK_H_PAD = 28;
const BLOCK_V_PAD = 16;
const LINE_H = 18;
const V_GAP = 80;
const SIDE_GAP = 50;
const SIDE_ITEM_GAP = 10;
const CANVAS_CENTER = 400;
const ARROW_SZ = 8;
const A4_PAGE_H = 935;
const SVG_W = 800;
const FOOTER_H = 80;

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

function textToLines(text: string, maxChars = 24) {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = []; let cur = "";
  words.forEach((w) => { if (cur && (cur + " " + w).length > maxChars) { lines.push(cur); cur = w; } else { cur = cur ? cur + " " + w : w; } });
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

function blockTextDimensions(text: string) {
  const lines = textToLines(text);
  const h = lines.length * LINE_H + BLOCK_V_PAD * 2;
  const maxLine = Math.max(...lines.map((l) => l.length));
  const w = Math.max(BLOCK_MIN_W, maxLine * 8.5 + BLOCK_H_PAD * 2);
  return { w, h, lines };
}

function sideItemDimensions(text: string) {
  const lines = textToLines(text, 22);
  const h = lines.length * LINE_H + 14;
  const maxLine = Math.max(...lines.map((l) => l.length));
  const w = Math.max(100, maxLine * 7.5 + 20);
  return { w, h, lines };
}

function sideStackHeight(items: any[]) {
  if (!items.length) return 0;
  let total = 0;
  items.forEach((item, i) => { total += sideItemDimensions(item.text).h; if (i < items.length - 1) total += SIDE_ITEM_GAP; });
  return total;
}

// ---- Modals ----
function TextModal({ title, initial, onConfirm, onCancel, placeholder }: any) {
  const [val, setVal] = useState(initial || "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1c1c1e", borderRadius: 12, padding: "24px 28px", width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "1px solid #333" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e0e0e0", marginBottom: 14, fontFamily: FONT }}>{title}</div>
        <textarea ref={ref} value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder || "Enter text..."} rows={3}
          style={{ width: "100%", background: "#2a2a2c", border: "1px solid #444", color: "#f0f0f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: FONT, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
          onFocus={(e) => e.target.style.borderColor = "#6a9ff8"} onBlur={(e) => e.target.style.borderColor = "#444"}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (val.trim()) onConfirm(val.trim()); } }} />
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: "#333", border: "none", color: "#aaa", borderRadius: 6, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={() => { if (val.trim()) onConfirm(val.trim()); }} disabled={!val.trim()} style={{ background: val.trim() ? "#2563eb" : "#333", border: "none", color: "#fff", borderRadius: 6, padding: "8px 18px", fontSize: 13, cursor: val.trim() ? "pointer" : "default", fontFamily: FONT, opacity: val.trim() ? 1 : 0.4 }}>OK</button>
        </div>
      </div>
    </div>
  );
}

function PickerModal({ title, options, onPick, onCancel }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1c1c1e", borderRadius: 12, padding: "20px 24px", width: 280, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "1px solid #333" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginBottom: 14, fontFamily: FONT }}>{title}</div>
        {options.map((opt: any) => (
          <button key={opt.id} onClick={() => onPick(opt.id)} style={{ display: "block", width: "100%", background: "#2a2a2c", border: "1px solid #3a3a3c", borderRadius: 8, padding: "12px 14px", marginBottom: 6, textAlign: "left", cursor: "pointer" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#2a2a2c"; }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0", fontFamily: FONT }}>{opt.name}</div>
            {opt.desc && <div style={{ fontSize: 11, color: "#777", fontFamily: FONT, marginTop: 2 }}>{opt.desc}</div>}
          </button>
        ))}
        <button onClick={onCancel} style={{ width: "100%", background: "none", border: "1px solid #444", color: "#888", borderRadius: 6, padding: "8px 0", fontSize: 12, cursor: "pointer", fontFamily: FONT, marginTop: 6 }}>Cancel</button>
      </div>
    </div>
  );
}

// ---- SVG Controls: subtle, professional ----
// + button: small, gray, low opacity — does NOT print in exports (rendered only when !frozen)
function PlusBtn({ x, y, size = 18, onClick, frozen }: any) {
  if (frozen) return null;
  const r = size / 2;
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.35}>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#888" strokeWidth={1.2} />
      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="#888" strokeWidth={1.2} />
      <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="#888" strokeWidth={1.2} />
      {/* Invisible larger hit area */}
      <circle cx={x} cy={y} r={r + 6} fill="transparent" />
    </g>
  );
}

function EndBtn({ x, y, onClick, frozen }: any) {
  if (frozen) return null;
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.5}>
      <rect x={x - 22} y={y - 10} width={44} height={20} rx={3} fill="none" stroke="#b44" strokeWidth={1.2} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={10} fontWeight={500} fill="#b44">END</text>
    </g>
  );
}

function DelBtn({ cx, cy, onClick }: any) {
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.3}>
      <circle cx={cx} cy={cy} r={7} fill="#999" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#fff" fontFamily={FONT}>×</text>
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
    </g>
  );
}

// ---- Settings Panel ----
function SettingsPanel({ settings, onSave, onClose }: any) {
  const [preparedBy, setPreparedBy] = useState(settings.preparedBy || "");
  const [checkedBy, setCheckedBy] = useState(settings.checkedBy || "");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#1c1c1e", borderRadius: 12, padding: "28px 32px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", border: "1px solid #333" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#e0e0e0", marginBottom: 20, fontFamily: FONT }}>Settings</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontFamily: FONT }}>Prepared By</label>
          <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name"
            style={{ width: "100%", background: "#2a2a2c", border: "1px solid #444", color: "#f0f0f0", borderRadius: 6, padding: "8px 12px", fontSize: 14, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4, fontFamily: FONT }}>Checked By</label>
          <input value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} placeholder="Reviewer name"
            style={{ width: "100%", background: "#2a2a2c", border: "1px solid #444", color: "#f0f0f0", borderRadius: 6, padding: "8px 12px", fontSize: 14, fontFamily: FONT, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 16, fontFamily: FONT }}>These names appear in the footer of every exported diagram.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "#333", border: "none", color: "#aaa", borderRadius: 6, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={() => { onSave({ preparedBy, checkedBy }); onClose(); }} style={{ background: "#2563eb", border: "none", color: "#fff", borderRadius: 6, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontFamily: FONT }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ==== MAIN ====
export default function ProcessDrawV2() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [arrowAnnotations, setArrowAnnotations] = useState<any>({});
  const [frozen, setFrozen] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [picker, setPicker] = useState<any>(null);
  const [betweenPicker, setBetweenPicker] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ preparedBy: "", checkedBy: "" });
  const [showHistory, setShowHistory] = useState(false);
  const [savedDiagrams, setSavedDiagrams] = useState<any[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem("processdraw_settings"); if (s) setSettings(JSON.parse(s));
      const d = localStorage.getItem("processdraw_saved"); if (d) setSavedDiagrams(JSON.parse(d));
    } catch (e) { /* ignore */ }
  }, []);

  const saveSettings = (s: any) => { setSettings(s); localStorage.setItem("processdraw_settings", JSON.stringify(s)); };
  const saveDiagram = (name: string) => {
    const d = { id: uid(), name, blocks, arrowAnnotations, savedAt: new Date().toISOString() };
    const updated = [d, ...savedDiagrams.filter((x) => x.name !== name)];
    setSavedDiagrams(updated); localStorage.setItem("processdraw_saved", JSON.stringify(updated));
    showToastMsg(`Saved "${name}"`); setShowSaveInput(false); setSaveName("");
  };
  const loadDiagram = (d: any) => { setBlocks(d.blocks || []); setArrowAnnotations(d.arrowAnnotations || {}); setFrozen(false); setShowHistory(false); showToastMsg(`Loaded "${d.name}"`); };
  const deleteDiagram = (id: string) => { const u = savedDiagrams.filter((d) => d.id !== id); setSavedDiagrams(u); localStorage.setItem("processdraw_saved", JSON.stringify(u)); };
  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const addBlock = (text: string) => { setBlocks((p) => [...p, { id: uid(), text, leftItems: [], rightItems: [] }]); };
  const editBlock = (id: string, text: string) => { setBlocks((p) => p.map((b) => b.id === id ? { ...b, text } : b)); };
  const addSideItem = (blockId: string, side: string, sideType: string, text: string) => {
    setBlocks((p) => p.map((b) => {
      if (b.id !== blockId) return b;
      const item = { id: uid(), type: sideType, text, arrowDir: side === "left" ? "right" : "left" };
      return side === "left" ? { ...b, leftItems: [...b.leftItems, item] } : { ...b, rightItems: [...b.rightItems, item] };
    }));
  };
  const addArrowAnnotation = (idx: number, side: string, text: string) => {
    setArrowAnnotations((p: any) => { const e = p[idx] || { left: [], right: [] }; const u = { ...e }; u[side] = [...u[side], { id: uid(), text }]; return { ...p, [idx]: u }; });
  };
  const removeArrowAnnotation = (idx: number, side: string, ii: number) => {
    setArrowAnnotations((p: any) => { const e = p[idx]; if (!e) return p; const u = { ...e }; u[side] = u[side].filter((_: any, i: number) => i !== ii); return { ...p, [idx]: u }; });
  };
  const toggleArrow = (blockId: string, side: string, ii: number) => {
    if (frozen) return;
    setBlocks((p) => p.map((b) => { if (b.id !== blockId) return b; const k = side === "left" ? "leftItems" : "rightItems"; const items = [...b[k]]; items[ii] = { ...items[ii], arrowDir: items[ii].arrowDir === "left" ? "right" : "left" }; return { ...b, [k]: items }; }));
  };
  const removeSideItem = (blockId: string, side: string, ii: number) => {
    setBlocks((p) => p.map((b) => { if (b.id !== blockId) return b; const k = side === "left" ? "leftItems" : "rightItems"; return { ...b, [k]: b[k].filter((_: any, i: number) => i !== ii) }; }));
  };
  const removeBlock = (id: string) => { setBlocks((p) => p.filter((b) => b.id !== id)); };
  const handleEnd = () => setFrozen(true);
  const handleUnfreeze = () => setFrozen(false);
  const newDiagram = () => { setBlocks([]); setArrowAnnotations({}); setFrozen(false); };

  // SVG → Canvas
  const svgToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!svgRef.current) return null;
    const svgEl = svgRef.current; const svgData = new XMLSerializer().serializeToString(svgEl);
    const vb = svgEl.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, SVG_W, 600];
    const scale = 2; const w = vb[2] * scale; const h = vb[3] * scale;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h);
    const img = new Image(); const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob);
    return new Promise((resolve) => { img.onload = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); resolve(c); }; img.onerror = () => { URL.revokeObjectURL(url); resolve(null); }; img.src = url; });
  }, []);

  const exportPages = useCallback(async () => {
    setExporting(true); const fc = await svgToCanvas(); if (!fc) { setExporting(false); return; }
    const scale = 2; const pW = SVG_W * scale; const pH = A4_PAGE_H * scale; const tH = fc.height; const nP = Math.ceil(tH / pH);
    for (let p = 0; p < nP; p++) {
      const sc = document.createElement("canvas"); sc.width = pW; sc.height = Math.min(pH, tH - p * pH);
      const ctx = sc.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, sc.width, sc.height);
      ctx.drawImage(fc, 0, p * pH, pW, sc.height, 0, 0, pW, sc.height);
      await new Promise<void>((r) => { sc.toBlob((b: any) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nP === 1 ? "ProcessDraw_Diagram.png" : `ProcessDraw_Page_${p + 1}.png`; a.click(); setTimeout(r, 300); }, "image/png"); });
    }
    showToastMsg(nP === 1 ? "PNG exported!" : `${nP} pages exported!`); setExporting(false);
  }, [svgToCanvas]);

  const copyToClipboard = useCallback(async () => {
    const fc = await svgToCanvas(); if (!fc) return;
    fc.toBlob(async (b: any) => { try { await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]); showToastMsg("Copied!"); } catch (e) { showToastMsg("Copy failed"); } }, "image/png");
  }, [svgToCanvas]);

  // ==== LAYOUT ====
  const layout = useCallback(() => {
    const positions: any[] = []; let y = 50;
    blocks.forEach((block) => {
      const td = blockTextDimensions(block.text);
      const lSH = sideStackHeight(block.leftItems); const rSH = sideStackHeight(block.rightItems);
      const blockH = Math.max(td.h, Math.max(lSH, rSH) + 24);
      const blockW = td.w; const bx = CANVAS_CENTER - blockW / 2; const by = y;
      const layoutSide = (items: any[], side: string) => {
        const sH = sideStackHeight(items); let iy = by + (blockH - sH) / 2;
        return items.map((item: any, idx: number) => {
          const sd = sideItemDimensions(item.text);
          const p = { ...sd, x: side === "left" ? bx - SIDE_GAP - sd.w : bx + blockW + SIDE_GAP, y: iy, item, idx, anchorY: iy + sd.h / 2 };
          iy += sd.h + SIDE_ITEM_GAP; return p;
        });
      };
      positions.push({ block, bx, by, blockW, blockH, textLines: td.lines, leftPositions: layoutSide(block.leftItems, "left"), rightPositions: layoutSide(block.rightItems, "right") });
      y += blockH + V_GAP;
    });
    const diagramH = y + 20;
    const withFooter = frozen ? diagramH + FOOTER_H + 20 : diagramH + 40;
    return { positions, totalH: withFooter, totalW: SVG_W, diagramEndY: diagramH };
  }, [blocks, frozen]);

  const { positions, totalH, totalW, diagramEndY } = layout();
  const numPages = Math.max(1, Math.ceil(totalH / A4_PAGE_H));

  // ==== RENDER ====
  const renderDiagram = () => {
    const els: any[] = [];

    // A4 page guides
    if (blocks.length > 0) {
      for (let p = 1; p < numPages; p++) {
        const gy = p * A4_PAGE_H;
        els.push(<line key={`pg-${p}`} x1={30} y1={gy} x2={totalW - 30} y2={gy} stroke="#d0d0d0" strokeWidth={0.5} strokeDasharray="6 4" />);
        els.push(<text key={`pl-${p}`} x={totalW - 30} y={gy - 5} textAnchor="end" fontFamily={FONT} fontSize={8} fill="#ccc">— page break —</text>);
      }
    }

    positions.forEach((pos, i) => {
      const { block, bx, by, blockW, blockH, textLines, leftPositions, rightPositions } = pos;

      // Main block
      els.push(<rect key={`b-${i}`} x={bx} y={by} width={blockW} height={blockH} fill="white" stroke="#1a1a1a" strokeWidth={1.5} rx={1}
        style={{ cursor: frozen ? "default" : "pointer" }} onClick={() => { if (!frozen) setModal({ type: "edit", blockId: block.id }); }} />);

      const textStartY = by + blockH / 2 - ((textLines.length - 1) * LINE_H) / 2;
      textLines.forEach((line: string, li: number) => {
        els.push(<text key={`bt-${i}-${li}`} x={bx + blockW / 2} y={textStartY + li * LINE_H} textAnchor="middle" dominantBaseline="central"
          fontFamily={FONT} fontSize={13} fontWeight="600" fill="#1a1a1a" style={{ pointerEvents: "none" }}>{line}</text>);
      });

      if (!frozen) els.push(<DelBtn key={`del-${i}`} cx={bx + blockW + 2} cy={by - 2} onClick={(e: any) => { e.stopPropagation(); removeBlock(block.id); }} />);

      // Arrow to next block
      if (i < positions.length - 1) {
        const nextPos = positions[i + 1];
        const aStartY = by + blockH;
        const aEndY = nextPos.by;
        const midY = (aStartY + aEndY) / 2;

        els.push(<line key={`arr-${i}`} x1={CANVAS_CENTER} y1={aStartY} x2={CANVAS_CENTER} y2={aEndY} stroke="#1a1a1a" strokeWidth={1.2} />);
        els.push(<polygon key={`arh-${i}`} points={`${CANVAS_CENTER},${aEndY} ${CANVAS_CENTER - ARROW_SZ / 2},${aEndY - ARROW_SZ} ${CANVAS_CENTER + ARROW_SZ / 2},${aEndY - ARROW_SZ}`} fill="#1a1a1a" />);

        // Arrow annotations — placed at midpoint of arrow
        const ann = arrowAnnotations[i] || { left: [], right: [] };
        let maxAnnotWidth = 0; // track for + button positioning

        (["left", "right"] as const).forEach((side) => {
          const items = ann[side] || [];
          if (!items.length) return;
          // Stack annotations centered at midY
          const totalAH = items.reduce((acc: number, a: any) => acc + sideItemDimensions(a.text).h + 4, -4);
          let aY = midY - totalAH / 2;

          items.forEach((a: any, ai: number) => {
            const sd = sideItemDimensions(a.text);
            const centerY = aY + sd.h / 2;
            const aX = side === "left" ? CANVAS_CENTER - 16 : CANVAS_CENTER + 16;
            if (sd.w > maxAnnotWidth) maxAnnotWidth = sd.w;

            sd.lines.forEach((sl: string, sli: number) => {
              els.push(<text key={`an-${side}-${i}-${ai}-${sli}`} x={aX}
                y={centerY - ((sd.lines.length - 1) * 14) / 2 + sli * 14}
                textAnchor={side === "left" ? "end" : "start"} dominantBaseline="central"
                fontFamily={FONT} fontSize={11} fill="#1a1a1a" style={{ pointerEvents: "none" }}>{sl}</text>);
            });
            if (!frozen) {
              const dx = side === "left" ? aX - sd.w - 6 : aX + sd.w + 6;
              els.push(<DelBtn key={`andel-${side}-${i}-${ai}`} cx={dx} cy={centerY} onClick={() => removeArrowAnnotation(i, side, ai)} />);
            }
            aY += sd.h + 4;
          });
        });

        // + between blocks: placed BELOW the annotation area, never overlapping text
        if (!frozen) {
          // Calculate where annotations end
          const hasAnnotations = (ann.left?.length || 0) + (ann.right?.length || 0) > 0;
          let btnY = midY;
          if (hasAnnotations) {
            // Find the bottom edge of all annotations
            const allItems = [...(ann.left || []), ...(ann.right || [])];
            const totalAH = allItems.reduce((acc: number, a: any) => acc + sideItemDimensions(a.text).h + 4, -4);
            btnY = midY + totalAH / 2 + 14; // below the annotation stack
          }
          // Place to the right of the arrow, offset enough to not touch it
          els.push(<PlusBtn key={`pb-${i}`} x={CANVAS_CENTER + 18} y={btnY} size={14} onClick={() => setBetweenPicker({ arrowIdx: i })} frozen={frozen} />);
        }
      }

      // ---- Side items ----
      const renderSideItems = (sidePositions: any[], side: string) => {
        sidePositions.forEach((sp: any) => {
          const { x: sx, y: sy, w: sw, h: sh, lines: slines, item, idx: si, anchorY } = sp;
          const isBox = item.type === "equipment" || item.type === "ipqc";

          if (isBox) els.push(<rect key={`${side}b-${i}-${si}`} x={sx} y={sy} width={sw} height={sh} fill="white" stroke="#1a1a1a" strokeWidth={1} rx={1} />);

          const txtY = sy + sh / 2 - ((slines.length - 1) * 14) / 2;
          slines.forEach((sl: string, sli: number) => {
            const tx = isBox ? sx + sw / 2 : (side === "left" ? sx + sw : sx);
            els.push(<text key={`${side}t-${i}-${si}-${sli}`} x={tx} y={txtY + sli * 14}
              textAnchor={isBox ? "middle" : (side === "left" ? "end" : "start")} dominantBaseline="central"
              fontFamily={FONT} fontSize={11} fill="#1a1a1a" style={{ pointerEvents: "none" }}>{sl}</text>);
          });

          const lineX1 = side === "left" ? sx + sw + 4 : bx + blockW + 4;
          const lineX2 = side === "left" ? bx - 4 : sx - 4;
          const headX = item.arrowDir === "right" ? Math.max(lineX1, lineX2) : Math.min(lineX1, lineX2);
          const ahP = item.arrowDir === "right"
            ? `${headX},${anchorY} ${headX - ARROW_SZ},${anchorY - ARROW_SZ / 2} ${headX - ARROW_SZ},${anchorY + ARROW_SZ / 2}`
            : `${headX},${anchorY} ${headX + ARROW_SZ},${anchorY - ARROW_SZ / 2} ${headX + ARROW_SZ},${anchorY + ARROW_SZ / 2}`;
          const lx1 = Math.min(lineX1, lineX2) + 4; const lx2 = Math.max(lineX1, lineX2) - 4;

          els.push(<line key={`${side}a-${i}-${si}`} x1={lx1} y1={anchorY} x2={lx2} y2={anchorY} stroke="#1a1a1a" strokeWidth={1}
            style={{ cursor: frozen ? "default" : "pointer" }} onClick={() => toggleArrow(block.id, side, si)} />);
          els.push(<polygon key={`${side}ah-${i}-${si}`} points={ahP} fill="#1a1a1a"
            style={{ cursor: frozen ? "default" : "pointer" }} onClick={() => toggleArrow(block.id, side, si)} />);

          if (!frozen) {
            const delCx = side === "left" ? sx - 4 : sx + sw + 4;
            els.push(<DelBtn key={`${side}del-${i}-${si}`} cx={delCx} cy={sy - 4} onClick={() => removeSideItem(block.id, side, si)} />);
          }
        });
      };

      renderSideItems(leftPositions, "left");
      renderSideItems(rightPositions, "right");

      // Side + buttons: subtle, positioned below last item or at block midpoint
      if (!frozen) {
        const lby = leftPositions.length ? leftPositions[leftPositions.length - 1].y + leftPositions[leftPositions.length - 1].h + 14 : by + blockH / 2;
        const rby = rightPositions.length ? rightPositions[rightPositions.length - 1].y + rightPositions[rightPositions.length - 1].h + 14 : by + blockH / 2;
        els.push(<PlusBtn key={`pl-${i}`} x={bx - SIDE_GAP / 2} y={lby} size={16} onClick={() => setPicker({ blockId: block.id, side: "left" })} frozen={frozen} />);
        els.push(<PlusBtn key={`pr-${i}`} x={bx + blockW + SIDE_GAP / 2} y={rby} size={16} onClick={() => setPicker({ blockId: block.id, side: "right" })} frozen={frozen} />);
      }

      // Bottom + and END
      if (i === positions.length - 1 && !frozen) {
        const belowY = by + blockH + 32;
        els.push(<PlusBtn key="plus-end" x={CANVAS_CENTER - 28} y={belowY} size={18} onClick={() => setModal({ type: "new" })} frozen={frozen} />);
        els.push(<EndBtn key="end-btn" x={CANVAS_CENTER + 28} y={belowY} onClick={handleEnd} frozen={frozen} />);
      }
    });

    // ==== FOOTER ====
    if (frozen && blocks.length > 0) {
      const fY = diagramEndY + 10;
      const lineW = 140; const c1 = 60; const c2 = SVG_W / 2 + 30;
      const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      els.push(<line key="ft-sep" x1={40} y1={fY} x2={SVG_W - 40} y2={fY} stroke="#ccc" strokeWidth={0.5} />);
      els.push(<text key="ft-pl" x={c1} y={fY + 20} fontFamily={FONT} fontSize={11} fill="#1a1a1a" fontWeight="600">Prepared by:</text>);
      els.push(<text key="ft-pn" x={c1 + 80} y={fY + 20} fontFamily={FONT} fontSize={11} fill="#1a1a1a">{settings.preparedBy || "___________"}</text>);
      els.push(<text key="ft-psl" x={c1} y={fY + 44} fontFamily={FONT} fontSize={10} fill="#888">Sign:</text>);
      els.push(<line key="ft-psig" x1={c1 + 35} y1={fY + 44} x2={c1 + 35 + lineW} y2={fY + 44} stroke="#1a1a1a" strokeWidth={0.8} />);
      els.push(<text key="ft-cl" x={c2} y={fY + 20} fontFamily={FONT} fontSize={11} fill="#1a1a1a" fontWeight="600">Checked by:</text>);
      els.push(<text key="ft-cn" x={c2 + 78} y={fY + 20} fontFamily={FONT} fontSize={11} fill="#1a1a1a">{settings.checkedBy || "___________"}</text>);
      els.push(<text key="ft-csl" x={c2} y={fY + 44} fontFamily={FONT} fontSize={10} fill="#888">Sign:</text>);
      els.push(<line key="ft-csig" x1={c2 + 35} y1={fY + 44} x2={c2 + 35 + lineW} y2={fY + 44} stroke="#1a1a1a" strokeWidth={0.8} />);
      els.push(<text key="ft-dt" x={SVG_W - 60} y={fY + 20} textAnchor="end" fontFamily={FONT} fontSize={10} fill="#888">Date: {dateStr}</text>);
    }
    return els;
  };

  // Modal handlers
  const handleModalConfirm = (text: string) => {
    if (!modal) return;
    if (modal.type === "new") addBlock(text);
    else if (modal.type === "edit") editBlock(modal.blockId, text);
    else if (modal.type === "side") addSideItem(modal.blockId, modal.side, modal.sideType, text);
    else if (modal.type === "between") addArrowAnnotation(modal.arrowIdx, modal.side, text);
    setModal(null);
  };

  const getModalTitle = () => {
    if (!modal) return "";
    if (modal.type === "new") return "Add Process Step";
    if (modal.type === "edit") return "Edit Block Text";
    if (modal.type === "side") { const st = SIDE_TYPES.find((s) => s.id === modal.sideType); return `Add ${st?.name || "Item"} (${modal.side})`; }
    if (modal.type === "between") return `Add annotation (${modal.side} of arrow)`;
    return "";
  };
  const getModalInitial = () => modal?.type === "edit" ? blocks.find((b: any) => b.id === modal.blockId)?.text || "" : "";
  const getPlaceholder = () => {
    if (modal?.type === "side") { if (modal.sideType === "label") return "e.g. Methanol"; if (modal.sideType === "equipment") return "e.g. Reactor SSR-806"; if (modal.sideType === "ipqc") return "e.g. IPQC check for %LOD"; }
    if (modal?.type === "between") return "e.g. Wet cake";
    return "e.g. Reactor GLR-805";
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: FONT, background: "#0f0f0f", color: "#eee" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* History Sidebar */}
      {showHistory && (
        <div style={{ width: 260, background: "#161618", borderRight: "1px solid #2a2a2a", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #2a2a2a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Saved Diagrams</span>
            <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16, fontFamily: FONT }}>×</button>
          </div>
          {blocks.length > 0 && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #222" }}>
              {showSaveInput ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name..." autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && saveName.trim()) saveDiagram(saveName.trim()); }}
                    style={{ flex: 1, background: "#2a2a2c", border: "1px solid #444", color: "#eee", borderRadius: 4, padding: "5px 8px", fontSize: 12, fontFamily: FONT, outline: "none" }} />
                  <button onClick={() => { if (saveName.trim()) saveDiagram(saveName.trim()); }}
                    style={{ background: "#2563eb", border: "none", color: "#fff", borderRadius: 4, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>Save</button>
                </div>
              ) : (
                <button onClick={() => setShowSaveInput(true)}
                  style={{ width: "100%", background: "#2563eb", border: "none", color: "#fff", borderRadius: 5, padding: "7px 0", fontSize: 12, cursor: "pointer", fontFamily: FONT }}>Save Current</button>
              )}
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 12px" }}>
            {savedDiagrams.length === 0 && <div style={{ fontSize: 12, color: "#555", textAlign: "center", padding: 20 }}>No saved diagrams.</div>}
            {savedDiagrams.map((d) => (
              <div key={d.id} style={{ padding: "8px 10px", marginBottom: 3, borderRadius: 5, background: "#1e1e20", border: "1px solid #2a2a2a", cursor: "pointer" }}
                onClick={() => loadDiagram(d)} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#444"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a2a"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: "#666", marginTop: 1 }}>{d.blocks?.length || 0} steps · {new Date(d.savedAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteDiagram(d.id); }}
                    style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #2a2a2a", background: "#161618", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setShowHistory(!showHistory)} title="Saved diagrams"
              style={{ background: showHistory ? "#2a2a2c" : "none", border: "1px solid #333", color: "#999", borderRadius: 5, padding: "4px 8px", fontSize: 12, cursor: "pointer", fontFamily: FONT }}>☰</button>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>ProcessDraw</span>
            <span style={{ fontSize: 10, color: "#444" }}>KJR Labs</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {blocks.length > 0 && !frozen && (
              <span style={{ fontSize: 10, color: "#555", marginRight: 4 }}>
                Click blocks to edit · Click arrows to toggle · END to finalize
              </span>
            )}
            <button onClick={() => setShowSettings(true)} title="Settings"
              style={{ background: "none", border: "1px solid #333", color: "#999", borderRadius: 5, padding: "4px 8px", fontSize: 12, cursor: "pointer", fontFamily: FONT }}>⚙</button>
            {blocks.length > 0 && <button onClick={newDiagram} style={{ background: "none", border: "1px solid #333", color: "#866", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>New</button>}
            {frozen && (
              <>
                <button onClick={handleUnfreeze} style={{ background: "#2a2a2c", border: "1px solid #444", color: "#ccc", borderRadius: 5, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: FONT }}>Edit</button>
                <button onClick={exportPages} disabled={exporting} style={{ background: "#2563eb", border: "none", color: "#fff", borderRadius: 5, padding: "5px 14px", fontSize: 11, cursor: exporting ? "wait" : "pointer", fontFamily: FONT, fontWeight: 500, opacity: exporting ? 0.6 : 1 }}>
                  {exporting ? "..." : numPages > 1 ? `Export (${numPages} pg)` : "Export PNG"}</button>
                <button onClick={copyToClipboard} style={{ background: "#059669", border: "none", color: "#fff", borderRadius: 5, padding: "5px 14px", fontSize: 11, cursor: "pointer", fontFamily: FONT, fontWeight: 500 }}>Copy</button>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: "auto", background: "#eae8e3" }}>
          {blocks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#333" }}>Start your process flow</div>
              <div style={{ fontSize: 13, color: "#999" }}>Click + to add your first step</div>
              <button onClick={() => setModal({ type: "new" })} style={{ width: 48, height: 48, borderRadius: "50%", background: "#2563eb", border: "none", color: "white", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 12px rgba(37,99,235,0.35)" }}>+</button>
              {savedDiagrams.length > 0 && (
                <button onClick={() => setShowHistory(true)} style={{ background: "none", border: "1px solid #ccc", color: "#888", borderRadius: 5, padding: "6px 16px", fontSize: 11, cursor: "pointer", fontFamily: FONT, marginTop: 6 }}>
                  Open saved ({savedDiagrams.length})
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "24px 0", minHeight: "100%" }}>
              <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}
                style={{ background: "white", boxShadow: "0 1px 12px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
                {renderDiagram()}
              </svg>
            </div>
          )}
        </div>
      </div>

      {modal && <TextModal title={getModalTitle()} initial={getModalInitial()} placeholder={getPlaceholder()} onConfirm={handleModalConfirm} onCancel={() => setModal(null)} />}
      {picker && <PickerModal title={`Add to ${picker.side === "left" ? "Left" : "Right"} Side`} options={SIDE_TYPES} onPick={(id: string) => { setPicker(null); setModal({ type: "side", blockId: picker.blockId, side: picker.side, sideType: id }); }} onCancel={() => setPicker(null)} />}
      {betweenPicker && <PickerModal title="Add annotation near arrow" options={BETWEEN_SIDE_OPTIONS} onPick={(id: string) => { setBetweenPicker(null); setModal({ type: "between", arrowIdx: betweenPicker.arrowIdx, side: id }); }} onCancel={() => setBetweenPicker(null)} />}
      {showSettings && <SettingsPanel settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#eee", padding: "8px 20px", borderRadius: 6, fontSize: 12, fontFamily: FONT, boxShadow: "0 4px 16px rgba(0,0,0,0.35)", zIndex: 999 }}>{toast}</div>}
    </div>
  );
}
