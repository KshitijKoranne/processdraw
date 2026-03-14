"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ==== DESIGN SYSTEM ====
const DISPLAY = "'Playfair Display', Georgia, serif";
const BODY = "'Source Sans 3', 'Segoe UI', sans-serif";
const MONO = "'IBM Plex Mono', monospace";
const C = {
  bg: "#f5f0e8",        // warm cream
  surface: "#ffffff",
  surfaceAlt: "#faf7f2",
  border: "#e2ddd3",
  borderDark: "#d1cbc0",
  text: "#2c2a26",
  textMid: "#6b6560",
  textLight: "#a09890",
  accent: "#c06030",     // warm terracotta
  accentLight: "#e8a070",
  accentBg: "#fdf5ee",
  blue: "#4a7db5",
  green: "#5a9a6a",
  red: "#b54a4a",
  sidebar: "#2c2a26",
  sidebarText: "#d5cfc5",
  sidebarMid: "#8a847a",
};

// ==== DIAGRAM CONSTANTS ====
const BLOCK_MIN_W = 180; const BLOCK_H_PAD = 28; const BLOCK_V_PAD = 16;
const LINE_H = 18; const V_GAP = 80; const SIDE_GAP = 50; const SIDE_ITEM_GAP = 10;
const CANVAS_CENTER = 400; const ARROW_SZ = 8; const A4_PAGE_H = 935; const SVG_W = 800; const FOOTER_H = 80;

const SIDE_TYPES = [
  { id: "label", name: "Label", desc: "Text annotation (e.g. Methanol)" },
  { id: "equipment", name: "Equipment Block", desc: "Side reactor, tank, etc." },
  { id: "ipqc", name: "IPQC Check", desc: "In-process quality check" },
];
const BETWEEN_SIDE_OPTIONS = [
  { id: "left", name: "Left of arrow" },
  { id: "right", name: "Right of arrow" },
];

const uid = () => "n" + Math.random().toString(36).slice(2, 8);

function textToLines(text: string, maxChars = 24) {
  if (!text) return [""];
  const words = text.split(/\s+/); const lines: string[] = []; let cur = "";
  words.forEach((w) => { if (cur && (cur + " " + w).length > maxChars) { lines.push(cur); cur = w; } else { cur = cur ? cur + " " + w : w; } });
  if (cur) lines.push(cur); return lines.length ? lines : [""];
}
function blockTextDimensions(text: string) {
  const lines = textToLines(text); const h = lines.length * LINE_H + BLOCK_V_PAD * 2;
  const maxLine = Math.max(...lines.map((l) => l.length));
  return { w: Math.max(BLOCK_MIN_W, maxLine * 8.5 + BLOCK_H_PAD * 2), h, lines };
}
function sideItemDimensions(text: string) {
  const lines = textToLines(text, 22); const h = lines.length * LINE_H + 14;
  const maxLine = Math.max(...lines.map((l) => l.length));
  return { w: Math.max(100, maxLine * 7.5 + 20), h, lines };
}
function sideStackHeight(items: any[]) {
  if (!items.length) return 0; let t = 0;
  items.forEach((item, i) => { t += sideItemDimensions(item.text).h; if (i < items.length - 1) t += SIDE_ITEM_GAP; });
  return t;
}

// ==== MODALS ====
function TextModal({ title, initial, onConfirm, onCancel, placeholder }: any) {
  const [val, setVal] = useState(initial || "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,42,38,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: "28px 32px", width: 380, boxShadow: "0 24px 80px rgba(44,42,38,0.2)", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16, fontFamily: DISPLAY }}>{title}</div>
        <textarea ref={ref} value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder || "Enter text..."} rows={3}
          style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: BODY, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
          onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.border}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (val.trim()) onConfirm(val.trim()); } }} />
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textMid, borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", fontFamily: BODY }}>Cancel</button>
          <button onClick={() => { if (val.trim()) onConfirm(val.trim()); }} disabled={!val.trim()} style={{ background: val.trim() ? C.accent : C.border, border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: val.trim() ? "pointer" : "default", fontFamily: BODY, fontWeight: 600, opacity: val.trim() ? 1 : 0.5 }}>Add</button>
        </div>
      </div>
    </div>
  );
}

function PickerModal({ title, options, onPick, onCancel }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,42,38,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: "24px 28px", width: 300, boxShadow: "0 24px 80px rgba(44,42,38,0.2)", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, fontFamily: DISPLAY }}>{title}</div>
        {options.map((opt: any) => (
          <button key={opt.id} onClick={() => onPick(opt.id)} style={{ display: "block", width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8, textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.accentBg; e.currentTarget.style.borderColor = C.accentLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.borderColor = C.border; }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: BODY }}>{opt.name}</div>
            {opt.desc && <div style={{ fontSize: 12, color: C.textLight, fontFamily: BODY, marginTop: 3 }}>{opt.desc}</div>}
          </button>
        ))}
        <button onClick={onCancel} style={{ width: "100%", background: "none", border: `1px solid ${C.border}`, color: C.textLight, borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer", fontFamily: BODY, marginTop: 4 }}>Cancel</button>
      </div>
    </div>
  );
}

// ==== HOW TO USE ====
function HowToUse({ onClose }: { onClose: () => void }) {
  const steps = [
    { num: "01", title: "Add a process step", desc: "Click the + button on the canvas to create your first equipment block. Type the name and ID (e.g. \"Reactor GLR-805\")." },
    { num: "02", title: "Add side inputs & outputs", desc: "Click the subtle + on the left or right of any block. Choose Label, Equipment Block, or IPQC Check. Add materials like \"Methanol\" or \"Purified water\"." },
    { num: "03", title: "Add annotations between steps", desc: "Click the + beside any connecting arrow to annotate it — e.g. \"Wet cake\" or \"Through SP-804\". Text appears alongside the arrow, never overlapping." },
    { num: "04", title: "Toggle arrow directions", desc: "Click any horizontal arrow to flip its direction. Useful when an output becomes an input or vice versa." },
    { num: "05", title: "Finalize & export", desc: "Click END below the last step. The diagram freezes, the footer appears, and you can Export PNG (auto-split for multi-page A4) or Copy to clipboard." },
    { num: "06", title: "Save & reload", desc: "Open the sidebar (☰) to save diagrams by name. Load any previous diagram instantly. Everything persists in your browser." },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,42,38,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 20, padding: "40px 44px", width: 520, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 32px 100px rgba(44,42,38,0.25)", border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.text, fontFamily: DISPLAY, lineHeight: 1.2 }}>How to Use</div>
            <div style={{ fontSize: 13, color: C.textLight, fontFamily: BODY, marginTop: 6 }}>Create pharma process flow diagrams in minutes</div>
          </div>
          <button onClick={onClose} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textMid, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, fontFamily: BODY, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 18, marginBottom: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.accentLight, fontFamily: DISPLAY, lineHeight: 1, minWidth: 36 }}>{s.num}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: BODY, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: C.textMid, fontFamily: BODY, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: C.textLight, fontFamily: BODY, lineHeight: 1.6 }}>
            <strong style={{ color: C.textMid }}>Tip:</strong> Set your name in ⚙ Settings — it appears as "Prepared by" in the export footer with a signature line, ready for GMP documentation.
          </div>
        </div>
      </div>
    </div>
  );
}

// ==== SVG CONTROLS ====
function PlusBtn({ x, y, size = 16, onClick, frozen }: any) {
  if (frozen) return null;
  const r = size / 2;
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.3} className="plus-btn">
      <circle cx={x} cy={y} r={r} fill="none" stroke="#8a847a" strokeWidth={1} />
      <line x1={x - 3.5} y1={y} x2={x + 3.5} y2={y} stroke="#8a847a" strokeWidth={1} />
      <line x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} stroke="#8a847a" strokeWidth={1} />
      <circle cx={x} cy={y} r={r + 6} fill="transparent" />
    </g>
  );
}
function EndBtn({ x, y, onClick, frozen }: any) {
  if (frozen) return null;
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.4}>
      <rect x={x - 20} y={y - 9} width={40} height={18} rx={3} fill="none" stroke={C.red} strokeWidth={1} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={BODY} fontSize={9} fontWeight={600} fill={C.red}>END</text>
    </g>
  );
}
function DelBtn({ cx, cy, onClick }: any) {
  return (
    <g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.25} className="del-btn">
      <circle cx={cx} cy={cy} r={7} fill="#a09890" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#fff" fontFamily={BODY}>×</text>
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
    </g>
  );
}

// ==== SETTINGS ====
function SettingsPanel({ settings, onSave, onClose }: any) {
  const [preparedBy, setPreparedBy] = useState(settings.preparedBy || "");
  const [checkedBy, setCheckedBy] = useState(settings.checkedBy || "");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,42,38,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: "32px 36px", width: 400, boxShadow: "0 24px 80px rgba(44,42,38,0.2)", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 24, fontFamily: DISPLAY }}>Settings</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: C.textMid, display: "block", marginBottom: 6, fontFamily: BODY, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Prepared By</label>
          <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name"
            style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: BODY, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: C.textMid, display: "block", marginBottom: 6, fontFamily: BODY, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Checked By</label>
          <input value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} placeholder="Reviewer name"
            style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: BODY, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 20, fontFamily: BODY, lineHeight: 1.5 }}>These appear in the export footer with signature lines.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.textMid, borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: BODY }}>Cancel</button>
          <button onClick={() => { onSave({ preparedBy, checkedBy }); onClose(); }} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer", fontFamily: BODY, fontWeight: 600 }}>Save</button>
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
  const [showHelp, setShowHelp] = useState(false);
  const [settings, setSettings] = useState({ preparedBy: "", checkedBy: "" });
  const [showHistory, setShowHistory] = useState(false);
  const [savedDiagrams, setSavedDiagrams] = useState<any[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("processdraw_settings"); if (s) setSettings(JSON.parse(s));
      const d = localStorage.getItem("processdraw_saved"); if (d) setSavedDiagrams(JSON.parse(d));
      const seen = localStorage.getItem("processdraw_seen_help"); if (!seen) { setShowHelp(true); localStorage.setItem("processdraw_seen_help", "1"); }
    } catch (e) { /* */ }
  }, []);

  const saveSettings = (s: any) => { setSettings(s); localStorage.setItem("processdraw_settings", JSON.stringify(s)); };
  const saveDiagram = (name: string) => {
    const d = { id: uid(), name, blocks, arrowAnnotations, savedAt: new Date().toISOString() };
    const u = [d, ...savedDiagrams.filter((x) => x.name !== name)];
    setSavedDiagrams(u); localStorage.setItem("processdraw_saved", JSON.stringify(u));
    showToastMsg(`Saved "${name}"`); setShowSaveInput(false); setSaveName("");
  };
  const loadDiagram = (d: any) => { setBlocks(d.blocks || []); setArrowAnnotations(d.arrowAnnotations || {}); setFrozen(false); setShowHistory(false); showToastMsg(`Loaded "${d.name}"`); };
  const deleteDiagram = (id: string) => { const u = savedDiagrams.filter((d) => d.id !== id); setSavedDiagrams(u); localStorage.setItem("processdraw_saved", JSON.stringify(u)); };
  const showToastMsg = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const addBlock = (t: string) => { setBlocks((p) => [...p, { id: uid(), text: t, leftItems: [], rightItems: [] }]); };
  const editBlock = (id: string, t: string) => { setBlocks((p) => p.map((b) => b.id === id ? { ...b, text: t } : b)); };
  const addSideItem = (bid: string, side: string, st: string, t: string) => {
    setBlocks((p) => p.map((b) => { if (b.id !== bid) return b; const item = { id: uid(), type: st, text: t, arrowDir: side === "left" ? "right" : "left" };
      return side === "left" ? { ...b, leftItems: [...b.leftItems, item] } : { ...b, rightItems: [...b.rightItems, item] }; }));
  };
  const addArrowAnnotation = (idx: number, side: string, t: string) => { setArrowAnnotations((p: any) => { const e = p[idx] || { left: [], right: [] }; const u = { ...e }; u[side] = [...u[side], { id: uid(), text: t }]; return { ...p, [idx]: u }; }); };
  const removeArrowAnnotation = (idx: number, side: string, ii: number) => { setArrowAnnotations((p: any) => { const e = p[idx]; if (!e) return p; const u = { ...e }; u[side] = u[side].filter((_: any, i: number) => i !== ii); return { ...p, [idx]: u }; }); };
  const toggleArrow = (bid: string, side: string, ii: number) => { if (frozen) return; setBlocks((p) => p.map((b) => { if (b.id !== bid) return b; const k = side === "left" ? "leftItems" : "rightItems"; const items = [...b[k]]; items[ii] = { ...items[ii], arrowDir: items[ii].arrowDir === "left" ? "right" : "left" }; return { ...b, [k]: items }; })); };
  const removeSideItem = (bid: string, side: string, ii: number) => { setBlocks((p) => p.map((b) => { if (b.id !== bid) return b; const k = side === "left" ? "leftItems" : "rightItems"; return { ...b, [k]: b[k].filter((_: any, i: number) => i !== ii) }; })); };
  const removeBlock = (id: string) => { setBlocks((p) => p.filter((b) => b.id !== id)); };
  const handleEnd = () => setFrozen(true);
  const handleUnfreeze = () => setFrozen(false);
  const newDiagram = () => { setBlocks([]); setArrowAnnotations({}); setFrozen(false); };

  const svgToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!svgRef.current) return null; const el = svgRef.current; const d = new XMLSerializer().serializeToString(el);
    const vb = el.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, SVG_W, 600];
    const s = 2; const w = vb[2] * s; const h = vb[3] * s; const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h);
    const img = new Image(); const blob = new Blob([d], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob);
    return new Promise((r) => { img.onload = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); r(cv); }; img.onerror = () => { URL.revokeObjectURL(url); r(null); }; img.src = url; });
  }, []);

  const exportPages = useCallback(async () => {
    setExporting(true); const fc = await svgToCanvas(); if (!fc) { setExporting(false); return; }
    const s = 2; const pW = SVG_W * s; const pH = A4_PAGE_H * s; const tH = fc.height; const nP = Math.ceil(tH / pH);
    for (let p = 0; p < nP; p++) {
      const sc = document.createElement("canvas"); sc.width = pW; sc.height = Math.min(pH, tH - p * pH);
      const ctx = sc.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, sc.width, sc.height);
      ctx.drawImage(fc, 0, p * pH, pW, sc.height, 0, 0, pW, sc.height);
      await new Promise<void>((r) => { sc.toBlob((b: any) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nP === 1 ? "ProcessDraw_Diagram.png" : `ProcessDraw_Page_${p + 1}.png`; a.click(); setTimeout(r, 300); }, "image/png"); });
    }
    showToastMsg(nP === 1 ? "Exported!" : `${nP} pages exported!`); setExporting(false);
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
      const blockH = Math.max(td.h, Math.max(sideStackHeight(block.leftItems), sideStackHeight(block.rightItems)) + 24);
      const blockW = td.w; const bx = CANVAS_CENTER - blockW / 2; const by = y;
      const layoutSide = (items: any[], side: string) => {
        const sH = sideStackHeight(items); let iy = by + (blockH - sH) / 2;
        return items.map((item: any, idx: number) => { const sd = sideItemDimensions(item.text);
          const p = { ...sd, x: side === "left" ? bx - SIDE_GAP - sd.w : bx + blockW + SIDE_GAP, y: iy, item, idx, anchorY: iy + sd.h / 2 };
          iy += sd.h + SIDE_ITEM_GAP; return p; });
      };
      positions.push({ block, bx, by, blockW, blockH, textLines: td.lines, leftPositions: layoutSide(block.leftItems, "left"), rightPositions: layoutSide(block.rightItems, "right") });
      y += blockH + V_GAP;
    });
    const dH = y + 20; return { positions, totalH: frozen ? dH + FOOTER_H + 20 : dH + 40, totalW: SVG_W, diagramEndY: dH };
  }, [blocks, frozen]);

  const { positions, totalH, totalW, diagramEndY } = layout();
  const numPages = Math.max(1, Math.ceil(totalH / A4_PAGE_H));

  // ==== RENDER SVG ====
  const renderDiagram = () => {
    const els: any[] = [];
    // Page guides
    for (let p = 1; p < numPages; p++) {
      const gy = p * A4_PAGE_H;
      els.push(<line key={`pg-${p}`} x1={40} y1={gy} x2={totalW - 40} y2={gy} stroke="#d8d3ca" strokeWidth={0.5} strokeDasharray="5 4" />);
      els.push(<text key={`pl-${p}`} x={totalW - 40} y={gy - 5} textAnchor="end" fontFamily={BODY} fontSize={8} fill="#c5c0b5">page {p + 1}</text>);
    }

    positions.forEach((pos, i) => {
      const { block, bx, by, blockW, blockH, textLines, leftPositions, rightPositions } = pos;

      els.push(<rect key={`b-${i}`} x={bx} y={by} width={blockW} height={blockH} fill="white" stroke="#2c2a26" strokeWidth={1.4} rx={1}
        style={{ cursor: frozen ? "default" : "pointer" }} onClick={() => { if (!frozen) setModal({ type: "edit", blockId: block.id }); }} />);

      const tY = by + blockH / 2 - ((textLines.length - 1) * LINE_H) / 2;
      textLines.forEach((line: string, li: number) => {
        els.push(<text key={`bt-${i}-${li}`} x={bx + blockW / 2} y={tY + li * LINE_H} textAnchor="middle" dominantBaseline="central"
          fontFamily={BODY} fontSize={13} fontWeight="600" fill="#2c2a26" style={{ pointerEvents: "none" }}>{line}</text>);
      });

      if (!frozen) els.push(<DelBtn key={`del-${i}`} cx={bx + blockW + 3} cy={by - 3} onClick={(e: any) => { e.stopPropagation(); removeBlock(block.id); }} />);

      // Arrow to next
      if (i < positions.length - 1) {
        const nP = positions[i + 1]; const aS = by + blockH; const aE = nP.by; const mY = (aS + aE) / 2;
        els.push(<line key={`arr-${i}`} x1={CANVAS_CENTER} y1={aS} x2={CANVAS_CENTER} y2={aE} stroke="#2c2a26" strokeWidth={1.2} />);
        els.push(<polygon key={`arh-${i}`} points={`${CANVAS_CENTER},${aE} ${CANVAS_CENTER - ARROW_SZ / 2},${aE - ARROW_SZ} ${CANVAS_CENTER + ARROW_SZ / 2},${aE - ARROW_SZ}`} fill="#2c2a26" />);

        const ann = arrowAnnotations[i] || { left: [], right: [] };
        let annBottomY = mY;
        (["left", "right"] as const).forEach((side) => {
          const items = ann[side] || []; if (!items.length) return;
          const totalAH = items.reduce((a: number, x: any) => a + sideItemDimensions(x.text).h + 4, -4);
          let aY = mY - totalAH / 2;
          items.forEach((a: any, ai: number) => {
            const sd = sideItemDimensions(a.text); const cY = aY + sd.h / 2;
            const aX = side === "left" ? CANVAS_CENTER - 16 : CANVAS_CENTER + 16;
            if (aY + sd.h > annBottomY) annBottomY = aY + sd.h;
            sd.lines.forEach((sl: string, sli: number) => {
              els.push(<text key={`an-${side}-${i}-${ai}-${sli}`} x={aX} y={cY - ((sd.lines.length - 1) * 14) / 2 + sli * 14}
                textAnchor={side === "left" ? "end" : "start"} dominantBaseline="central" fontFamily={BODY} fontSize={11} fill="#2c2a26" style={{ pointerEvents: "none" }}>{sl}</text>);
            });
            if (!frozen) { const dx = side === "left" ? aX - sd.w - 6 : aX + sd.w + 6;
              els.push(<DelBtn key={`andel-${side}-${i}-${ai}`} cx={dx} cy={cY} onClick={() => removeArrowAnnotation(i, side, ai)} />); }
            aY += sd.h + 4;
          });
        });

        if (!frozen) {
          const hasAnn = (ann.left?.length || 0) + (ann.right?.length || 0) > 0;
          const btnY = hasAnn ? annBottomY + 12 : mY;
          els.push(<PlusBtn key={`pb-${i}`} x={CANVAS_CENTER + 16} y={btnY} size={14} onClick={() => setBetweenPicker({ arrowIdx: i })} frozen={frozen} />);
        }
      }

      // Side items
      const renderSide = (sps: any[], side: string) => {
        sps.forEach((sp: any) => {
          const { x: sx, y: sy, w: sw, h: sh, lines: sl, item, idx: si, anchorY } = sp;
          const isBox = item.type === "equipment" || item.type === "ipqc";
          if (isBox) els.push(<rect key={`${side}b-${i}-${si}`} x={sx} y={sy} width={sw} height={sh} fill="white" stroke="#2c2a26" strokeWidth={1} rx={1} />);
          const tY2 = sy + sh / 2 - ((sl.length - 1) * 14) / 2;
          sl.forEach((s: string, sli: number) => {
            els.push(<text key={`${side}t-${i}-${si}-${sli}`} x={isBox ? sx + sw / 2 : (side === "left" ? sx + sw : sx)} y={tY2 + sli * 14}
              textAnchor={isBox ? "middle" : (side === "left" ? "end" : "start")} dominantBaseline="central"
              fontFamily={BODY} fontSize={11} fill="#2c2a26" style={{ pointerEvents: "none" }}>{s}</text>);
          });
          const l1 = side === "left" ? sx + sw + 4 : bx + blockW + 4; const l2 = side === "left" ? bx - 4 : sx - 4;
          const hX = item.arrowDir === "right" ? Math.max(l1, l2) : Math.min(l1, l2);
          const ah = item.arrowDir === "right" ? `${hX},${anchorY} ${hX - ARROW_SZ},${anchorY - ARROW_SZ / 2} ${hX - ARROW_SZ},${anchorY + ARROW_SZ / 2}` : `${hX},${anchorY} ${hX + ARROW_SZ},${anchorY - ARROW_SZ / 2} ${hX + ARROW_SZ},${anchorY + ARROW_SZ / 2}`;
          els.push(<line key={`${side}a-${i}-${si}`} x1={Math.min(l1, l2) + 4} y1={anchorY} x2={Math.max(l1, l2) - 4} y2={anchorY} stroke="#2c2a26" strokeWidth={1} style={{ cursor: frozen ? "default" : "pointer" }} onClick={() => toggleArrow(block.id, side, si)} />);
          els.push(<polygon key={`${side}ah-${i}-${si}`} points={ah} fill="#2c2a26" style={{ cursor: frozen ? "default" : "pointer" }} onClick={() => toggleArrow(block.id, side, si)} />);
          if (!frozen) els.push(<DelBtn key={`${side}del-${i}-${si}`} cx={side === "left" ? sx - 4 : sx + sw + 4} cy={sy - 4} onClick={() => removeSideItem(block.id, side, si)} />);
        });
      };
      renderSide(leftPositions, "left"); renderSide(rightPositions, "right");

      if (!frozen) {
        const lby = leftPositions.length ? leftPositions[leftPositions.length - 1].y + leftPositions[leftPositions.length - 1].h + 14 : by + blockH / 2;
        const rby = rightPositions.length ? rightPositions[rightPositions.length - 1].y + rightPositions[rightPositions.length - 1].h + 14 : by + blockH / 2;
        els.push(<PlusBtn key={`pl-${i}`} x={bx - SIDE_GAP / 2} y={lby} size={14} onClick={() => setPicker({ blockId: block.id, side: "left" })} frozen={frozen} />);
        els.push(<PlusBtn key={`pr-${i}`} x={bx + blockW + SIDE_GAP / 2} y={rby} size={14} onClick={() => setPicker({ blockId: block.id, side: "right" })} frozen={frozen} />);
      }
      if (i === positions.length - 1 && !frozen) {
        const bY = by + blockH + 32;
        els.push(<PlusBtn key="plus-end" x={CANVAS_CENTER - 24} y={bY} size={16} onClick={() => setModal({ type: "new" })} frozen={frozen} />);
        els.push(<EndBtn key="end-btn" x={CANVAS_CENTER + 24} y={bY} onClick={handleEnd} frozen={frozen} />);
      }
    });

    // Footer
    if (frozen && blocks.length > 0) {
      const fY = diagramEndY + 10; const lW = 140; const c1 = 60; const c2 = SVG_W / 2 + 30;
      const dt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      els.push(<line key="fs" x1={40} y1={fY} x2={SVG_W - 40} y2={fY} stroke="#d1cbc0" strokeWidth={0.5} />);
      els.push(<text key="fpl" x={c1} y={fY + 20} fontFamily={BODY} fontSize={11} fill="#2c2a26" fontWeight="600">Prepared by:</text>);
      els.push(<text key="fpn" x={c1 + 82} y={fY + 20} fontFamily={BODY} fontSize={11} fill="#2c2a26">{settings.preparedBy || "___________"}</text>);
      els.push(<text key="fpsl" x={c1} y={fY + 44} fontFamily={BODY} fontSize={10} fill="#a09890">Sign:</text>);
      els.push(<line key="fpsig" x1={c1 + 35} y1={fY + 44} x2={c1 + 35 + lW} y2={fY + 44} stroke="#2c2a26" strokeWidth={0.8} />);
      els.push(<text key="fcl" x={c2} y={fY + 20} fontFamily={BODY} fontSize={11} fill="#2c2a26" fontWeight="600">Checked by:</text>);
      els.push(<text key="fcn" x={c2 + 80} y={fY + 20} fontFamily={BODY} fontSize={11} fill="#2c2a26">{settings.checkedBy || "___________"}</text>);
      els.push(<text key="fcsl" x={c2} y={fY + 44} fontFamily={BODY} fontSize={10} fill="#a09890">Sign:</text>);
      els.push(<line key="fcsig" x1={c2 + 35} y1={fY + 44} x2={c2 + 35 + lW} y2={fY + 44} stroke="#2c2a26" strokeWidth={0.8} />);
      els.push(<text key="fdt" x={SVG_W - 60} y={fY + 20} textAnchor="end" fontFamily={BODY} fontSize={10} fill="#a09890">Date: {dt}</text>);
    }
    return els;
  };

  // Modal handlers
  const handleModalConfirm = (t: string) => {
    if (!modal) return;
    if (modal.type === "new") addBlock(t); else if (modal.type === "edit") editBlock(modal.blockId, t);
    else if (modal.type === "side") addSideItem(modal.blockId, modal.side, modal.sideType, t);
    else if (modal.type === "between") addArrowAnnotation(modal.arrowIdx, modal.side, t);
    setModal(null);
  };
  const getModalTitle = () => { if (!modal) return ""; if (modal.type === "new") return "Add Process Step"; if (modal.type === "edit") return "Edit Block"; if (modal.type === "side") { const s = SIDE_TYPES.find((x) => x.id === modal.sideType); return `Add ${s?.name || "Item"}`; } if (modal.type === "between") return "Add Annotation"; return ""; };
  const getModalInitial = () => modal?.type === "edit" ? blocks.find((b: any) => b.id === modal.blockId)?.text || "" : "";
  const getPlaceholder = () => { if (modal?.type === "side") { if (modal.sideType === "label") return "e.g. Methanol"; if (modal.sideType === "equipment") return "e.g. Reactor SSR-806"; if (modal.sideType === "ipqc") return "e.g. IPQC: %LOD NMT 0.5%"; } if (modal?.type === "between") return "e.g. Wet cake"; return "e.g. Reactor GLR-805"; };

  // Button style helper
  const tbtn = (bg: string, color: string, border?: string) => ({
    background: bg, border: border ? `1px solid ${border}` : "none", color, borderRadius: 6,
    padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: BODY, fontWeight: 500 as const,
  });

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: BODY, background: C.bg, color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style>{`
        .plus-btn:hover { opacity: 0.6 !important; }
        .del-btn:hover { opacity: 0.6 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.borderDark}; border-radius: 3px; }
      `}</style>

      {/* Sidebar */}
      {showHistory && (
        <div style={{ width: 260, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #3a3835", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.sidebarText, fontFamily: DISPLAY }}>Saved Diagrams</span>
            <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", color: C.sidebarMid, cursor: "pointer", fontSize: 16, fontFamily: BODY }}>×</button>
          </div>
          {blocks.length > 0 && (
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #3a3835" }}>
              {showSaveInput ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name..." autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && saveName.trim()) saveDiagram(saveName.trim()); }}
                    style={{ flex: 1, background: "#3a3835", border: "none", color: C.sidebarText, borderRadius: 5, padding: "6px 10px", fontSize: 12, fontFamily: BODY, outline: "none" }} />
                  <button onClick={() => { if (saveName.trim()) saveDiagram(saveName.trim()); }} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 5, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: BODY, fontWeight: 600 }}>Save</button>
                </div>
              ) : (
                <button onClick={() => setShowSaveInput(true)} style={{ width: "100%", background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "8px 0", fontSize: 12, cursor: "pointer", fontFamily: BODY, fontWeight: 600 }}>Save Current</button>
              )}
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {savedDiagrams.length === 0 && <div style={{ fontSize: 12, color: C.sidebarMid, textAlign: "center", padding: 24, fontFamily: BODY }}>No saved diagrams yet.</div>}
            {savedDiagrams.map((d) => (
              <div key={d.id} style={{ padding: "10px 12px", marginBottom: 4, borderRadius: 6, background: "#3a3835", cursor: "pointer", transition: "all 0.15s" }}
                onClick={() => loadDiagram(d)} onMouseEnter={(e) => { e.currentTarget.style.background = "#4a4845"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#3a3835"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.sidebarText }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: C.sidebarMid, marginTop: 2, fontFamily: MONO }}>{d.blocks?.length || 0} steps · {new Date(d.savedAt).toLocaleDateString()}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteDiagram(d.id); }} style={{ background: "none", border: "none", color: C.sidebarMid, cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px", borderBottom: `1px solid ${C.border}`, background: C.surface, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setShowHistory(!showHistory)} style={{ ...tbtn(showHistory ? C.surfaceAlt : "transparent", C.textMid, C.border), padding: "5px 9px" }}>☰</button>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: DISPLAY, color: C.text }}>ProcessDraw</span>
            <span style={{ fontSize: 10, color: C.textLight, fontFamily: MONO, letterSpacing: 0.5 }}>KJR LABS</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {blocks.length > 0 && !frozen && <span style={{ fontSize: 11, color: C.textLight, marginRight: 4, fontFamily: BODY }}>Click blocks to edit · Arrows to toggle · END to finalize</span>}
            <button onClick={() => setShowHelp(true)} style={{ ...tbtn("transparent", C.textMid, C.border), padding: "5px 9px" }}>?</button>
            <button onClick={() => setShowSettings(true)} style={{ ...tbtn("transparent", C.textMid, C.border), padding: "5px 9px" }}>⚙</button>
            {blocks.length > 0 && <button onClick={newDiagram} style={tbtn("transparent", C.red, C.border)}>New</button>}
            {frozen && (
              <>
                <button onClick={handleUnfreeze} style={tbtn(C.surfaceAlt, C.textMid, C.border)}>Edit</button>
                <button onClick={exportPages} disabled={exporting} style={{ ...tbtn(C.accent, "#fff"), opacity: exporting ? 0.6 : 1 }}>{exporting ? "..." : numPages > 1 ? `Export (${numPages} pg)` : "Export PNG"}</button>
                <button onClick={copyToClipboard} style={tbtn(C.green, "#fff")}>Copy</button>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: "auto", background: C.bg }}>
          {blocks.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.text, fontFamily: DISPLAY }}>Process Flow Diagram</div>
              <div style={{ fontSize: 14, color: C.textMid, fontFamily: BODY }}>Click + to add your first process step</div>
              <button onClick={() => setModal({ type: "new" })} style={{
                width: 52, height: 52, borderRadius: "50%", background: C.accent, border: "none", color: "white",
                fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 16px rgba(192,96,48,0.3)`, fontFamily: BODY, marginTop: 4
              }}>+</button>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                {savedDiagrams.length > 0 && <button onClick={() => setShowHistory(true)} style={{ ...tbtn("transparent", C.textMid, C.border), fontSize: 12 }}>Open saved ({savedDiagrams.length})</button>}
                <button onClick={() => setShowHelp(true)} style={{ ...tbtn("transparent", C.textMid, C.border), fontSize: 12 }}>How to use</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "28px 0", minHeight: "100%" }}>
              <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}
                style={{ background: "white", boxShadow: "0 1px 8px rgba(44,42,38,0.08)", flexShrink: 0 }}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap');`}</style>
                {renderDiagram()}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {modal && <TextModal title={getModalTitle()} initial={getModalInitial()} placeholder={getPlaceholder()} onConfirm={handleModalConfirm} onCancel={() => setModal(null)} />}
      {picker && <PickerModal title={`Add to ${picker.side === "left" ? "Left" : "Right"} Side`} options={SIDE_TYPES} onPick={(id: string) => { setPicker(null); setModal({ type: "side", blockId: picker.blockId, side: picker.side, sideType: id }); }} onCancel={() => setPicker(null)} />}
      {betweenPicker && <PickerModal title="Add Annotation" options={BETWEEN_SIDE_OPTIONS} onPick={(id: string) => { setBetweenPicker(null); setModal({ type: "between", arrowIdx: betweenPicker.arrowIdx, side: id }); }} onCancel={() => setBetweenPicker(null)} />}
      {showSettings && <SettingsPanel settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />}
      {showHelp && <HowToUse onClose={() => setShowHelp(false)} />}
      {toast && <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.sidebar, color: C.sidebarText, padding: "10px 24px", borderRadius: 8, fontSize: 13, fontFamily: BODY, boxShadow: "0 6px 24px rgba(44,42,38,0.3)", zIndex: 999 }}>{toast}</div>}
    </div>
  );
}
