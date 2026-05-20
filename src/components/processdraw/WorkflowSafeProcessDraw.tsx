"use client";

import { useMemo, useRef, useState } from "react";

const C = { bg: "#f6f3ee", paper: "#fff", ink: "#1b1b1b", border: "#e5e0d8", soft: "#faf8f5", text: "#2c2824", muted: "#8a8078", light: "#b5ada5", accent: "#3d8b8b", accentLight: "#e8f3f3", danger: "#c47a6a", warn: "#d4a040", success: "#5a9e7a", purple: "#6a5acd" };
const BODY = "'Outfit', system-ui, sans-serif";
const HEAD = "'Fraunces', Georgia, serif";
const W = 800;
const PAGE_H = 935;
const CX = 400;
const V_GAP = 84;
const SIDE_GAP = 54;
const AR = 8;

type Side = "left" | "right";
type Block = { id: string; text: string; leftItems: SideItem[]; rightItems: SideItem[] };
type SideItem = { id: string; type: string; text: string; arrowDir: "left" | "right" };
type Ann = Record<number, { left: { id: string; text: string }[]; right: { id: string; text: string }[] }>;

const uid = () => "n" + Math.random().toString(36).slice(2, 9);

function button(kind: "primary" | "ghost" | "danger" | "warn" | "purple" | "success" = "ghost") {
  const map: Record<string, [string, string, string]> = {
    primary: [C.accent, "#fff", C.accent],
    ghost: ["transparent", C.muted, C.border],
    danger: ["transparent", C.danger, C.border],
    warn: [C.warn, "#fff", C.warn],
    purple: [C.purple, "#fff", C.purple],
    success: [C.success, "#fff", C.success],
  };
  const [background, color, border] = map[kind];
  return { background, color, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 12px", font: `600 12px ${BODY}`, cursor: "pointer", whiteSpace: "nowrap" as const };
}

function wrapText(text = "", max = 24) {
  return text.split("\n").flatMap((para) => {
    const words = para.trim().split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let line = "";
    words.forEach((word) => {
      if (line && `${line} ${word}`.length > max) {
        out.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    });
    if (line) out.push(line);
    return out.length ? out : [""];
  });
}

function boxDim(text: string, max = 24, minW = 180) {
  const lines = wrapText(text, max);
  return { lines, w: Math.max(minW, Math.max(...lines.map((line) => line.length)) * 8.4 + 58), h: lines.length * 18 + 34 };
}

function sideDim(text: string) {
  const lines = wrapText(text, 22);
  return { lines, w: Math.max(110, Math.max(...lines.map((line) => line.length)) * 7.4 + 24), h: lines.length * 18 + 16 };
}

function sideStack(items: SideItem[]) {
  return items.reduce((sum, item, index) => sum + sideDim(item.text).h + (index ? 12 : 0), 0);
}

function useLayout(blocks: Block[], anns: Ann) {
  return useMemo(() => {
    let y = 56;
    const pos: any[] = [];
    blocks.forEach((block, index) => {
      const main = boxDim(block.text);
      const h = Math.max(main.h, sideStack(block.leftItems) + 28, sideStack(block.rightItems) + 28);
      if (Math.floor((y + h + 34) / PAGE_H) > Math.floor(y / PAGE_H) && y > 34) {
        y = (Math.floor(y / PAGE_H) + 1) * PAGE_H + 34;
      }
      const bx = CX - main.w / 2;
      const by = y;
      const placeSide = (items: SideItem[], side: Side) => {
        let iy = by + (h - sideStack(items)) / 2;
        return items.map((item, itemIndex) => {
          const d = sideDim(item.text);
          const out = { ...d, item, itemIndex, x: side === "left" ? bx - SIDE_GAP - d.w : bx + main.w + SIDE_GAP, y: iy, cy: iy + d.h / 2 };
          iy += d.h + 12;
          return out;
        });
      };
      pos.push({ block, index, bx, by, w: main.w, h, lines: main.lines, left: placeSide(block.leftItems, "left"), right: placeSide(block.rightItems, "right") });
      const ann = anns[index];
      y += h + V_GAP + (ann ? Math.max(ann.left?.length || 0, ann.right?.length || 0) * 8 : 0);
    });
    const height = Math.max(PAGE_H, y + 52);
    return { pos, height, pages: Math.max(1, Math.ceil(height / PAGE_H)) };
  }, [blocks, anns]);
}

function Modal({ title, initial = "", placeholder, onOk, onClose }: any) {
  const [value, setValue] = useState(initial);
  return (
    <div className="pd-back" onClick={onClose}>
      <div className="pd-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <textarea autoFocus rows={4} value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && value.trim()) {
            event.preventDefault();
            onOk(value.trim());
          }
        }} />
        <div className="pd-modal-actions">
          <button style={button()} onClick={onClose}>Cancel</button>
          <button style={button("primary")} disabled={!value.trim()} onClick={() => value.trim() && onOk(value.trim())}>OK</button>
        </div>
      </div>
    </div>
  );
}

function Picker({ title, options, onPick, onClose }: any) {
  return (
    <div className="pd-back" onClick={onClose}>
      <div className="pd-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        {options.map((option: any) => (
          <button className="pd-pick" key={option.id} onClick={() => onPick(option.id)}>
            <b>{option.name}</b>
            <span>{option.desc}</span>
          </button>
        ))}
        <button style={{ ...button(), width: "100%" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function Plus({ x, y, onClick }: any) {
  return <g className="pd-ctl" onClick={onClick}><circle cx={x} cy={y} r={9} fill="#fff" stroke={C.accent} /><path d={`M${x - 4} ${y}H${x + 4}M${x} ${y - 4}V${y + 4}`} stroke={C.accent} /><circle cx={x} cy={y} r={18} fill="transparent" /></g>;
}

function Delete({ x, y, onClick }: any) {
  return <g className="pd-del" onClick={onClick}><circle cx={x} cy={y} r={8} fill={C.danger} /><text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#fff">×</text><circle cx={x} cy={y} r={16} fill="transparent" /></g>;
}

export default function WorkflowSafeProcessDraw({ cloud }: { cloud?: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isCloud = !!cloud;
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [anns, setAnns] = useState<Ann>({});
  const [frozen, setFrozen] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [picker, setPicker] = useState<any>(null);
  const [between, setBetween] = useState<any>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [name, setName] = useState("");
  const [curId, setCurId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [savingName, setSavingName] = useState("");
  const diagrams = cloud?.diagrams || [];
  const canEdit = !isCloud || (cloud?.canEdit && status === "draft");
  const readOnly = frozen || !canEdit;
  const layout = useLayout(blocks, anns);

  const show = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const save = async (targetName = name || savingName || "Untitled diagram", finalized = frozen) => {
    try {
      if (isCloud) {
        const newId = await cloud.onSave(targetName, blocks, anns, { finalized }, curId || undefined);
        if (newId && !curId) setCurId(newId);
      }
      setName(targetName);
      setSavingName("");
      show(finalized ? `Finalized and saved ${targetName}` : `Saved ${targetName}`);
      return curId;
    } catch (error: any) {
      show(error?.message || "Save failed");
      return null;
    }
  };

  const load = (diagram: any) => {
    setBlocks(diagram.blocks || []);
    setAnns(diagram.arrowAnnotations || {});
    setName(diagram.name || "");
    setCurId(diagram._id || diagram.id || null);
    setStatus(diagram.status || "draft");
    setFrozen((isCloud && diagram.status !== "draft") || diagram.settings?.finalized === true);
    setSideOpen(false);
    show(`Loaded ${diagram.name}`);
  };

  const markDirty = () => {
    if (frozen) setFrozen(false);
  };

  const addBlock = (text: string) => {
    markDirty();
    setBlocks((prev) => [...prev, { id: uid(), text, leftItems: [], rightItems: [] }]);
  };

  const updateBlock = (blockId: string, text: string) => {
    markDirty();
    setBlocks((prev) => prev.map((block) => block.id === blockId ? { ...block, text } : block));
  };

  const addSide = (blockId: string, side: Side, type: string, text: string) => {
    markDirty();
    setBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block;
      const key = side === "left" ? "leftItems" : "rightItems";
      const item = { id: uid(), type, text, arrowDir: side === "left" ? "right" : "left" } as SideItem;
      return { ...block, [key]: [...block[key], item] };
    }));
  };

  const submit = async () => {
    if (!frozen) return show("Click END / Preview before submitting");
    if (!blocks.length) return show("Add at least one process step");
    try {
      const targetName = name || savingName || "Untitled diagram";
      let submitId = curId;
      if (isCloud) {
        const savedId = await cloud.onSave(targetName, blocks, anns, { finalized: true }, curId || undefined);
        submitId = savedId || curId;
        if (savedId && !curId) setCurId(savedId);
        if (!submitId) throw new Error("Save failed before submit");
        await cloud.onSubmit(submitId);
      }
      setName(targetName);
      setStatus("submitted");
      setFrozen(true);
      show("Finalized and submitted for approval");
    } catch (error: any) {
      show(error?.message || "Submit failed");
    }
  };

  const finishModal = (text: string) => {
    if (modal?.type === "new") addBlock(text);
    if (modal?.type === "edit") updateBlock(modal.blockId, text);
    if (modal?.type === "side") addSide(modal.blockId, modal.side, modal.sideType, text);
    if (modal?.type === "ann") {
      markDirty();
      setAnns((prev) => {
        const entry = prev[modal.index] || { left: [], right: [] };
        return { ...prev, [modal.index]: { ...entry, [modal.side]: [...entry[modal.side], { id: uid(), text }] } };
      });
    }
    setModal(null);
  };

  const exportCanvas = async (asPdf = false) => {
    if (!svgRef.current) return;
    const data = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = W * 2;
      canvas.height = layout.height * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      if (asPdf) {
        const { default: jsPDF } = await import("jspdf");
        const doc = new jsPDF({ orientation: "portrait", unit: "px", format: [W, PAGE_H] });
        for (let page = 0; page < layout.pages; page++) {
          if (page) doc.addPage([W, PAGE_H]);
          doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, -page * PAGE_H, W, layout.height);
        }
        doc.save("ProcessDraw_Diagram.pdf");
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "ProcessDraw_Diagram.png";
        link.click();
      }
      show(asPdf ? "PDF exported" : "PNG exported");
    };
    img.src = url;
  };

  const renderDiagram = () => {
    const out: any[] = [];
    for (let page = 1; page < layout.pages; page++) {
      out.push(<g key={`page-${page}`}><line x1={42} x2={W - 42} y1={page * PAGE_H} y2={page * PAGE_H} stroke={C.border} strokeDasharray="7 5" /><text x={W / 2} y={page * PAGE_H - 10} textAnchor="middle" fontSize="11" fill={C.light}>A4 page break</text></g>);
    }

    layout.pos.forEach((pos: any, index: number) => {
      out.push(<rect key={pos.block.id} x={pos.bx} y={pos.by} width={pos.w} height={pos.h} rx="2" fill="#fff" stroke={C.ink} strokeWidth="1.5" className={!readOnly ? "pd-shape" : ""} onClick={() => !readOnly && setModal({ type: "edit", blockId: pos.block.id })} />);
      pos.lines.forEach((line: string, lineIndex: number) => out.push(<text key={`${pos.block.id}-${lineIndex}`} x={pos.bx + pos.w / 2} y={pos.by + pos.h / 2 - ((pos.lines.length - 1) * 18) / 2 + lineIndex * 18} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={C.ink}>{line}</text>));
      if (!readOnly) out.push(<Delete key={`del-${pos.block.id}`} x={pos.bx + pos.w + 5} y={pos.by - 5} onClick={(event: any) => { event.stopPropagation(); markDirty(); setBlocks((prev) => prev.filter((block) => block.id !== pos.block.id)); }} />);

      if (index < layout.pos.length - 1) {
        const next = layout.pos[index + 1];
        const y1 = pos.by + pos.h;
        const y2 = next.by;
        const mid = (y1 + y2) / 2;
        out.push(<g key={`arrow-${index}`}><line x1={CX} x2={CX} y1={y1} y2={y2} stroke={C.ink} /><polygon points={`${CX},${y2} ${CX - 4},${y2 - AR} ${CX + 4},${y2 - AR}`} fill={C.ink} /></g>);
        const ann = anns[index] || { left: [], right: [] };
        (["left", "right"] as Side[]).forEach((side) => (ann[side] || []).forEach((item: any, annIndex: number) => {
          const d = sideDim(item.text);
          const tx = side === "left" ? CX - 18 : CX + 18;
          const y = mid + annIndex * (d.h + 4);
          d.lines.forEach((line, lineIndex) => out.push(<text key={`ann-${side}-${index}-${annIndex}-${lineIndex}`} x={tx} y={y + lineIndex * 14} textAnchor={side === "left" ? "end" : "start"} fontSize="11">{line}</text>));
        }));
        if (!readOnly) out.push(<Plus key={`between-${index}`} x={CX + 18} y={mid + 18} onClick={() => setBetween({ index })} />);
      }

      const drawSide = (items: any[], side: Side) => items.forEach((itemPos) => {
        const isBox = itemPos.item.type !== "label";
        if (isBox) out.push(<rect key={`side-box-${itemPos.item.id}`} x={itemPos.x} y={itemPos.y} width={itemPos.w} height={itemPos.h} fill="#fff" stroke={C.ink} />);
        itemPos.lines.forEach((line: string, lineIndex: number) => out.push(<text key={`side-text-${itemPos.item.id}-${lineIndex}`} x={isBox ? itemPos.x + itemPos.w / 2 : side === "left" ? itemPos.x + itemPos.w : itemPos.x} y={itemPos.y + itemPos.h / 2 - ((itemPos.lines.length - 1) * 14) / 2 + lineIndex * 14} textAnchor={isBox ? "middle" : side === "left" ? "end" : "start"} dominantBaseline="middle" fontSize="11">{line}</text>));
        const x1 = side === "left" ? itemPos.x + itemPos.w + 4 : pos.bx + pos.w + 4;
        const x2 = side === "left" ? pos.bx - 4 : itemPos.x - 4;
        const leftX = Math.min(x1, x2) + 4;
        const rightX = Math.max(x1, x2) - 4;
        const headX = itemPos.item.arrowDir === "right" ? rightX : leftX;
        out.push(<g key={`side-arrow-${itemPos.item.id}`}><line x1={leftX} x2={rightX} y1={itemPos.cy} y2={itemPos.cy} stroke={C.ink} /><polygon points={itemPos.item.arrowDir === "right" ? `${headX},${itemPos.cy} ${headX - AR},${itemPos.cy - 4} ${headX - AR},${itemPos.cy + 4}` : `${headX},${itemPos.cy} ${headX + AR},${itemPos.cy - 4} ${headX + AR},${itemPos.cy + 4}`} fill={C.ink} /></g>);
      });

      drawSide(pos.left, "left");
      drawSide(pos.right, "right");
      if (!readOnly) {
        out.push(<Plus key={`left-plus-${pos.block.id}`} x={pos.bx - SIDE_GAP / 2} y={pos.left.length ? pos.left[pos.left.length - 1].y + pos.left[pos.left.length - 1].h + 16 : pos.by + pos.h / 2} onClick={() => setPicker({ blockId: pos.block.id, side: "left" })} />);
        out.push(<Plus key={`right-plus-${pos.block.id}`} x={pos.bx + pos.w + SIDE_GAP / 2} y={pos.right.length ? pos.right[pos.right.length - 1].y + pos.right[pos.right.length - 1].h + 16 : pos.by + pos.h / 2} onClick={() => setPicker({ blockId: pos.block.id, side: "right" })} />);
      }
      if (index === layout.pos.length - 1 && !readOnly) {
        out.push(<g key="end-row"><Plus x={CX - 30} y={pos.by + pos.h + 36} onClick={() => setModal({ type: "new" })} /><g className="pd-ctl" onClick={() => { setFrozen(true); show("Diagram finalized. Save or submit when ready."); }}><rect x={CX + 6} y={pos.by + pos.h + 26} width="52" height="22" rx="5" fill="#fff" stroke={C.danger} /><text x={CX + 32} y={pos.by + pos.h + 41} textAnchor="middle" fontSize="10" fontWeight="700" fill={C.danger}>END</text></g></g>);
      }
    });
    return out;
  };

  return (
    <div className="pd">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`.pd{height:100vh;display:flex;background:${C.bg};font-family:${BODY};color:${C.text};overflow:hidden}.pd-side{width:310px;background:${C.soft};border-right:1px solid ${C.border};display:flex;flex-direction:column}.pd-side h2{font:700 17px ${HEAD};margin:0;padding:16px;border-bottom:1px solid ${C.border}}.pd-list{padding:12px;overflow:auto}.pd-card{background:#fff;border:1px solid ${C.border};border-radius:12px;padding:11px;margin-bottom:8px;cursor:pointer}.pd-card:hover{border-color:${C.accent}}.pd-card b{display:block;font-size:13px}.pd-card span{font-size:11px;color:${C.muted}}.pd-main{flex:1;display:flex;flex-direction:column;min-width:0}.pd-top{min-height:54px;background:#fff;border-bottom:1px solid ${C.border};display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 18px}.pd-brand{display:flex;align-items:center;gap:10px}.pd-brand h1{font:700 20px ${HEAD};margin:0}.pd-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pd-bar{background:${C.soft};border-bottom:1px solid ${C.border};display:flex;justify-content:space-between;padding:8px 18px;font-size:12px;color:${C.muted}}.pd-canvas{flex:1;overflow:auto;padding:28px;display:flex;justify-content:center;background:radial-gradient(circle at 1px 1px,rgba(44,40,36,.08) 1px,transparent 0);background-size:22px 22px}.pd-wrap{transform-origin:top center}.pd-svg{background:white;border:1px solid ${C.border};box-shadow:0 8px 30px rgba(44,40,36,.09)}.pd-empty{height:100%;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;text-align:center}.pd-empty h2{font:700 34px ${HEAD};margin:0}.pd-empty p{margin:0;color:${C.muted}}.pd-plus{width:56px;height:56px;border:0;border-radius:50%;background:${C.accent};color:#fff;font-size:28px;cursor:pointer}.pd-back{position:fixed;inset:0;background:rgba(44,40,36,.32);display:flex;align-items:center;justify-content:center;z-index:10}.pd-modal{width:min(430px,calc(100vw - 32px));background:#fff;border:1px solid ${C.border};border-radius:18px;padding:26px;box-shadow:0 28px 90px rgba(44,40,36,.2)}.pd-modal h3{font:700 19px ${HEAD};margin:0 0 14px}.pd-modal textarea{width:100%;box-sizing:border-box;border:1px solid ${C.border};border-radius:10px;background:${C.bg};padding:12px;font:14px ${BODY};line-height:1.5}.pd-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}.pd-pick{width:100%;text-align:left;border:1px solid ${C.border};background:${C.bg};border-radius:11px;padding:12px;margin-bottom:8px;cursor:pointer}.pd-pick:hover{background:${C.accentLight};border-color:${C.accent}}.pd-pick b,.pd-pick span{display:block}.pd-pick span{font-size:11px;color:${C.muted};margin-top:3px}.pd-ctl,.pd-del,.pd-shape{cursor:pointer}.pd-ctl{opacity:.65}.pd-ctl:hover,.pd-del:hover{opacity:1}.pd-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${C.text};color:white;border-radius:10px;padding:9px 18px;font-size:12px;z-index:20}@media(max-width:850px){.pd{flex-direction:column}.pd-side{width:100%;max-height:42vh;border-right:0;border-bottom:1px solid ${C.border}}.pd-top{align-items:flex-start;flex-direction:column}.pd-canvas{justify-content:flex-start;padding:14px}.pd-wrap{transform-origin:top left}}`}</style>

      {sideOpen && <aside className="pd-side"><h2>Saved diagrams</h2><div style={{ padding: 12, borderBottom: `1px solid ${C.border}` }}><input value={savingName} onChange={(event) => setSavingName(event.target.value)} placeholder="Diagram name" style={{ width: "100%", boxSizing: "border-box", padding: 8, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 8 }} /><button style={{ ...button("primary"), width: "100%" }} onClick={() => save(undefined, frozen)}>Save current</button></div><div className="pd-list">{diagrams.length ? diagrams.map((diagram: any) => <div className="pd-card" key={diagram._id || diagram.id || diagram.name} onClick={() => load(diagram)}><b>{diagram.name}</b><span>{diagram.blocks?.length || 0} steps · {diagram.status || "draft"}{diagram.settings?.finalized ? " · finalized" : ""}</span></div>) : <p style={{ color: C.light, textAlign: "center" }}>No saved diagrams yet.</p>}</div></aside>}

      <main className="pd-main">
        <header className="pd-top"><div className="pd-brand"><button style={button()} onClick={() => setSideOpen((v) => !v)}>☰</button><h1>ProcessDraw</h1><span style={{ color: C.light, fontSize: 11 }}>by KJR Labs</span>{isCloud && <span style={{ background: C.accentLight, color: C.accent, borderRadius: 99, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>{cloud.role?.replace("_", " ")}</span>}</div><div className="pd-actions">{blocks.length > 0 && canEdit && !frozen && <button style={button("primary")} onClick={() => save(name || "Untitled diagram", false)}>Save draft</button>}<button style={button()} onClick={() => setModal({ type: "help" })}>?</button>{blocks.length > 0 && canEdit && <button style={button("danger")} onClick={() => { setBlocks([]); setAnns({}); setName(""); setCurId(null); setStatus("draft"); setFrozen(false); }}>New</button>}{blocks.length > 0 && !frozen && canEdit && <button style={button("warn")} onClick={() => { setFrozen(true); show("Diagram finalized. Submit will save this final version."); }}>END / Preview</button>}{blocks.length > 0 && frozen && canEdit && <button style={button()} onClick={() => { setFrozen(false); show("Editing resumed. Finalize again before submission."); }}>Edit</button>}{blocks.length > 0 && frozen && isCloud && status === "draft" && cloud.canEdit && <button style={button("warn")} onClick={submit}>Submit</button>}{blocks.length > 0 && frozen && (!isCloud || status === "approved") && <button style={button("primary")} onClick={() => exportCanvas(false)}>PNG</button>}{blocks.length > 0 && frozen && (!isCloud || status === "approved") && <button style={button("purple")} onClick={() => exportCanvas(true)}>PDF</button>}{isCloud && cloud.UserButton}</div></header>
        {blocks.length ? <><div className="pd-bar"><span>{name || "Untitled diagram"} · {blocks.length} steps · {layout.pages} A4 page{layout.pages > 1 ? "s" : ""} · {status.toUpperCase()} · {frozen ? "FINALIZED" : "DRAFT"}</span><span><button style={button()} onClick={() => setZoom((z) => Math.max(.55, +(z - .1).toFixed(2)))}>−</button> <button style={button()} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button> <button style={button()} onClick={() => setZoom((z) => Math.min(1.6, +(z + .1).toFixed(2)))}>+</button></span></div><div className="pd-canvas"><div className="pd-wrap" style={{ transform: `scale(${zoom})` }}><svg ref={svgRef} className="pd-svg" xmlns="http://www.w3.org/2000/svg" width={W} height={layout.height} viewBox={`0 0 ${W} ${layout.height}`}>{renderDiagram()}</svg></div></div></> : <div className="pd-empty"><h2>{isCloud && cloud.role === "approver" ? "Review diagrams" : "Build a process flow"}</h2><p>Create print-ready process flow diagrams with clean GMP-style layout.</p>{canEdit && <button className="pd-plus" onClick={() => setModal({ type: "new" })}>+</button>}<button style={button("primary")} onClick={() => setSideOpen(true)}>{diagrams.length ? `Open saved (${diagrams.length})` : "Saved diagrams"}</button></div>}
      </main>

      {modal && modal.type !== "help" && <Modal title={modal.type === "new" ? "Add process step" : modal.type === "edit" ? "Edit block" : modal.type === "side" ? "Add side item" : "Add arrow annotation"} initial={modal.type === "edit" ? blocks.find((block) => block.id === modal.blockId)?.text : ""} placeholder="e.g. Reactor\nGLR-805" onOk={finishModal} onClose={() => setModal(null)} />}
      {modal?.type === "help" && <div className="pd-back" onClick={() => setModal(null)}><div className="pd-modal" onClick={(event) => event.stopPropagation()}><h3>Workflow rule</h3><p>Users must click END / Preview before submission. Submit saves the finalized version with settings.finalized = true. If the user edits again, the diagram returns to draft/finalize-required state.</p><button style={button("primary")} onClick={() => setModal(null)}>Got it</button></div></div>}
      {picker && <Picker title={`Add to ${picker.side} side`} options={[{ id: "label", name: "Label", desc: "Text like Methanol" }, { id: "equipment", name: "Equipment block", desc: "Side tank/reactor" }, { id: "ipqc", name: "IPQC check", desc: "Quality checkpoint" }]} onPick={(type: string) => { setModal({ type: "side", blockId: picker.blockId, side: picker.side, sideType: type }); setPicker(null); }} onClose={() => setPicker(null)} />}
      {between && <Picker title="Add annotation" options={[{ id: "left", name: "Left of arrow", desc: "Text appears to left" }, { id: "right", name: "Right of arrow", desc: "Text appears to right" }]} onPick={(side: Side) => { setModal({ type: "ann", index: between.index, side }); setBetween(null); }} onClose={() => setBetween(null)} />}
      {toast && <div className="pd-toast">{toast}</div>}
    </div>
  );
}
