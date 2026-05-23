"use client";

import { useMemo, useRef, useState } from "react";
import { ANNOTATION_SIDE_OPTIONS, COLORS, SIDE_ITEM_OPTIONS, SVG_WIDTH, A4_PAGE_HEIGHT } from "./constants";
import { buildDiagramLayout } from "./geometry";
import { DiagramCanvas } from "./DiagramCanvas";
import RevisionHistoryPanel from "./RevisionHistoryPanel";
import { HelpModal, PickerModal, ProcessDrawStyles, TextModal, buttonStyle } from "./ui";
import type { ArrowAnnotations, Block, DiagramRecord, ModalState, Side, SideItem } from "./types";

const makeId = () => "n" + Math.random().toString(36).slice(2, 9);
const remarks = (action: string) => window.prompt(`${action} remarks are mandatory. Enter remarks:`)?.trim() || null;

export default function WorkflowSafeProcessDraw({ cloud }: { cloud?: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isCloud = !!cloud;
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [annotations, setAnnotations] = useState<ArrowAnnotations>({});
  const [finalized, setFinalized] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [picker, setPicker] = useState<any>(null);
  const [between, setBetween] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyDiagram, setHistoryDiagram] = useState<DiagramRecord | null>(null);
  const [name, setName] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");

  const diagrams: DiagramRecord[] = cloud?.diagrams || [];
  const canEdit = !isCloud || (cloud?.canEdit && status === "draft");
  const readOnly = finalized || !canEdit;
  const layout = useMemo(() => buildDiagramLayout(blocks, annotations), [blocks, annotations]);
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2200); };
  const markDirty = () => { if (finalized) setFinalized(false); };

  const saveDiagram = async (targetName = name || saveName || "Untitled diagram", shouldFinalize = finalized) => {
    try {
      if (isCloud) {
        const newId = await cloud.onSave(targetName, blocks, annotations, { finalized: shouldFinalize }, currentId || undefined);
        if (newId && !currentId) setCurrentId(newId);
      }
      setName(targetName); setSaveName("");
      showToast(shouldFinalize ? `Finalized and saved ${targetName}` : `Saved ${targetName}`);
      return true;
    } catch (error: any) { showToast(error?.message || "Save failed"); return false; }
  };

  const loadDiagram = (diagram: DiagramRecord) => {
    setBlocks(diagram.blocks || []); setAnnotations(diagram.arrowAnnotations || {}); setName(diagram.name || "");
    setCurrentId(diagram._id || diagram.id || null); setStatus(diagram.status || "draft");
    setFinalized((isCloud && diagram.status !== "draft") || diagram.settings?.finalized === true);
    setSidebarOpen(false); showToast(`Loaded ${diagram.name || "diagram"}`);
  };

  const newDiagram = () => { setBlocks([]); setAnnotations({}); setName(""); setCurrentId(null); setStatus("draft"); setFinalized(false); };
  const addBlock = (text: string) => { markDirty(); setBlocks((prev) => [...prev, { id: makeId(), text, leftItems: [], rightItems: [] }]); };
  const updateBlock = (blockId: string, text: string) => { markDirty(); setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, text } : b)); };
  const deleteBlock = (blockId: string) => { markDirty(); setBlocks((prev) => prev.filter((b) => b.id !== blockId)); };
  const addSideItem = (blockId: string, side: Side, type: string, text: string) => { markDirty(); setBlocks((prev) => prev.map((block) => {
    if (block.id !== blockId) return block;
    const key = side === "left" ? "leftItems" : "rightItems";
    const item: SideItem = { id: makeId(), type, text, arrowDir: side === "left" ? "right" : "left" };
    return { ...block, [key]: [...block[key], item] };
  })); };
  const addAnnotation = (index: number, side: Side, text: string) => { markDirty(); setAnnotations((prev) => {
    const entry = prev[index] || { left: [], right: [] };
    return { ...prev, [index]: { ...entry, [side]: [...entry[side], { id: makeId(), text }] } };
  }); };

  const submitForApproval = async () => {
    if (!finalized) return showToast("Click END / Preview before submitting");
    if (!blocks.length) return showToast("Add at least one process step");
    if (!isCloud) return;
    const r = remarks("Submission"); if (!r) return showToast("Submission remarks are required");
    try {
      const targetName = name || saveName || "Untitled diagram";
      const savedId = await cloud.onSave(targetName, blocks, annotations, { finalized: true }, currentId || undefined);
      const submitId = savedId || currentId;
      if (savedId && !currentId) setCurrentId(savedId);
      if (!submitId) throw new Error("Save failed before submit");
      await cloud.onSubmit(submitId, r);
      setName(targetName); setStatus("submitted"); setFinalized(true); showToast("Finalized and submitted for approval");
    } catch (error: any) { showToast(error?.message || "Submit failed"); }
  };

  const approverAction = async (diagram: DiagramRecord, action: "approved" | "reverted" | "rejected") => {
    if (!diagram._id) return;
    const label = action === "approved" ? "Approval" : action === "reverted" ? "Revert" : "Rejection";
    const r = remarks(label); if (!r) return showToast(`${label} remarks are required`);
    try {
      if (action === "reverted") await cloud.onSendBack(diagram._id, r);
      else await cloud.onReview(diagram._id, action, r);
      showToast(action === "approved" ? "Diagram approved" : action === "reverted" ? "Diagram reverted for correction" : "Diagram rejected and workflow closed");
    } catch (error: any) { showToast(error?.message || "Action failed"); }
  };

  const exportCanvas = async (asPdf = false) => {
    if (!svgRef.current) return;
    const data = new XMLSerializer().serializeToString(svgRef.current);
    const image = new Image(); const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));
    image.onload = async () => {
      const canvas = document.createElement("canvas"); canvas.width = SVG_WIDTH * 2; canvas.height = layout.height * 2;
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
      if (asPdf) { const { default: jsPDF } = await import("jspdf"); const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [SVG_WIDTH, A4_PAGE_HEIGHT] }); for (let p = 0; p < layout.pages; p++) { if (p) pdf.addPage([SVG_WIDTH, A4_PAGE_HEIGHT]); pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, -p * A4_PAGE_HEIGHT, SVG_WIDTH, layout.height); } pdf.save("ProcessDraw_Diagram.pdf"); }
      else { const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = "ProcessDraw_Diagram.png"; link.click(); }
      showToast(asPdf ? "PDF exported" : "PNG exported");
    };
    image.src = url;
  };

  const finishModal = (text: string) => {
    if (!modal) return;
    if (modal.type === "new") addBlock(text);
    if (modal.type === "edit") updateBlock(modal.blockId, text);
    if (modal.type === "side") addSideItem(modal.blockId, modal.side, modal.sideType, text);
    if (modal.type === "ann") addAnnotation(modal.index, modal.side, text);
    setModal(null);
  };
  const modalTitle = () => modal?.type === "new" ? "Add process step" : modal?.type === "edit" ? "Edit block" : modal?.type === "side" ? "Add side item" : modal?.type === "ann" ? "Add arrow annotation" : "";
  const modalInitial = () => modal?.type === "edit" ? blocks.find((b) => b.id === modal.blockId)?.text || "" : "";

  return (
    <div className="pd">
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <ProcessDrawStyles />

      {sidebarOpen && <aside className="pd-side">
        <h2>Saved diagrams</h2>
        <div style={{ padding: 12, borderBottom: `1px solid ${COLORS.border}` }}>
          <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Diagram name" style={{ width: "100%", boxSizing: "border-box", padding: 8, border: `1px solid ${COLORS.border}`, borderRadius: 8, marginBottom: 8 }} />
          <button style={{ ...buttonStyle("primary"), width: "100%" }} onClick={() => saveDiagram(undefined, finalized)}>Save current</button>
        </div>
        <div className="pd-list">
          {diagrams.length ? diagrams.map((diagram) => <div className="pd-card" key={diagram._id || diagram.id || diagram.name} onClick={() => loadDiagram(diagram)}>
            <b>{diagram.name}</b>
            <span>{diagram.blocks?.length || 0} steps · {diagram.status || "draft"}{diagram.currentRevision !== undefined ? ` · Rev ${diagram.currentRevision}` : ""}{diagram.settings?.finalized ? " · finalized" : ""}</span>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
              {diagram._id && <button style={buttonStyle()} onClick={() => setHistoryDiagram(diagram)}>History</button>}
              {cloud?.isApprover && diagram.status === "submitted" && <>
                <button style={buttonStyle("success")} onClick={() => approverAction(diagram, "approved")}>Approve</button>
                <button style={buttonStyle("warn")} onClick={() => approverAction(diagram, "reverted")}>Revert</button>
                <button style={buttonStyle("danger")} onClick={() => approverAction(diagram, "rejected")}>Reject</button>
              </>}
            </div>
            {diagram.status === "rejected" && diagram.rejectionComment && <span style={{ display: "block", color: COLORS.danger, marginTop: 6 }}>Rejected: {diagram.rejectionComment}</span>}
          </div>) : <p style={{ color: COLORS.light, textAlign: "center" }}>No saved diagrams yet.</p>}
        </div>
      </aside>}

      <main className="pd-main">
        <header className="pd-top"><div className="pd-brand"><button style={buttonStyle()} onClick={() => setSidebarOpen((v) => !v)}>☰</button><h1>ProcessDraw</h1><span style={{ color: COLORS.light, fontSize: 11 }}>by KJR Labs</span>{isCloud && <span style={{ background: COLORS.accentLight, color: COLORS.accent, borderRadius: 99, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>{cloud.role?.replace("_", " ")}</span>}</div>
          <div className="pd-actions">
            {blocks.length > 0 && currentId && isCloud && <button style={buttonStyle()} onClick={() => setHistoryDiagram({ _id: currentId, name })}>History</button>}
            {blocks.length > 0 && canEdit && !finalized && <button style={buttonStyle("primary")} onClick={() => saveDiagram(name || "Untitled diagram", false)}>Save draft</button>}
            <button style={buttonStyle()} onClick={() => setModal({ type: "help" })}>?</button>
            {blocks.length > 0 && canEdit && <button style={buttonStyle("danger")} onClick={newDiagram}>New</button>}
            {blocks.length > 0 && !finalized && canEdit && <button style={buttonStyle("warn")} onClick={() => { setFinalized(true); showToast("Diagram finalized. Submit will save this final version."); }}>END / Preview</button>}
            {blocks.length > 0 && finalized && canEdit && <button style={buttonStyle()} onClick={() => { setFinalized(false); showToast("Editing resumed. Finalize again before submission."); }}>Edit</button>}
            {blocks.length > 0 && finalized && isCloud && status === "draft" && cloud.canEdit && <button style={buttonStyle("warn")} onClick={submitForApproval}>Submit</button>}
            {blocks.length > 0 && finalized && (!isCloud || status === "approved") && <button style={buttonStyle("primary")} onClick={() => exportCanvas(false)}>PNG</button>}
            {blocks.length > 0 && finalized && (!isCloud || status === "approved") && <button style={buttonStyle("purple")} onClick={() => exportCanvas(true)}>PDF</button>}
            {isCloud && cloud.UserButton}
          </div></header>
        {blocks.length ? <><div className="pd-bar"><span>{name || "Untitled diagram"} · {blocks.length} steps · {layout.pages} A4 page{layout.pages > 1 ? "s" : ""} · {status.toUpperCase()} · {finalized ? "FINALIZED" : "DRAFT"}</span><span><button style={buttonStyle()} onClick={() => setZoom((v) => Math.max(.55, +(v - .1).toFixed(2)))}>−</button> <button style={buttonStyle()} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button> <button style={buttonStyle()} onClick={() => setZoom((v) => Math.min(1.6, +(v + .1).toFixed(2)))}>+</button></span></div><div className="pd-canvas"><div className="pd-wrap" style={{ transform: `scale(${zoom})` }}><DiagramCanvas svgRef={svgRef} layout={layout} blocks={blocks} annotations={annotations} readOnly={readOnly} onEditBlock={(blockId) => setModal({ type: "edit", blockId })} onDeleteBlock={deleteBlock} onAddBlock={() => setModal({ type: "new" })} onFinalize={() => { setFinalized(true); showToast("Diagram finalized. Submit will save this final version."); }} onPickSide={(blockId, side) => setPicker({ blockId, side })} onPickBetween={(index) => setBetween({ index })} /></div></div></> : <div className="pd-empty"><h2>{isCloud && cloud.role === "approver" ? "Review diagrams" : "Build a process flow"}</h2><p>Create print-ready process flow diagrams with clean GMP-style layout.</p>{canEdit && <button className="pd-plus" onClick={() => setModal({ type: "new" })}>+</button>}<button style={buttonStyle("primary")} onClick={() => setSidebarOpen(true)}>{diagrams.length ? `Open saved (${diagrams.length})` : "Saved diagrams"}</button></div>}
      </main>

      {historyDiagram?._id && <RevisionHistoryPanel diagramId={historyDiagram._id} diagramName={historyDiagram.name} onClose={() => setHistoryDiagram(null)} />}
      {modal && modal.type !== "help" && <TextModal title={modalTitle()} initial={modalInitial()} placeholder="e.g. Reactor\nGLR-805" onOk={finishModal} onClose={() => setModal(null)} />}
      {modal?.type === "help" && <HelpModal onClose={() => setModal(null)} />}
      {picker && <PickerModal title={`Add to ${picker.side} side`} options={SIDE_ITEM_OPTIONS} onPick={(type: string) => { setModal({ type: "side", blockId: picker.blockId, side: picker.side, sideType: type }); setPicker(null); }} onClose={() => setPicker(null)} />}
      {between && <PickerModal title="Add annotation" options={ANNOTATION_SIDE_OPTIONS} onPick={(side: Side) => { setModal({ type: "ann", index: between.index, side }); setBetween(null); }} onClose={() => setBetween(null)} />}
      {toast && <div className="pd-toast">{toast}</div>}
    </div>
  );
}
