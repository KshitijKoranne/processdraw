"use client";

import { useMemo, useRef, useState } from "react";
import { ANNOTATION_SIDE_OPTIONS, SIDE_ITEM_OPTIONS } from "./constants";
import { buildDiagramLayout } from "./geometry";
import RevisionHistoryPanel from "./RevisionHistoryPanel";
import ESignModal, { type ESignActionType } from "./ESignModal";
import NotificationsBell from "./NotificationsPanel";
import WorkflowSidebar from "./WorkflowSidebar";
import WorkflowToolbar from "./WorkflowToolbar";
import WorkflowCanvasArea from "./WorkflowCanvasArea";
import { exportDiagramCanvas } from "./workflowExport";
import { ConfirmModal, HelpModal, PickerModal, ProcessDrawStyles, TextModal } from "./ui";
import type { ArrowAnnotations, Block, DiagramRecord, ModalState, Side, SideItem } from "./types";

const makeId = () => "n" + Math.random().toString(36).slice(2, 9);
type ESignState = { type: ESignActionType; diagram?: DiagramRecord } | null;
type ConfirmState = { title: string; message: string; confirmLabel: string; onConfirm: () => void } | null;

// Older records may be missing ids on side items; ids are required for
// editing (arrow toggles, React keys), so backfill them on load.
const normalizeBlocks = (blocks: Block[]): Block[] =>
  (blocks || []).map((block) => ({
    ...block,
    id: block.id || makeId(),
    leftItems: (block.leftItems || []).map((item) => ({ ...item, id: item.id || makeId() })),
    rightItems: (block.rightItems || []).map((item) => ({ ...item, id: item.id || makeId() })),
  }));

const WATERMARKS: Record<string, string> = {
  draft: "DRAFT",
  submitted: "PENDING APPROVAL",
  rejected: "REJECTED",
};

export default function WorkflowSafeProcessDraw({ cloud }: { cloud?: any }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const toastTimer = useRef<number | null>(null);
  const isCloud = !!cloud;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [annotations, setAnnotations] = useState<ArrowAnnotations>({});
  const [finalized, setFinalized] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [picker, setPicker] = useState<any>(null);
  const [between, setBetween] = useState<any>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyDiagram, setHistoryDiagram] = useState<DiagramRecord | null>(null);
  const [esignAction, setEsignAction] = useState<ESignState>(null);
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
  const exportWatermark = isCloud && status !== "approved" ? WATERMARKS[status] || "DRAFT" : undefined;

  const showToast = (msg: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const markDirty = () => {
    if (finalized) setFinalized(false);
  };

  const saveDiagram = async (targetName = name || saveName || "Untitled diagram") => {
    try {
      if (isCloud) {
        const newId = await cloud.onSave(targetName, blocks, annotations, {}, currentId || undefined);
        if (newId && !currentId) setCurrentId(newId);
      }
      setName(targetName);
      setSaveName("");
      showToast(`Saved ${targetName}`);
      return true;
    } catch (error: any) {
      showToast(error?.message || "Save failed");
      return false;
    }
  };

  const loadDiagram = (diagram: DiagramRecord) => {
    setBlocks(normalizeBlocks(diagram.blocks || []));
    setAnnotations(diagram.arrowAnnotations || {});
    setName(diagram.name || "");
    setCurrentId(diagram._id || diagram.id || null);
    setStatus(diagram.status || "draft");
    setFinalized((isCloud && diagram.status !== "draft") || diagram.settings?.finalized === true);
    setSidebarOpen(false);
    showToast(`Loaded ${diagram.name || "diagram"}`);
  };

  const resetCanvas = () => {
    setBlocks([]);
    setAnnotations({});
    setName("");
    setCurrentId(null);
    setStatus("draft");
    setFinalized(false);
  };

  const newDiagram = () => {
    if (!blocks.length) return resetCanvas();
    setConfirm({
      title: "Start a new diagram?",
      message: currentId
        ? "The canvas will be cleared. Changes since your last save will be lost."
        : "The canvas will be cleared. This diagram has not been saved and will be lost.",
      confirmLabel: "Clear canvas",
      onConfirm: resetCanvas,
    });
  };

  const deleteSavedDiagram = (diagram: DiagramRecord) => {
    setConfirm({
      title: "Delete diagram?",
      message: `"${diagram.name || "Untitled diagram"}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await cloud.onDelete(diagram._id);
          if (currentId && diagram._id === currentId) resetCanvas();
          showToast(`Deleted ${diagram.name || "diagram"}`);
        } catch (error: any) {
          showToast(error?.message || "Delete failed");
        }
      },
    });
  };

  const addBlock = (text: string) => {
    markDirty();
    setBlocks((prev) => [...prev, { id: makeId(), text, leftItems: [], rightItems: [] }]);
  };

  const updateBlock = (blockId: string, text: string) => {
    markDirty();
    setBlocks((prev) => prev.map((block) => block.id === blockId ? { ...block, text } : block));
  };

  const deleteBlock = (blockId: string) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;
    markDirty();
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
    // Arrow annotations are keyed by block index; shift them so they stay
    // attached to the same arrows after the deletion.
    setAnnotations((prev) => {
      const next: ArrowAnnotations = {};
      Object.entries(prev).forEach(([key, entry]) => {
        const annIndex = Number(key);
        if (annIndex < index) next[annIndex] = entry;
        else if (annIndex > index) next[annIndex - 1] = entry;
        // annIndex === index: the arrow below the deleted block is gone.
      });
      return next;
    });
  };

  const confirmDeleteBlock = (blockId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    const hasSideItems = !!block && (block.leftItems.length > 0 || block.rightItems.length > 0);
    if (!hasSideItems) return deleteBlock(blockId);
    setConfirm({
      title: "Delete process step?",
      message: "This step and all of its side items (inputs, equipment, IPQC checks) will be removed.",
      confirmLabel: "Delete step",
      onConfirm: () => deleteBlock(blockId),
    });
  };

  const toggleSideArrow = (blockId: string, side: Side, itemId: string) => {
    markDirty();
    const key = side === "left" ? "leftItems" : "rightItems";
    setBlocks((prev) => prev.map((block) => block.id !== blockId ? block : {
      ...block,
      [key]: block[key].map((item) => item.id === itemId ? { ...item, arrowDir: item.arrowDir === "right" ? "left" : "right" } : item),
    }));
  };

  const addSideItem = (blockId: string, side: Side, type: string, text: string) => {
    markDirty();
    setBlocks((prev) => prev.map((block) => {
      if (block.id !== blockId) return block;
      const key = side === "left" ? "leftItems" : "rightItems";
      const item: SideItem = { id: makeId(), type, text, arrowDir: side === "left" ? "right" : "left" };
      return { ...block, [key]: [...block[key], item] };
    }));
  };

  const addAnnotation = (index: number, side: Side, text: string) => {
    markDirty();
    setAnnotations((prev) => {
      const entry = prev[index] || { left: [], right: [] };
      return { ...prev, [index]: { ...entry, [side]: [...entry[side], { id: makeId(), text }] } };
    });
  };

  const submitForApproval = async (remarks: string) => {
    if (!finalized) return showToast("Click END / Preview before submitting");
    if (!blocks.length) return showToast("Add at least one process step");
    if (!isCloud) return;

    try {
      const targetName = name || saveName || "Untitled diagram";
      const savedId = await cloud.onSave(targetName, blocks, annotations, {}, currentId || undefined);
      const submitId = savedId || currentId;
      if (savedId && !currentId) setCurrentId(savedId);
      if (!submitId) throw new Error("Save failed before submit");
      await cloud.onSubmit(submitId, remarks);
      setName(targetName);
      setStatus("submitted");
      setFinalized(true);
      setEsignAction(null);
      showToast("Finalized and submitted for approval");
    } catch (error: any) {
      showToast(error?.message || "Submit failed");
    }
  };

  const approverAction = async (diagram: DiagramRecord, action: "approved" | "reverted" | "rejected", remarks: string) => {
    if (!diagram._id) return;
    try {
      if (action === "reverted") await cloud.onSendBack(diagram._id, remarks);
      else await cloud.onReview(diagram._id, action, remarks);
      if (currentId && diagram._id === currentId) setStatus(action === "reverted" ? "draft" : action);
      setEsignAction(null);
      showToast(action === "approved" ? "Diagram approved" : action === "reverted" ? "Diagram reverted for correction" : "Diagram rejected and workflow closed");
    } catch (error: any) {
      showToast(error?.message || "Action failed");
    }
  };

  const handleESignConfirm = async (remarks: string) => {
    if (!esignAction) return;
    if (esignAction.type === "submit") return submitForApproval(remarks);
    if (!esignAction.diagram) return;
    const action = esignAction.type === "approve" ? "approved" : esignAction.type === "revert" ? "reverted" : "rejected";
    return approverAction(esignAction.diagram, action, remarks);
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
  const modalInitial = () => modal?.type === "edit" ? blocks.find((block) => block.id === modal.blockId)?.text || "" : "";

  return (
    <div className="pd">
      <ProcessDrawStyles />

      {sidebarOpen && (
        <WorkflowSidebar
          diagrams={diagrams}
          saveName={saveName}
          setSaveName={setSaveName}
          canEdit={cloud ? cloud.canEdit : true}
          onSaveCurrent={() => saveDiagram()}
          onLoadDiagram={loadDiagram}
          onOpenHistory={setHistoryDiagram}
          onDelete={deleteSavedDiagram}
          isApprover={cloud?.isApprover}
          onApprove={(diagram) => setEsignAction({ type: "approve", diagram })}
          onRevert={(diagram) => setEsignAction({ type: "revert", diagram })}
          onReject={(diagram) => setEsignAction({ type: "reject", diagram })}
        />
      )}

      <main className="pd-main">
        <WorkflowToolbar
          role={cloud?.role}
          hasBlocks={blocks.length > 0}
          currentId={currentId}
          isCloud={isCloud}
          canEdit={canEdit}
          finalized={finalized}
          status={status}
          canSubmit={cloud?.canEdit}
          userButton={cloud?.UserButton}
          notificationsBell={isCloud ? (
            <NotificationsBell
              notifications={cloud.notifications || []}
              unreadCount={cloud.unreadCount || 0}
              onMarkRead={cloud.onMarkRead}
              onMarkAllRead={cloud.onMarkAllRead}
            />
          ) : undefined}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          onOpenHistory={() => setHistoryDiagram({ _id: currentId || undefined, name })}
          onSaveDraft={() => saveDiagram(name || "Untitled diagram")}
          onHelp={() => setModal({ type: "help" })}
          onNew={newDiagram}
          onFinalize={() => { setFinalized(true); showToast("Diagram finalized. Submit will save this final version."); }}
          onEdit={() => { setFinalized(false); showToast("Editing resumed. Finalize again before submission."); }}
          onSubmit={() => setEsignAction({ type: "submit" })}
          onExportPng={() => exportDiagramCanvas({ svg: svgRef.current, layout, asPdf: false, name: name || "ProcessDraw_Diagram", watermark: exportWatermark, showToast })}
          onExportPdf={() => exportDiagramCanvas({ svg: svgRef.current, layout, asPdf: true, name: name || "ProcessDraw_Diagram", watermark: exportWatermark, showToast })}
        />

        <WorkflowCanvasArea
          svgRef={svgRef}
          blocks={blocks}
          annotations={annotations}
          layout={layout}
          readOnly={readOnly}
          canEdit={canEdit}
          isCloud={isCloud}
          role={cloud?.role}
          name={name}
          status={status}
          finalized={finalized}
          zoom={zoom}
          setZoom={setZoom}
          onEditBlock={(blockId) => setModal({ type: "edit", blockId })}
          onDeleteBlock={confirmDeleteBlock}
          onAddBlock={() => setModal({ type: "new" })}
          onFinalize={() => { setFinalized(true); showToast("Diagram finalized. Submit will save this final version."); }}
          onPickSide={(blockId, side) => setPicker({ blockId, side })}
          onPickBetween={(index) => setBetween({ index })}
          onToggleSideArrow={toggleSideArrow}
          onOpenSaved={() => setSidebarOpen(true)}
        />
      </main>

      {esignAction && <ESignModal action={esignAction.type} diagramName={esignAction.diagram?.name || name} userName={cloud?.userName} userEmail={cloud?.userEmail} role={cloud?.role} onCancel={() => setEsignAction(null)} onConfirm={handleESignConfirm} />}
      {historyDiagram?._id && <RevisionHistoryPanel diagramId={historyDiagram._id} diagramName={historyDiagram.name} onClose={() => setHistoryDiagram(null)} />}
      {modal && modal.type !== "help" && <TextModal title={modalTitle()} initial={modalInitial()} placeholder={"e.g. Reactor\nGLR-805"} onOk={finishModal} onClose={() => setModal(null)} />}
      {modal?.type === "help" && <HelpModal onClose={() => setModal(null)} />}
      {picker && <PickerModal title={`Add to ${picker.side} side`} options={SIDE_ITEM_OPTIONS} onPick={(type: string) => { setModal({ type: "side", blockId: picker.blockId, side: picker.side, sideType: type }); setPicker(null); }} onClose={() => setPicker(null)} />}
      {between && <PickerModal title="Add annotation" options={ANNOTATION_SIDE_OPTIONS} onPick={(side: Side) => { setModal({ type: "ann", index: between.index, side }); setBetween(null); }} onClose={() => setBetween(null)} />}
      {confirm && <ConfirmModal title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} onConfirm={confirm.onConfirm} onClose={() => setConfirm(null)} />}
      {toast && <div className="pd-toast" role="status">{toast}</div>}
    </div>
  );
}
