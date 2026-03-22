"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const HEADING = "'Fraunces', 'Georgia', serif";
const BODY = "'Outfit', 'Helvetica Neue', sans-serif";
const SVG_FONT = "'Outfit', sans-serif";
const C = { bg: "#f6f3ee", surface: "#ffffff", sidebar: "#faf8f5", border: "#e5e0d8", borderLight: "#ede9e2", text: "#2c2824", textMuted: "#8a8078", textLight: "#b5ada5", accent: "#3d8b8b", accentLight: "#e8f3f3", danger: "#c47a6a", success: "#5a9e7a" };
const BLOCK_MIN_W = 180; const BLOCK_H_PAD = 28; const BLOCK_V_PAD = 16; const LINE_H = 18; const V_GAP = 80; const SIDE_GAP = 50; const SIDE_ITEM_GAP = 10; const CANVAS_CENTER = 400; const ARROW_SZ = 8; const A4_PAGE_H = 935; const SVG_W = 800; const FOOTER_H = 80;
const SIDE_TYPES = [{ id: "label", name: "Label", desc: "Text annotation (e.g. Methanol)" }, { id: "equipment", name: "Equipment Block", desc: "Side reactor, tank, etc." }, { id: "ipqc", name: "IPQC Check", desc: "In-process quality check" }];
const BETWEEN_OPTS = [{ id: "left", name: "Add to Left of Arrow" }, { id: "right", name: "Add to Right of Arrow" }];
const uid = () => "n" + Math.random().toString(36).slice(2, 8);
const btnS = (bg: string, color: string, border?: string): any => ({ background: bg, color, border: border || "none", borderRadius: 6, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: BODY, fontWeight: 500, transition: "all 0.15s" });

function textToLines(text: string, mc = 24) { if (!text) return [""]; const w = text.split(/\s+/); const l: string[] = []; let c = ""; w.forEach((x) => { if (c && (c + " " + x).length > mc) { l.push(c); c = x; } else { c = c ? c + " " + x : x; } }); if (c) l.push(c); return l.length ? l : [""]; }
function blockTextDim(text: string) { const l = textToLines(text); const h = l.length * LINE_H + BLOCK_V_PAD * 2; const mx = Math.max(...l.map((x) => x.length)); return { w: Math.max(BLOCK_MIN_W, mx * 8.5 + BLOCK_H_PAD * 2), h, lines: l }; }
function sideDim(text: string) { const l = textToLines(text, 22); const h = l.length * LINE_H + 14; const mx = Math.max(...l.map((x) => x.length)); return { w: Math.max(100, mx * 7.5 + 20), h, lines: l }; }
function sideStackH(items: any[]) { if (!items.length) return 0; let t = 0; items.forEach((it, i) => { t += sideDim(it.text).h; if (i < items.length - 1) t += SIDE_ITEM_GAP; }); return t; }

function TextModal({ title, initial, onConfirm, onCancel, placeholder }: any) {
  const [val, setVal] = useState(initial || ""); const ref = useRef<HTMLTextAreaElement>(null); useEffect(() => { ref.current?.focus(); }, []);
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(44,40,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 14, padding: "28px 30px", width: 380, boxShadow: "0 24px 80px rgba(44,40,36,0.18)", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16, fontFamily: HEADING }}>{title}</div>
      <textarea ref={ref} value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder || "Enter text..."} rows={3}
        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: BODY, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
        onFocus={(e) => e.target.style.borderColor = C.accent} onBlur={(e) => e.target.style.borderColor = C.border}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (val.trim()) onConfirm(val.trim()); } }} />
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btnS(C.bg, C.textMuted, `1px solid ${C.border}`)}>Cancel</button>
        <button onClick={() => { if (val.trim()) onConfirm(val.trim()); }} disabled={!val.trim()} style={{ ...btnS(val.trim() ? C.accent : C.borderLight, "#fff"), opacity: val.trim() ? 1 : 0.5 }}>OK</button>
      </div></div></div>);
}

function PickerModal({ title, options, onPick, onCancel }: any) {
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(44,40,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }} onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 14, padding: "22px 26px", width: 300, boxShadow: "0 24px 80px rgba(44,40,36,0.18)", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 14, fontFamily: HEADING }}>{title}</div>
      {options.map((o: any) => (<button key={o.id} onClick={() => onPick(o.id)} style={{ display: "block", width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 6, textAlign: "left", cursor: "pointer", transition: "all 0.12s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = C.accentLight; e.currentTarget.style.borderColor = C.accent; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, fontFamily: BODY }}>{o.name}</div>
        {o.desc && <div style={{ fontSize: 11, color: C.textMuted, fontFamily: BODY, marginTop: 2 }}>{o.desc}</div>}</button>))}
      <button onClick={onCancel} style={{ ...btnS(C.surface, C.textMuted, `1px solid ${C.border}`), width: "100%", marginTop: 4 }}>Cancel</button>
    </div></div>);
}

function PlusBtn({ x, y, size = 16, onClick, frozen }: any) { if (frozen) return null; return (<g className="pd-plus" style={{ cursor: "pointer" }} onClick={onClick}><circle cx={x} cy={y} r={size / 2} fill="none" stroke={C.textMuted} strokeWidth={1} /><line x1={x - 3.5} y1={y} x2={x + 3.5} y2={y} stroke={C.textMuted} strokeWidth={1} /><line x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} stroke={C.textMuted} strokeWidth={1} /><circle cx={x} cy={y} r={size / 2 + 6} fill="transparent" /></g>); }
function EndBtn({ x, y, onClick, frozen }: any) { if (frozen) return null; return (<g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.45}><rect x={x - 20} y={y - 9} width={40} height={18} rx={3} fill="none" stroke={C.danger} strokeWidth={1} /><text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontFamily={BODY} fontSize={9} fontWeight={500} fill={C.danger}>END</text></g>); }
function DelBtn({ cx, cy, onClick }: any) { return (<g style={{ cursor: "pointer" }} onClick={onClick} opacity={0.35}><circle cx={cx} cy={cy} r={7} fill={C.textMuted} /><text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#fff" fontFamily={BODY}>×</text><circle cx={cx} cy={cy} r={12} fill="transparent" /></g>); }

function SettingsPanel({ settings, onSave, onClose }: any) {
  const [pBy, setPBy] = useState(settings.preparedBy || ""); const [cBy, setCBy] = useState(settings.checkedBy || "");
  const iS: any = { width: "100%", background: C.bg, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: "8px 12px", fontSize: 14, fontFamily: BODY, outline: "none", boxSizing: "border-box" };
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(44,40,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 14, padding: "28px 32px", width: 400, boxShadow: "0 24px 80px rgba(44,40,36,0.18)", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20, fontFamily: HEADING }}>Settings</div>
      <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4, fontFamily: BODY }}>Prepared By</label><input value={pBy} onChange={(e) => setPBy(e.target.value)} placeholder="Your name" style={iS} /></div>
      <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, color: C.textMuted, display: "block", marginBottom: 4, fontFamily: BODY }}>Checked By</label><input value={cBy} onChange={(e) => setCBy(e.target.value)} placeholder="Reviewer name" style={iS} /></div>
      <div style={{ fontSize: 11, color: C.textLight, marginBottom: 16, fontFamily: BODY, lineHeight: 1.5 }}>These names appear in the footer of every exported diagram.</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button onClick={onClose} style={btnS(C.bg, C.textMuted, `1px solid ${C.border}`)}>Cancel</button><button onClick={() => { onSave({ preparedBy: pBy, checkedBy: cBy }); onClose(); }} style={btnS(C.accent, "#fff")}>Save</button></div>
    </div></div>);
}

function HowToUse({ onClose }: { onClose: () => void }) {
  const steps = [
    { n: "1", t: "Add process steps", d: "Click the + button to add your first equipment block. Enter the name and ID (e.g. \"Reactor\\nGLR-805\"). Use a newline for multi-line text. The rectangle auto-sizes." },
    { n: "2", t: "Add side inputs & outputs", d: "Click the small ○ on the left or right of any block. Choose Label (for text like \"Methanol\"), Equipment Block (side reactor), or IPQC Check. Each gets its own arrow connecting to the main block." },
    { n: "3", t: "Toggle arrow direction", d: "Click any horizontal arrow to flip its direction — useful for distinguishing inputs flowing in vs outputs flowing out." },
    { n: "4", t: "Annotate between steps", d: "Click the ○ between two blocks to add text labels alongside the connecting arrow (e.g. \"Wet cake\", \"Filtrate\", \"Through SP-804\")." },
    { n: "5", t: "Finalize & export", d: "Click END to freeze the diagram. A footer with Prepared by / Checked by and signature lines appears. Export as PNG (auto-split for multi-page A4) or copy to clipboard for pasting into Word." },
    { n: "6", t: "Save & reload", d: "Use the ☰ sidebar to save diagrams by name. They persist in your browser. Come back and reload any time." },
  ];
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(44,40,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: "36px 40px", width: 520, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(44,40,36,0.2)", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: HEADING, marginBottom: 4 }}>How to use ProcessDraw</div>
      <div style={{ fontSize: 13, color: C.textMuted, fontFamily: BODY, marginBottom: 28, lineHeight: 1.5 }}>Create clean, standardized process flow diagrams for pharma API manufacturing — no design skills needed.</div>
      {steps.map((s) => (<div key={s.n} style={{ display: "flex", gap: 16, marginBottom: 22 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accentLight, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: HEADING, flexShrink: 0 }}>{s.n}</div>
        <div><div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: BODY, marginBottom: 3 }}>{s.t}</div><div style={{ fontSize: 12.5, color: C.textMuted, fontFamily: BODY, lineHeight: 1.55 }}>{s.d}</div></div></div>))}
      <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: 16, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: C.textLight, fontFamily: BODY }}>Set your name in ⚙ Settings before exporting.</div>
        <button onClick={onClose} style={btnS(C.accent, "#fff")}>Got it</button></div>
    </div></div>);
}

export default function ProcessDrawV2({ cloud }: { cloud?: any }) {
  const [blocks, setBlocks] = useState<any[]>([]); const [arrowAnn, setArrowAnn] = useState<any>({}); const [frozen, setFrozen] = useState(false);
  const [modal, setModal] = useState<any>(null); const [picker, setPicker] = useState<any>(null); const [betweenPicker, setBetweenPicker] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null); const [exporting, setExporting] = useState(false); const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ preparedBy: "", checkedBy: "" }); const [showHistory, setShowHistory] = useState(false); const [savedDiagrams, setSavedDiagrams] = useState<any[]>([]);
  const [saveName, setSaveName] = useState(""); const [showSaveInput, setShowSaveInput] = useState(false); const [showHelp, setShowHelp] = useState(false); const svgRef = useRef<SVGSVGElement>(null);
  const [rejectModal, setRejectModal] = useState<any>(null); // { diagramId, diagramName }
  const [rejectComment, setRejectComment] = useState("");

  // Cloud mode: diagrams come from cloud prop; Local mode: localStorage
  const isCloud = !!cloud;
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [currentDiagramStatus, setCurrentDiagramStatus] = useState<string>("draft");
  const [currentDiagramMeta, setCurrentDiagramMeta] = useState<any>(null); // { ownerName, approvedByName }

  useEffect(() => { if (!isCloud) { try { const s = localStorage.getItem("processdraw_settings"); if (s) setSettings(JSON.parse(s)); const d = localStorage.getItem("processdraw_saved"); if (d) setSavedDiagrams(JSON.parse(d)); } catch (e) {} } }, [isCloud]);
  useEffect(() => { if (isCloud && cloud.diagrams) setSavedDiagrams(cloud.diagrams); }, [isCloud, cloud?.diagrams]);

  const saveSettings = (s: any) => { setSettings(s); localStorage.setItem("processdraw_settings", JSON.stringify(s)); };

  const saveDiagram = async (name: string) => {
    if (isCloud) {
      try { await cloud.onSave(name, blocks, arrowAnn, settings, currentDiagramId || undefined); showT(`Saved "${name}"`); }
      catch (e: any) { showT(e.message || "Save failed"); }
    } else {
      const d = { id: uid(), name, blocks, arrowAnnotations: arrowAnn, savedAt: new Date().toISOString() };
      const u = [d, ...savedDiagrams.filter((x: any) => x.name !== name)]; setSavedDiagrams(u);
      localStorage.setItem("processdraw_saved", JSON.stringify(u)); showT(`Saved "${name}"`);
    }
    setShowSaveInput(false); setSaveName("");
  };

  const loadDiagram = (d: any) => {
    setBlocks(d.blocks || []); setArrowAnn(d.arrowAnnotations || {});
    if (d.settings) setSettings(d.settings);
    if (d._id) setCurrentDiagramId(d._id);
    setCurrentDiagramStatus(d.status || "draft");
    setCurrentDiagramMeta({ ownerName: d.ownerName || cloud?.userName, approvedByName: d.approvedByName });
    setFrozen(false); setShowHistory(false); showT(`Loaded "${d.name}"`);
  };

  const deleteDiagram = async (id: string) => {
    if (isCloud) { try { await cloud.onDelete(id); } catch (e: any) { showT(e.message || "Delete failed"); } }
    else { const u = savedDiagrams.filter((d: any) => d.id !== id); setSavedDiagrams(u); localStorage.setItem("processdraw_saved", JSON.stringify(u)); }
  };

  const submitForApproval = async () => {
    if (isCloud && currentDiagramId) {
      try { await cloud.onSubmit(currentDiagramId); showT("Submitted for approval"); } catch (e: any) { showT(e.message || "Submit failed"); }
    }
  };

  const reviewDiagram = async (id: string, decision: string, comment?: string) => {
    if (isCloud) {
      try { await cloud.onReview(id, decision, comment); showT(decision === "approved" ? "Approved!" : "Rejected"); } catch (e: any) { showT(e.message || "Review failed"); }
    }
  };

  const reviseDiagram = async (id: string) => {
    if (isCloud && cloud.onRevise) {
      try { await cloud.onRevise(id); showT("Diagram reverted to draft — edit and resubmit"); } catch (e: any) { showT(e.message || "Revise failed"); }
    }
  };
  const showT = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const addBlock = (t: string) => { setBlocks((p) => [...p, { id: uid(), text: t, leftItems: [], rightItems: [] }]); };
  const editBlock = (id: string, t: string) => { setBlocks((p) => p.map((b) => b.id === id ? { ...b, text: t } : b)); };
  const addSideItem = (bid: string, side: string, st: string, t: string) => { setBlocks((p) => p.map((b) => { if (b.id !== bid) return b; const it = { id: uid(), type: st, text: t, arrowDir: side === "left" ? "right" : "left" }; return side === "left" ? { ...b, leftItems: [...b.leftItems, it] } : { ...b, rightItems: [...b.rightItems, it] }; })); };
  const addAnn = (idx: number, side: string, t: string) => { setArrowAnn((p: any) => { const e = p[idx] || { left: [], right: [] }; const u = { ...e }; u[side] = [...u[side], { id: uid(), text: t }]; return { ...p, [idx]: u }; }); };
  const removeAnn = (idx: number, side: string, ii: number) => { setArrowAnn((p: any) => { const e = p[idx]; if (!e) return p; const u = { ...e }; u[side] = u[side].filter((_: any, i: number) => i !== ii); return { ...p, [idx]: u }; }); };
  const toggleArrow = (bid: string, side: string, ii: number) => { if (frozen) return; setBlocks((p) => p.map((b) => { if (b.id !== bid) return b; const k = side === "left" ? "leftItems" : "rightItems"; const items = [...b[k]]; items[ii] = { ...items[ii], arrowDir: items[ii].arrowDir === "left" ? "right" : "left" }; return { ...b, [k]: items }; })); };
  const removeSI = (bid: string, side: string, ii: number) => { setBlocks((p) => p.map((b) => { if (b.id !== bid) return b; const k = side === "left" ? "leftItems" : "rightItems"; return { ...b, [k]: b[k].filter((_: any, i: number) => i !== ii) }; })); };
  const removeBlock = (id: string) => { setBlocks((p) => p.filter((b) => b.id !== id)); };
  const handleEnd = () => setFrozen(true); const handleUnfreeze = () => setFrozen(false); const newDiag = () => { setBlocks([]); setArrowAnn({}); setFrozen(false); setCurrentDiagramId(null); setCurrentDiagramStatus("draft"); setCurrentDiagramMeta(null); };

  const svgToCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!svgRef.current) return null;
    const el = svgRef.current;
    const data = new XMLSerializer().serializeToString(el);
    const vb = el.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, SVG_W, 600];
    const s = 2; const w = vb[2] * s; const h = vb[3] * s;
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, w, h);
    const img = new Image();
    const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    return new Promise((res) => {
      img.onload = () => { ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url); res(cv); };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }, []);

  const exportPages = useCallback(async () => {
    setExporting(true);
    const fc = await svgToCanvas();
    if (!fc) { setExporting(false); return; }
    const s = 2; const pW = SVG_W * s; const pH = A4_PAGE_H * s;
    const tH = fc.height; const nP = Math.ceil(tH / pH);
    for (let p = 0; p < nP; p++) {
      const sc = document.createElement("canvas"); sc.width = pW;
      sc.height = Math.min(pH, tH - p * pH);
      const ctx = sc.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, sc.width, sc.height);
      ctx.drawImage(fc, 0, p * pH, pW, sc.height, 0, 0, pW, sc.height);
      await new Promise<void>((r) => {
        sc.toBlob((b: any) => {
          const a = document.createElement("a"); a.href = URL.createObjectURL(b);
          a.download = nP === 1 ? "ProcessDraw_Diagram.png" : `ProcessDraw_Page_${p + 1}.png`;
          a.click(); setTimeout(r, 300);
        }, "image/png");
      });
    }
    showT(nP === 1 ? "Exported!" : `${nP} pages exported!`);
    setExporting(false);
  }, [svgToCanvas]);

  const exportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const fc = await svgToCanvas();
      if (!fc) { setExporting(false); return; }
      const s = 2; const pW = SVG_W * s; const pH = A4_PAGE_H * s;
      const tH = fc.height; const nP = Math.ceil(tH / pH);
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [SVG_W, A4_PAGE_H] });
      for (let p = 0; p < nP; p++) {
        if (p > 0) pdf.addPage([SVG_W, A4_PAGE_H]);
        const sc = document.createElement("canvas"); sc.width = pW;
        sc.height = Math.min(pH, tH - p * pH);
        const ctx = sc.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, sc.width, sc.height);
        ctx.drawImage(fc, 0, p * pH, pW, sc.height, 0, 0, pW, sc.height);
        const imgData = sc.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, SVG_W, sc.height / s);
      }
      pdf.save("ProcessDraw_Diagram.pdf");
      showT("PDF exported!");
    } catch (e) { showT("PDF export failed"); console.error(e); }
    setExporting(false);
  }, [svgToCanvas]);

  const copyClip = useCallback(async () => {
    const fc = await svgToCanvas();
    if (!fc) { showT("Copy failed — no diagram"); return; }
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        fc.toBlob((b) => { if (b) resolve(b); else reject(new Error("toBlob failed")); }, "image/png");
      });
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      showT("Copied!");
    } catch (e) {
      // Fallback: download as file
      fc.toBlob((b: any) => {
        if (b) { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "ProcessDraw_Diagram.png"; a.click(); showT("Downloaded (clipboard not available)"); }
        else { showT("Copy failed"); }
      }, "image/png");
    }
  }, [svgToCanvas]);

  const layout = useCallback(() => {
    const pos: any[] = [];
    let y = 50;
    const PAGE_MARGIN = 30; // breathing room at top/bottom of each page

    blocks.forEach((block) => {
      const td = blockTextDim(block.text);
      const lSH = sideStackH(block.leftItems);
      const rSH = sideStackH(block.rightItems);
      const bH = Math.max(td.h, Math.max(lSH, rSH) + 24);
      const bW = td.w;

      // Check if this block would straddle a page boundary
      // We need the full block height plus some margin to not touch the edge
      const blockBottom = y + bH;
      const currentPage = Math.floor(y / A4_PAGE_H);
      const blockBottomPage = Math.floor((blockBottom + PAGE_MARGIN) / A4_PAGE_H);

      // If block spans across a page boundary, push to next page
      if (blockBottomPage > currentPage && y > PAGE_MARGIN) {
        y = (currentPage + 1) * A4_PAGE_H + PAGE_MARGIN;
      }

      const bx = CANVAS_CENTER - bW / 2;
      const by = y;

      const layoutSide = (items: any[], side: string) => {
        const sH = sideStackH(items);
        let iy = by + (bH - sH) / 2;
        return items.map((item: any, idx: number) => {
          const sd = sideDim(item.text);
          const p = {
            ...sd,
            x: side === "left" ? bx - SIDE_GAP - sd.w : bx + bW + SIDE_GAP,
            y: iy, item, idx, anchorY: iy + sd.h / 2,
          };
          iy += sd.h + SIDE_ITEM_GAP;
          return p;
        });
      };

      pos.push({
        block, bx, by, bW, bH, textLines: td.lines,
        lPos: layoutSide(block.leftItems, "left"),
        rPos: layoutSide(block.rightItems, "right"),
      });
      y += bH + V_GAP;
    });

    const dH = y + 20;
    const needsFooter = frozen && isCloud && currentDiagramStatus === "approved";
    const finalH = needsFooter ? dH + FOOTER_H + 30 : dH + 40;
    return { pos, totalH: finalH, totalW: SVG_W, dEndY: dH };
  }, [blocks, frozen, isCloud, currentDiagramStatus]);
  const{pos:positions,totalH,totalW,dEndY}=layout(); const numPages=Math.max(1,Math.ceil(totalH/A4_PAGE_H));

  const renderDiagram = () => { const els:any[]=[];
    if(blocks.length>0&&!frozen) for(let p=1;p<numPages;p++){const gy=p*A4_PAGE_H; els.push(<line key={`pg-${p}`} x1={40} y1={gy} x2={totalW-40} y2={gy} stroke={C.borderLight} strokeWidth={0.5} strokeDasharray="6 4"/>); els.push(<text key={`pl-${p}`} x={totalW/2} y={gy-8} textAnchor="middle" fontFamily={BODY} fontSize={12} fill={C.textLight}>— Page Break —</text>);}
    positions.forEach((p,i)=>{ const{block,bx,by,bW,bH,textLines,lPos,rPos}=p;
      els.push(<rect key={`b-${i}`} x={bx} y={by} width={bW} height={bH} fill="white" stroke="#1a1a1a" strokeWidth={1.5} rx={1} style={{cursor:frozen?"default":"pointer"}} onClick={()=>{if(!frozen)setModal({type:"edit",blockId:block.id});}}/>);
      const tSY=by+bH/2-((textLines.length-1)*LINE_H)/2; textLines.forEach((line:string,li:number)=>{els.push(<text key={`bt-${i}-${li}`} x={bx+bW/2} y={tSY+li*LINE_H} textAnchor="middle" dominantBaseline="central" fontFamily={SVG_FONT} fontSize={13} fontWeight="600" fill="#1a1a1a" style={{pointerEvents:"none"}}>{line}</text>);});
      if(!frozen) els.push(<DelBtn key={`del-${i}`} cx={bx+bW+2} cy={by-2} onClick={(e:any)=>{e.stopPropagation();removeBlock(block.id);}}/>);
      if(i<positions.length-1){ const np=positions[i+1]; const aS=by+bH; const aE=np.by; const midY=(aS+aE)/2;
        els.push(<line key={`arr-${i}`} x1={CANVAS_CENTER} y1={aS} x2={CANVAS_CENTER} y2={aE} stroke="#1a1a1a" strokeWidth={1.2}/>);
        els.push(<polygon key={`arh-${i}`} points={`${CANVAS_CENTER},${aE} ${CANVAS_CENTER-ARROW_SZ/2},${aE-ARROW_SZ} ${CANVAS_CENTER+ARROW_SZ/2},${aE-ARROW_SZ}`} fill="#1a1a1a"/>);
        const ann=arrowAnn[i]||{left:[],right:[]}; let maxBot=midY;
        (["left","right"] as const).forEach((side)=>{const items=ann[side]||[];if(!items.length)return;const tAH=items.reduce((a:number,x:any)=>a+sideDim(x.text).h+4,-4);let aY=midY-tAH/2;
          items.forEach((a:any,ai:number)=>{const sd=sideDim(a.text);const cY=aY+sd.h/2;const aX=side==="left"?CANVAS_CENTER-16:CANVAS_CENTER+16;
            sd.lines.forEach((sl:string,sli:number)=>{els.push(<text key={`an-${side}-${i}-${ai}-${sli}`} x={aX} y={cY-((sd.lines.length-1)*14)/2+sli*14} textAnchor={side==="left"?"end":"start"} dominantBaseline="central" fontFamily={SVG_FONT} fontSize={11} fill="#1a1a1a" style={{pointerEvents:"none"}}>{sl}</text>);});
            if(!frozen){const dx=side==="left"?aX-sd.w-6:aX+sd.w+6;els.push(<DelBtn key={`andel-${side}-${i}-${ai}`} cx={dx} cy={cY} onClick={()=>removeAnn(i,side,ai)}/>);}
            aY+=sd.h+4;if(aY>maxBot)maxBot=aY;});});
        if(!frozen){const bY=(ann.left?.length||0)+(ann.right?.length||0)>0?maxBot+8:midY; els.push(<PlusBtn key={`pb-${i}`} x={CANVAS_CENTER+16} y={bY} size={14} onClick={()=>setBetweenPicker({arrowIdx:i})} frozen={frozen}/>);}}
      const renderSide=(sPos:any[],side:string)=>{sPos.forEach((sp:any)=>{const{x:sx,y:sy,w:sw,h:sh,lines:sl,item,idx:si,anchorY}=sp;const isBox=item.type==="equipment"||item.type==="ipqc";
        if(isBox)els.push(<rect key={`${side}b-${i}-${si}`} x={sx} y={sy} width={sw} height={sh} fill="white" stroke="#1a1a1a" strokeWidth={1} rx={1}/>);
        const tY=sy+sh/2-((sl.length-1)*14)/2; sl.forEach((s:string,sli:number)=>{const tx=isBox?sx+sw/2:(side==="left"?sx+sw:sx);els.push(<text key={`${side}t-${i}-${si}-${sli}`} x={tx} y={tY+sli*14} textAnchor={isBox?"middle":(side==="left"?"end":"start")} dominantBaseline="central" fontFamily={SVG_FONT} fontSize={11} fill="#1a1a1a" style={{pointerEvents:"none"}}>{s}</text>);});
        const lx1=side==="left"?sx+sw+4:bx+bW+4;const lx2=side==="left"?bx-4:sx-4;const hX=item.arrowDir==="right"?Math.max(lx1,lx2):Math.min(lx1,lx2);
        const ahP=item.arrowDir==="right"?`${hX},${anchorY} ${hX-ARROW_SZ},${anchorY-ARROW_SZ/2} ${hX-ARROW_SZ},${anchorY+ARROW_SZ/2}`:`${hX},${anchorY} ${hX+ARROW_SZ},${anchorY-ARROW_SZ/2} ${hX+ARROW_SZ},${anchorY+ARROW_SZ/2}`;
        const a1=Math.min(lx1,lx2)+4;const a2=Math.max(lx1,lx2)-4;
        els.push(<line key={`${side}a-${i}-${si}`} x1={a1} y1={anchorY} x2={a2} y2={anchorY} stroke="#1a1a1a" strokeWidth={1} style={{cursor:frozen?"default":"pointer"}} onClick={()=>toggleArrow(block.id,side,si)}/>);
        els.push(<polygon key={`${side}ah-${i}-${si}`} points={ahP} fill="#1a1a1a" style={{cursor:frozen?"default":"pointer"}} onClick={()=>toggleArrow(block.id,side,si)}/>);
        if(!frozen){const dcx=side==="left"?sx-4:sx+sw+4;els.push(<DelBtn key={`${side}del-${i}-${si}`} cx={dcx} cy={sy-4} onClick={()=>removeSI(block.id,side,si)}/>);}});};
      renderSide(lPos,"left");renderSide(rPos,"right");
      if(!frozen){const lby=lPos.length?lPos[lPos.length-1].y+lPos[lPos.length-1].h+14:by+bH/2;const rby=rPos.length?rPos[rPos.length-1].y+rPos[rPos.length-1].h+14:by+bH/2;
        els.push(<PlusBtn key={`pl-${i}`} x={bx-SIDE_GAP/2} y={lby} size={14} onClick={()=>setPicker({blockId:block.id,side:"left"})} frozen={frozen}/>);
        els.push(<PlusBtn key={`pr-${i}`} x={bx+bW+SIDE_GAP/2} y={rby} size={14} onClick={()=>setPicker({blockId:block.id,side:"right"})} frozen={frozen}/>);}
      if(i===positions.length-1&&!frozen){const bY=by+bH+32;els.push(<PlusBtn key="pe" x={CANVAS_CENTER-28} y={bY} size={16} onClick={()=>setModal({type:"new"})} frozen={frozen}/>);els.push(<EndBtn key="eb" x={CANVAS_CENTER+28} y={bY} onClick={handleEnd} frozen={frozen}/>);}
    });
    // Footer: only on approved diagrams when frozen
    if (frozen && isCloud && currentDiagramStatus === "approved" && currentDiagramMeta) {
      const fY = dEndY + 10;
      const dt = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      const lW = 140; const c1 = 60; const c2 = SVG_W / 2 + 30;
      els.push(<line key="fs" x1={40} y1={fY} x2={SVG_W - 40} y2={fY} stroke="#ccc" strokeWidth={0.5} />);
      els.push(<text key="fp" x={c1} y={fY + 20} fontFamily={SVG_FONT} fontSize={11} fill="#1a1a1a" fontWeight="600">Prepared by:</text>);
      els.push(<text key="fpn" x={c1 + 82} y={fY + 20} fontFamily={SVG_FONT} fontSize={11} fill="#1a1a1a">{currentDiagramMeta.ownerName || "—"}</text>);
      els.push(<text key="fps" x={c1} y={fY + 42} fontFamily={SVG_FONT} fontSize={10} fill="#888">Sign:</text>);
      els.push(<line key="fpsl" x1={c1 + 35} y1={fY + 42} x2={c1 + 35 + lW} y2={fY + 42} stroke="#1a1a1a" strokeWidth={0.8} />);
      els.push(<text key="fc" x={c2} y={fY + 20} fontFamily={SVG_FONT} fontSize={11} fill="#1a1a1a" fontWeight="600">Approved by:</text>);
      els.push(<text key="fcn" x={c2 + 82} y={fY + 20} fontFamily={SVG_FONT} fontSize={11} fill="#1a1a1a">{currentDiagramMeta.approvedByName || "—"}</text>);
      els.push(<text key="fcs" x={c2} y={fY + 42} fontFamily={SVG_FONT} fontSize={10} fill="#888">Sign:</text>);
      els.push(<line key="fcsl" x1={c2 + 35} y1={fY + 42} x2={c2 + 35 + lW} y2={fY + 42} stroke="#1a1a1a" strokeWidth={0.8} />);
      els.push(<text key="fdt" x={SVG_W - 60} y={fY + 20} textAnchor="end" fontFamily={SVG_FONT} fontSize={10} fill="#888">Date: {dt}</text>);
    }
    return els;};

  const handleMC=(t:string)=>{if(!modal)return;if(modal.type==="new")addBlock(t);else if(modal.type==="edit")editBlock(modal.blockId,t);else if(modal.type==="side")addSideItem(modal.blockId,modal.side,modal.sideType,t);else if(modal.type==="between")addAnn(modal.arrowIdx,modal.side,t);setModal(null);};
  const gT=()=>{if(!modal)return"";if(modal.type==="new")return"Add Process Step";if(modal.type==="edit")return"Edit Block Text";if(modal.type==="side"){const s=SIDE_TYPES.find((x)=>x.id===modal.sideType);return`Add ${s?.name||"Item"} (${modal.side})`;}if(modal.type==="between")return`Add annotation (${modal.side} of arrow)`;return"";};
  const gI=()=>modal?.type==="edit"?blocks.find((b:any)=>b.id===modal.blockId)?.text||"":"";
  const gP=()=>{if(modal?.type==="side"){if(modal.sideType==="label")return"e.g. Methanol";if(modal.sideType==="equipment")return"e.g. Reactor SSR-806";if(modal.sideType==="ipqc")return"e.g. IPQC check for %LOD";}if(modal?.type==="between")return"e.g. Wet cake";return"e.g. Reactor GLR-805";};

  return (<div style={{display:"flex",height:"100vh",fontFamily:BODY,background:C.bg,color:C.text}}>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
    <style>{`
      .pd-plus { opacity: 0.3; transition: opacity 0.2s; }
      .pd-plus:hover { opacity: 0.8; }
    `}</style>
    {showHistory&&(<div style={{width:260,background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:14,fontWeight:600,fontFamily:HEADING}}>Saved Diagrams</span><button onClick={()=>setShowHistory(false)} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16}}>×</button></div>
      {blocks.length>0&&(<div style={{padding:"10px 16px",borderBottom:`1px solid ${C.borderLight}`}}>
        {showSaveInput?(<div style={{display:"flex",gap:6}}><input value={saveName} onChange={(e)=>setSaveName(e.target.value)} placeholder="Name..." autoFocus onKeyDown={(e)=>{if(e.key==="Enter"&&saveName.trim())saveDiagram(saveName.trim());}} style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,color:C.text,borderRadius:5,padding:"5px 10px",fontSize:12,fontFamily:BODY,outline:"none"}}/><button onClick={()=>{if(saveName.trim())saveDiagram(saveName.trim());}} style={btnS(C.accent,"#fff")}>Save</button></div>):
        (<button onClick={()=>setShowSaveInput(true)} style={{...btnS(C.accent,"#fff"),width:"100%",textAlign:"center" as any}}>Save Current</button>)}</div>)}
      <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
        {savedDiagrams.length===0&&<div style={{fontSize:12,color:C.textLight,textAlign:"center",padding:24,fontStyle:"italic"}}>No saved diagrams yet.</div>}
        {savedDiagrams.map((d)=>{
          const statusColors: any = {draft:"#aaa",submitted:"#d4a040",approved:"#5a9e7a",rejected:"#c47a6a"};
          const statusColor = isCloud ? (statusColors[d.status]||"#aaa") : null;
          return (<div key={d._id||d.id} style={{padding:"10px 12px",marginBottom:4,borderRadius:8,background:C.surface,border:`1px solid ${C.borderLight}`,cursor:"pointer",transition:"all 0.12s"}} onClick={()=>loadDiagram(d)} onMouseEnter={(e)=>{e.currentTarget.style.borderColor=C.accent;}} onMouseLeave={(e)=>{e.currentTarget.style.borderColor=C.borderLight;}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
            <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>
              {d.blocks?.length||0} steps
              {isCloud&&d.ownerName&&!d.isOwn&&` · by ${d.ownerName}`}
              {!isCloud&&d.savedAt&&` · ${new Date(d.savedAt).toLocaleDateString()}`}
              {isCloud&&d.updatedAt&&` · ${new Date(d.updatedAt).toLocaleDateString()}`}
            </div>
            {isCloud&&d.status&&<div style={{display:"inline-block",fontSize:9,color:"#fff",background:statusColor,padding:"1px 6px",borderRadius:8,marginTop:3,fontWeight:600,textTransform:"uppercase"}}>{d.status}{d.revisionCount>0&&` (rev ${d.revisionCount})`}</div>}
            {isCloud&&d.status==="rejected"&&d.rejectionComment&&<div style={{fontSize:10,color:"#c47a6a",marginTop:3,lineHeight:1.4,fontStyle:"italic"}}>Reason: {d.rejectionComment}{d.rejectedByName&&` — ${d.rejectedByName}`}</div>}
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
            {isCloud&&cloud.isApprover&&d.status==="submitted"&&<>
              <button onClick={(e)=>{e.stopPropagation();reviewDiagram(d._id,"approved");}} style={{background:"#5a9e7a",border:"none",color:"#fff",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer",fontFamily:BODY}}>✓</button>
              <button onClick={(e)=>{e.stopPropagation();setRejectModal({diagramId:d._id,diagramName:d.name});setRejectComment("");}} style={{background:"#c47a6a",border:"none",color:"#fff",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer",fontFamily:BODY}}>✗</button>
            </>}
            {isCloud&&d.isOwn&&d.status==="rejected"&&<button onClick={(e)=>{e.stopPropagation();reviseDiagram(d._id);}} style={{background:"#e8a040",border:"none",color:"#fff",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer",fontFamily:BODY}}>Revise</button>}
            {(isCloud?d.isOwn||cloud.isAdmin:true)&&<button onClick={(e)=>{e.stopPropagation();deleteDiagram(d._id||d.id);}} style={{background:"none",border:"none",color:C.textLight,cursor:"pointer",fontSize:14}}>×</button>}
          </div></div></div>);})}</div></div>)}

    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setShowHistory(!showHistory)} title="Saved" style={{background:showHistory?C.accentLight:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:6,padding:"4px 9px",fontSize:13,cursor:"pointer",fontFamily:BODY}}>☰</button>
          <span style={{fontSize:18,fontWeight:700,fontFamily:HEADING,letterSpacing:-0.5}}>ProcessDraw</span>
          <span style={{fontSize:10,color:C.textLight,fontWeight:400}}>by KJR Labs</span>
          {isCloud&&cloud.role&&<span style={{fontSize:9,color:C.accent,background:C.accentLight,padding:"2px 8px",borderRadius:10,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,fontFamily:BODY}}>{cloud.role.replace("_"," ")}</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {blocks.length>0&&!frozen&&<span style={{fontSize:10,color:C.textLight,marginRight:4}}>Click blocks to edit · Arrows to toggle · END to finalize</span>}
          <button onClick={()=>setShowHelp(true)} title="Help" style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:BODY}}>?</button>
          <button onClick={()=>setShowSettings(true)} title="Settings" style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:BODY}}>⚙</button>
          {isCloud&&cloud.isAdmin&&<button onClick={cloud.onShowAdmin} title="Admin" style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:6,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:BODY}}>Users</button>}
          {isCloud&&<button onClick={cloud.onToggleNotifications} title="Notifications" style={{background:"none",border:`1px solid ${C.border}`,color:C.textMuted,borderRadius:6,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:BODY,position:"relative"}}>
            🔔{cloud.unreadCount>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#c47a6a",color:"#fff",fontSize:8,fontWeight:700,borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{cloud.unreadCount}</span>}
          </button>}
          {blocks.length>0&&(!isCloud||cloud.canCreate)&&<button onClick={newDiag} style={{...btnS("none",C.danger,`1px solid ${C.border}`),padding:"4px 10px",fontSize:11}}>New</button>}
          {frozen&&<><button onClick={handleUnfreeze} style={{...btnS(C.bg,C.text,`1px solid ${C.border}`),padding:"5px 12px"}}>Edit</button>
            {isCloud&&currentDiagramId&&cloud.canEdit&&currentDiagramStatus==="draft"&&<button onClick={submitForApproval} style={{...btnS("#e8a040","#fff"),padding:"5px 12px",fontSize:11}}>Submit for Approval</button>}
            {isCloud&&currentDiagramStatus!=="approved"&&<span style={{fontSize:10,color:C.textLight,padding:"5px 8px"}}>Export available after approval</span>}
            {(!isCloud||currentDiagramStatus==="approved")&&<>
              <button onClick={exportPages} disabled={exporting} style={{...btnS(C.accent,"#fff"),padding:"5px 14px",opacity:exporting?0.6:1}}>{exporting?"...":numPages>1?`PNG (${numPages} pg)`:"Export PNG"}</button>
              <button onClick={exportPDF} disabled={exporting} style={{...btnS("#6a5acd","#fff"),padding:"5px 14px",opacity:exporting?0.6:1}}>PDF</button>
            </>}
          </>}
          {isCloud&&cloud.UserButton&&<div style={{marginLeft:4}}>{cloud.UserButton}</div>}
        </div></div>

      <div style={{flex:1,overflow:"auto",background:C.bg}}>
        {blocks.length===0?(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12}}>
          <div style={{fontSize:28,fontWeight:700,color:C.text,fontFamily:HEADING,letterSpacing:-0.5}}>
            {isCloud&&cloud.role==="approver"?"Review Diagrams":isCloud&&cloud.role==="viewer"?"View Diagrams":"Process Flow Diagrams"}
          </div>
          <div style={{fontSize:14,color:C.textMuted,marginBottom:6}}>
            {isCloud&&cloud.role==="approver"?"Open the sidebar to review submitted diagrams"
              :isCloud&&cloud.role==="viewer"?"Open the sidebar to view approved diagrams"
              :"Clean, standardized PFDs for manufacturing documentation"}
          </div>
          {(!isCloud||cloud.canCreate)&&<button onClick={()=>setModal({type:"new"})} style={{width:52,height:52,borderRadius:"50%",background:C.accent,border:"none",color:"white",fontSize:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(61,139,139,0.3)",transition:"transform 0.15s"}} onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.08)"} onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}>+</button>}
          <div style={{display:"flex",gap:8,marginTop:6}}>
            {savedDiagrams.length>0&&<button onClick={()=>setShowHistory(true)} style={{...btnS("none",C.accent,`1px solid ${C.border}`),fontSize:11}}>
              {isCloud&&cloud.role==="approver"?`Review queue (${savedDiagrams.length})`
                :isCloud&&cloud.role==="viewer"?`View diagrams (${savedDiagrams.length})`
                :`Open saved (${savedDiagrams.length})`}
            </button>}
            <button onClick={()=>setShowHelp(true)} style={{...btnS("none",C.textMuted,`1px solid ${C.border}`),fontSize:11}}>How to use</button></div></div>):
        (<div style={{display:"flex",justifyContent:"center",padding:"24px 0",minHeight:"100%"}}>
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`} style={{background:"white",boxShadow:"0 1px 8px rgba(44,40,36,0.07)",flexShrink:0}}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');`}</style>{renderDiagram()}</svg></div>)}</div></div>

    {modal&&<TextModal title={gT()} initial={gI()} placeholder={gP()} onConfirm={handleMC} onCancel={()=>setModal(null)}/>}
    {picker&&<PickerModal title={`Add to ${picker.side==="left"?"Left":"Right"} Side`} options={SIDE_TYPES} onPick={(id:string)=>{setPicker(null);setModal({type:"side",blockId:picker.blockId,side:picker.side,sideType:id});}} onCancel={()=>setPicker(null)}/>}
    {betweenPicker&&<PickerModal title="Add annotation near arrow" options={BETWEEN_OPTS} onPick={(id:string)=>{setBetweenPicker(null);setModal({type:"between",arrowIdx:betweenPicker.arrowIdx,side:id});}} onCancel={()=>setBetweenPicker(null)}/>}
    {showSettings&&<SettingsPanel settings={settings} onSave={saveSettings} onClose={()=>setShowSettings(false)}/>}
    {showHelp&&<HowToUse onClose={()=>setShowHelp(false)}/>}

    {/* Rejection comment modal */}
    {rejectModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(44,40,36,0.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}} onClick={()=>setRejectModal(null)}>
        <div onClick={(e)=>e.stopPropagation()} style={{background:C.surface,borderRadius:14,padding:"28px 30px",width:400,boxShadow:"0 24px 80px rgba(44,40,36,0.18)",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:16,fontWeight:600,color:C.text,marginBottom:6,fontFamily:HEADING}}>Reject Diagram</div>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:16}}>"{rejectModal.diagramName}" — please provide a reason for rejection</div>
          <textarea value={rejectComment} onChange={(e)=>setRejectComment(e.target.value)} placeholder="Reason for rejection (required)..." rows={3}
            autoFocus style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"10px 14px",fontSize:14,fontFamily:BODY,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.5}}/>
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
            <button onClick={()=>setRejectModal(null)} style={btnS(C.bg,C.textMuted,`1px solid ${C.border}`)}>Cancel</button>
            <button onClick={async()=>{if(!rejectComment.trim()){showT("Rejection reason is required");return;} await reviewDiagram(rejectModal.diagramId,"rejected",rejectComment.trim()); setRejectModal(null);setRejectComment("");}}
              disabled={!rejectComment.trim()} style={{...btnS(rejectComment.trim()?"#c47a6a":"#ccc","#fff"),opacity:rejectComment.trim()?1:0.5}}>Reject</button>
          </div>
        </div>
      </div>
    )}

    {/* Notification panel */}
    {isCloud&&cloud.showNotifications&&(
      <div style={{position:"fixed",top:52,right:20,width:360,maxHeight:"70vh",background:C.surface,borderRadius:14,boxShadow:"0 12px 48px rgba(44,40,36,0.15)",border:`1px solid ${C.border}`,zIndex:900,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:600,fontFamily:HEADING}}>Notifications</span>
          <div style={{display:"flex",gap:8}}>
            {cloud.unreadCount>0&&<button onClick={cloud.onMarkAllRead} style={{background:"none",border:"none",color:C.accent,fontSize:11,cursor:"pointer",fontFamily:BODY}}>Mark all read</button>}
            <button onClick={cloud.onToggleNotifications} style={{background:"none",border:"none",color:C.textMuted,cursor:"pointer",fontSize:16}}>×</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
          {(!cloud.notifications||cloud.notifications.length===0)&&<div style={{fontSize:12,color:C.textLight,textAlign:"center",padding:24}}>No notifications yet</div>}
          {(cloud.notifications||[]).map((n:any)=>{
            const typeColors:any={approved:"#5a9e7a",rejected:"#c47a6a",submitted:"#d4a040"};
            const typeLabels:any={approved:"Approved",rejected:"Rejected",submitted:"New submission"};
            return(
              <div key={n._id} style={{padding:"10px 12px",marginBottom:4,borderRadius:8,background:n.read?C.surface:C.accentLight,border:`1px solid ${n.read?C.border:C.accent}`,cursor:"pointer"}}
                onClick={()=>{if(!n.read)cloud.onMarkRead(n._id);}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text}}>
                      <span style={{color:typeColors[n.type]||C.textMuted}}>{typeLabels[n.type]||n.type}</span> — {n.diagramName}
                    </div>
                    <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>by {n.actorName}</div>
                    {n.comment&&<div style={{fontSize:11,color:"#c47a6a",marginTop:4,fontStyle:"italic",lineHeight:1.4}}>"{n.comment}"</div>}
                  </div>
                  <div style={{fontSize:9,color:C.textLight,whiteSpace:"nowrap",marginLeft:8}}>{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.text,color:C.surface,padding:"8px 20px",borderRadius:8,fontSize:12,fontFamily:BODY,boxShadow:"0 4px 16px rgba(44,40,36,0.25)",zIndex:999}}>{toast}</div>}
  </div>);
}
