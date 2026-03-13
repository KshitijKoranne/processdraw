import { useState, useRef, useCallback, useEffect } from "react";

const EQUIPMENT_TYPES = [
  { id: "reactor", label: "Reactor", subtypes: ["GLR", "SSR", "SS Reactor"], color: "#1a1a1a" },
  { id: "centrifuge", label: "Centrifuge", subtypes: ["SCF", "Nutsche Filter"], color: "#1a1a1a" },
  { id: "dryer", label: "Dryer", subtypes: ["Rotocone/RCD", "Tray Dryer", "FBD"], color: "#1a1a1a" },
  { id: "mill", label: "Mill", subtypes: ["Multimill", "Jetimill", "Comill"], color: "#1a1a1a" },
  { id: "tank", label: "Storage/Holding Tank", subtypes: ["SS Tank", "HDPE Tank"], color: "#1a1a1a" },
  { id: "ipqc", label: "IPQC Checkpoint", subtypes: ["IPQC"], color: "#1a1a1a" },
  { id: "custom", label: "Custom Block", subtypes: ["Custom"], color: "#1a1a1a" },
];

const TEMPLATES = [
  {
    id: "purification",
    name: "Purification & Isolation",
    description: "Reactor → Centrifuge → Dryer → Milling",
    steps: [
      { id: "t1", equipmentType: "reactor", subtype: "SSR", name: "Reactor", equipId: "SSR-806/812", leftInputs: [{ label: "Celecoxib crude\nWet cake Stage-I" }, { label: "Activated carbon +\nMethanol" }], rightInputs: [{ label: "Methanol" }], leftOutputs: [], rightOutputs: [], note: "" },
      { id: "t2", equipmentType: "reactor", subtype: "GLR", name: "Reactor", equipId: "GLR-805", leftInputs: [{ label: "Methanol\n(Through SP-804)" }], rightInputs: [{ label: "Purified water" }], leftOutputs: [], rightOutputs: [], note: "" },
      { id: "t3", equipmentType: "centrifuge", subtype: "SCF", name: "Centrifuge", equipId: "SCF-804", leftInputs: [{ label: "Methanol +\nPurified water" }], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "ML" }], note: "" },
      { id: "t4", equipmentType: "dryer", subtype: "Rotocone/RCD", name: "Rotocone Vacuum\nDryer", equipId: "RCD-802", leftInputs: [{ label: "Wet cake" }], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "IPQC check for % M/C\n& %LOD (Limit: NMT 0.5%)" }], note: "" },
      { id: "t5", equipmentType: "mill", subtype: "Multimill", name: "Multimill", equipId: "MM-801", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [], note: "" },
      { id: "t6", equipmentType: "mill", subtype: "Jetimill", name: "Jetimill", equipId: "JM-802", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "IPQC Check for PSD\n(Limit: as per requirement)" }], note: "(If applicable)" },
    ],
  },
  {
    id: "reaction",
    name: "Reaction → Workup → Isolation",
    description: "Standard reaction with workup and isolation",
    steps: [
      { id: "r1", equipmentType: "reactor", subtype: "GLR", name: "Reactor", equipId: "GLR-801", leftInputs: [{ label: "Raw Material A" }], rightInputs: [{ label: "Solvent" }], leftOutputs: [], rightOutputs: [], note: "" },
      { id: "r2", equipmentType: "reactor", subtype: "GLR", name: "Reactor", equipId: "GLR-802", leftInputs: [{ label: "Reagent B" }], rightInputs: [{ label: "Purified water" }], leftOutputs: [], rightOutputs: [{ label: "IPQC: Reaction\ncompletion by TLC/HPLC" }], note: "Workup" },
      { id: "r3", equipmentType: "centrifuge", subtype: "Nutsche Filter", name: "Nutsche Filter", equipId: "NF-801", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "ML to ETP" }], note: "" },
      { id: "r4", equipmentType: "dryer", subtype: "Tray Dryer", name: "Tray Dryer", equipId: "TD-801", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "IPQC: %LOD\n(Limit: NMT 1.0%)" }], note: "" },
    ],
  },
  {
    id: "crystallization",
    name: "Crystallization → Filtration → Drying",
    description: "Standard crystallization and isolation flow",
    steps: [
      { id: "c1", equipmentType: "reactor", subtype: "SSR", name: "Reactor", equipId: "SSR-801", leftInputs: [{ label: "Crude API" }], rightInputs: [{ label: "Solvent (Methanol)" }], leftOutputs: [], rightOutputs: [], note: "Dissolution" },
      { id: "c2", equipmentType: "reactor", subtype: "SSR", name: "Reactor", equipId: "SSR-802", leftInputs: [{ label: "Anti-solvent\n(Purified water)" }], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "IPQC: Crystal\nformation check" }], note: "Crystallization" },
      { id: "c3", equipmentType: "centrifuge", subtype: "SCF", name: "Centrifuge", equipId: "SCF-801", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "Mother Liquor" }], note: "" },
      { id: "c4", equipmentType: "dryer", subtype: "FBD", name: "Fluid Bed Dryer", equipId: "FBD-801", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "IPQC: %LOD\n(Limit: NMT 0.5%)" }], note: "" },
      { id: "c5", equipmentType: "mill", subtype: "Comill", name: "Comill", equipId: "CM-801", leftInputs: [], rightInputs: [], leftOutputs: [], rightOutputs: [{ label: "IPQC: PSD check" }], note: "" },
    ],
  },
];

const genId = () => "s" + Math.random().toString(36).slice(2, 9);

const defaultStep = () => ({
  id: genId(),
  equipmentType: "reactor",
  subtype: "GLR",
  name: "Reactor",
  equipId: "",
  leftInputs: [],
  rightInputs: [],
  leftOutputs: [],
  rightOutputs: [],
  note: "",
});

// --- Diagram Renderer (SVG-based, B&W, GMP style) ---
const BLOCK_W = 180;
const BLOCK_H = 56;
const V_GAP = 60;
const SIDE_GAP = 180;
const CANVAS_PAD = 60;
const ARROW_SIZE = 7;
const FONT = "'IBM Plex Sans', 'Segoe UI', Arial, sans-serif";

function measureTextLines(text, fontSize = 12) {
  const lines = text.split("\n");
  return { lines, height: lines.length * (fontSize + 4) };
}

function DiagramSVG({ steps, svgRef }) {
  if (!steps.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", fontFamily: FONT, fontSize: 15 }}>
        Add process steps to start building your diagram
      </div>
    );
  }

  const centerX = 400;
  let yPositions = [];
  let y = CANVAS_PAD;
  steps.forEach((step) => {
    yPositions.push(y);
    const noteH = step.note ? 18 : 0;
    const leftH = step.leftInputs.length * 28;
    const rightH = step.rightInputs.length * 28 + step.rightOutputs.length * 28;
    const extraH = Math.max(0, Math.max(leftH, rightH) - BLOCK_H);
    y += BLOCK_H + noteH + V_GAP + extraH;
  });

  const totalH = y + CANVAS_PAD;
  const totalW = centerX * 2;

  const elements = [];

  steps.forEach((step, i) => {
    const bx = centerX - BLOCK_W / 2;
    const by = yPositions[i];

    // Block
    elements.push(
      <rect key={`block-${i}`} x={bx} y={by} width={BLOCK_W} height={BLOCK_H} fill="white" stroke="#1a1a1a" strokeWidth={1.5} />
    );

    // Block label
    const labelLines = step.name.split("\n");
    const hasEquipId = step.equipId.trim() !== "";
    const allLines = [...labelLines, ...(hasEquipId ? [step.equipId] : [])];
    const lineH = 15;
    const startY = by + BLOCK_H / 2 - ((allLines.length - 1) * lineH) / 2;
    allLines.forEach((line, li) => {
      elements.push(
        <text key={`label-${i}-${li}`} x={centerX} y={startY + li * lineH} textAnchor="middle" dominantBaseline="central"
          fontFamily={FONT} fontSize={li < labelLines.length ? 13 : 12} fontWeight={li < labelLines.length ? "bold" : "normal"} fill="#1a1a1a">
          {line}
        </text>
      );
    });

    // Note below block
    if (step.note) {
      elements.push(
        <text key={`note-${i}`} x={centerX} y={by + BLOCK_H + 14} textAnchor="middle" fontFamily={FONT} fontSize={11} fill="#555" fontStyle="italic">
          {step.note}
        </text>
      );
    }

    // Arrow to next
    if (i < steps.length - 1) {
      const arrowY1 = by + BLOCK_H;
      const arrowY2 = yPositions[i + 1];
      elements.push(
        <line key={`arrow-${i}`} x1={centerX} y1={arrowY1} x2={centerX} y2={arrowY2} stroke="#1a1a1a" strokeWidth={1.2} />,
        <polygon key={`arrowhead-${i}`}
          points={`${centerX},${arrowY2} ${centerX - ARROW_SIZE / 2},${arrowY2 - ARROW_SIZE} ${centerX + ARROW_SIZE / 2},${arrowY2 - ARROW_SIZE}`}
          fill="#1a1a1a" />
      );
    }

    // Left inputs
    step.leftInputs.forEach((inp, li) => {
      const iy = by + 14 + li * 28;
      const lx = bx - SIDE_GAP;
      // Box for left input
      const txtMeasure = measureTextLines(inp.label, 11);
      const boxH = Math.max(36, txtMeasure.height + 12);
      const boxW = 130;

      elements.push(
        <rect key={`linp-box-${i}-${li}`} x={lx} y={iy - boxH / 2} width={boxW} height={boxH} fill="white" stroke="#1a1a1a" strokeWidth={1} />
      );
      txtMeasure.lines.forEach((tl, tli) => {
        elements.push(
          <text key={`linp-t-${i}-${li}-${tli}`} x={lx + boxW / 2} y={iy - ((txtMeasure.lines.length - 1) * 13) / 2 + tli * 13}
            textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={11} fill="#1a1a1a">
            {tl}
          </text>
        );
      });

      // Arrow from left input to block
      elements.push(
        <line key={`linp-arr-${i}-${li}`} x1={lx + boxW} y1={iy} x2={bx} y2={iy} stroke="#1a1a1a" strokeWidth={1} />,
        <polygon key={`linp-ah-${i}-${li}`}
          points={`${bx},${iy} ${bx - ARROW_SIZE},${iy - ARROW_SIZE / 2} ${bx - ARROW_SIZE},${iy + ARROW_SIZE / 2}`}
          fill="#1a1a1a" />
      );
    });

    // Right inputs
    step.rightInputs.forEach((inp, ri) => {
      const iy = by + 14 + ri * 28;
      const rx = bx + BLOCK_W + 20;
      const txtMeasure = measureTextLines(inp.label, 11);
      const boxH = Math.max(36, txtMeasure.height + 12);
      const boxW = 130;

      elements.push(
        <rect key={`rinp-box-${i}-${ri}`} x={rx + SIDE_GAP - boxW - 20} y={iy - boxH / 2} width={boxW} height={boxH} fill="white" stroke="#1a1a1a" strokeWidth={1} />
      );
      txtMeasure.lines.forEach((tl, tli) => {
        elements.push(
          <text key={`rinp-t-${i}-${ri}-${tli}`} x={rx + SIDE_GAP - boxW / 2 - 20} y={iy - ((txtMeasure.lines.length - 1) * 13) / 2 + tli * 13}
            textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontSize={11} fill="#1a1a1a">
            {tl}
          </text>
        );
      });

      elements.push(
        <line key={`rinp-arr-${i}-${ri}`} x1={rx + SIDE_GAP - boxW - 20} y1={iy} x2={bx + BLOCK_W} y2={iy} stroke="#1a1a1a" strokeWidth={1} />,
        <polygon key={`rinp-ah-${i}-${ri}`}
          points={`${bx + BLOCK_W},${iy} ${bx + BLOCK_W + ARROW_SIZE},${iy - ARROW_SIZE / 2} ${bx + BLOCK_W + ARROW_SIZE},${iy + ARROW_SIZE / 2}`}
          fill="#1a1a1a" />
      );
    });

    // Right outputs (IPQC style — no box, just arrow + text)
    step.rightOutputs.forEach((out, oi) => {
      const oy = by + BLOCK_H / 2 + 10 + (step.rightInputs.length * 28) + oi * 32;
      const ox = bx + BLOCK_W;

      elements.push(
        <line key={`rout-arr-${i}-${oi}`} x1={ox} y1={Math.min(oy, by + BLOCK_H - 5)} x2={ox + 30} y2={oy} stroke="#1a1a1a" strokeWidth={1} />,
        <polygon key={`rout-ah-${i}-${oi}`}
          points={`${ox + 30},${oy} ${ox + 30 - ARROW_SIZE},${oy - ARROW_SIZE / 2} ${ox + 30 - ARROW_SIZE},${oy + ARROW_SIZE / 2}`}
          fill="#1a1a1a" />
      );

      const outLines = out.label.split("\n");
      outLines.forEach((ol, oli) => {
        elements.push(
          <text key={`rout-t-${i}-${oi}-${oli}`} x={ox + 36} y={oy - ((outLines.length - 1) * 13) / 2 + oli * 13}
            textAnchor="start" dominantBaseline="central" fontFamily={FONT} fontSize={11} fill="#1a1a1a">
            {ol}
          </text>
        );
      });
    });
  });

  return (
    <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox={`0 0 ${totalW} ${totalH}`}
      style={{ background: "white", fontFamily: FONT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>
      {elements}
    </svg>
  );
}


// --- Main App ---
export default function ProcessDraw() {
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [dragIdx, setDragIdx] = useState(null);
  const [toast, setToast] = useState(null);
  const svgRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("processdraw_steps");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSteps(parsed);
          setShowTemplates(false);
        }
      }
    } catch (e) { /* ignore */ }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (steps.length > 0) {
      localStorage.setItem("processdraw_steps", JSON.stringify(steps));
    }
  }, [steps]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const addStep = (type) => {
    const eq = EQUIPMENT_TYPES.find((e) => e.id === type);
    const newStep = {
      ...defaultStep(),
      equipmentType: type,
      subtype: eq.subtypes[0],
      name: eq.label,
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStep(newStep.id);
    setShowTemplates(false);
  };

  const loadTemplate = (template) => {
    const cloned = template.steps.map((s) => ({ ...s, id: genId(), leftInputs: [...s.leftInputs], rightInputs: [...s.rightInputs], leftOutputs: [...s.leftOutputs], rightOutputs: [...s.rightOutputs] }));
    setSteps(cloned);
    setSelectedStep(cloned[0]?.id || null);
    setShowTemplates(false);
  };

  const updateStep = (id, updates) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (selectedStep === id) setSelectedStep(null);
  };

  const moveStep = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= steps.length) return;
    setSteps((prev) => {
      const n = [...prev];
      const [item] = n.splice(fromIdx, 1);
      n.splice(toIdx, 0, item);
      return n;
    });
  };

  const clearAll = () => {
    setSteps([]);
    setSelectedStep(null);
    setShowTemplates(true);
    localStorage.removeItem("processdraw_steps");
  };

  // Export as PNG
  const exportPNG = useCallback(async () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const vb = svgEl.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 800, 600];
    const w = vb[2] * 2;
    const h = vb[3] * 2;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);

    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b);
          a.download = "ProcessDraw_Diagram.png";
          a.click();
          showToast("PNG downloaded!");
          resolve();
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
    const w = vb[2] * 2;
    const h = vb[3] * 2;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, w, h);

    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = async () => {
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(async (b) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
          showToast("Copied to clipboard!");
        } catch (e) {
          showToast("Copy failed — try download instead");
        }
      }, "image/png");
    };
    img.src = url;
  }, []);

  const sel = steps.find((s) => s.id === selectedStep);

  const sideIOEditor = (label, items, setItems) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
        <button onClick={() => setItems([...items, { label: "" }])}
          style={{ background: "none", border: "1px solid #444", color: "#ccc", borderRadius: 3, fontSize: 11, padding: "1px 7px", cursor: "pointer" }}>+ Add</button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <input value={item.label} onChange={(e) => { const n = [...items]; n[idx] = { label: e.target.value }; setItems(n); }}
            placeholder="e.g. Methanol, IPQC check..."
            style={{ flex: 1, background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 3, padding: "4px 7px", fontSize: 12, fontFamily: "inherit" }} />
          <button onClick={() => setItems(items.filter((_, j) => j !== idx))}
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'IBM Plex Sans', sans-serif", background: "#111", color: "#eee", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Left Sidebar */}
      <div style={{ width: 280, background: "#1a1a1a", borderRight: "1px solid #333", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #333" }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>ProcessDraw</div>
          <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>by KJR Labs</div>
        </div>

        {/* Equipment Palette */}
        <div style={{ padding: "12px 16px 8px" }}>
          <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Add Equipment</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {EQUIPMENT_TYPES.map((eq) => (
              <button key={eq.id} onClick={() => addStep(eq.id)}
                style={{ background: "#252525", border: "1px solid #333", color: "#ccc", borderRadius: 4, padding: "8px 6px", fontSize: 11, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.target.style.background = "#333"; e.target.style.borderColor = "#555"; }}
                onMouseLeave={(e) => { e.target.style.background = "#252525"; e.target.style.borderColor = "#333"; }}>
                {eq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Steps List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
          <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            Steps ({steps.length})
          </div>
          {steps.map((step, idx) => (
            <div key={step.id}
              onClick={() => setSelectedStep(step.id)}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIdx !== null && dragIdx !== idx) moveStep(dragIdx, idx); setDragIdx(null); }}
              style={{
                padding: "8px 10px", marginBottom: 4, borderRadius: 4, cursor: "pointer",
                background: selectedStep === step.id ? "#333" : "#222",
                border: selectedStep === step.id ? "1px solid #555" : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {idx + 1}. {step.name}
                </div>
                <div style={{ fontSize: 10, color: "#777" }}>{step.equipId || step.subtype}</div>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={(e) => { e.stopPropagation(); moveStep(idx, idx - 1); }}
                  style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12, padding: 2 }}
                  disabled={idx === 0}>▲</button>
                <button onClick={(e) => { e.stopPropagation(); moveStep(idx, idx + 1); }}
                  style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 12, padding: 2 }}
                  disabled={idx === steps.length - 1}>▼</button>
                <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                  style={{ background: "none", border: "none", color: "#844", cursor: "pointer", fontSize: 13, padding: 2 }}>×</button>
              </div>
            </div>
          ))}
          {steps.length === 0 && (
            <div style={{ fontSize: 12, color: "#555", textAlign: "center", padding: 20 }}>
              No steps yet. Add equipment above or pick a template.
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #333", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setShowTemplates(true)}
            style={{ flex: 1, background: "#252525", border: "1px solid #444", color: "#ccc", borderRadius: 4, padding: "7px 0", fontSize: 11, cursor: "pointer" }}>
            Templates
          </button>
          <button onClick={clearAll}
            style={{ flex: 1, background: "#252525", border: "1px solid #444", color: "#a66", borderRadius: 4, padding: "7px 0", fontSize: 11, cursor: "pointer" }}>
            Clear All
          </button>
          <button onClick={exportPNG} disabled={!steps.length}
            style={{ flex: 1, background: steps.length ? "#2563eb" : "#333", border: "none", color: "#fff", borderRadius: 4, padding: "7px 0", fontSize: 11, cursor: steps.length ? "pointer" : "default", opacity: steps.length ? 1 : 0.4 }}>
            Export PNG
          </button>
          <button onClick={copyToClipboard} disabled={!steps.length}
            style={{ flex: 1, background: steps.length ? "#059669" : "#333", border: "none", color: "#fff", borderRadius: 4, padding: "7px 0", fontSize: 11, cursor: steps.length ? "pointer" : "default", opacity: steps.length ? 1 : 0.4 }}>
            Copy
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Canvas area */}
        <div style={{ flex: 1, overflow: "auto", background: "#f5f5f0", position: "relative" }}>
          {showTemplates && steps.length === 0 ? (
            <div style={{ padding: 40, maxWidth: 600, margin: "0 auto" }}>
              <h2 style={{ color: "#222", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Get Started</h2>
              <p style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>Pick a template or start from scratch by adding equipment from the left panel.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => loadTemplate(t)}
                    style={{ background: "white", border: "1px solid #ddd", borderRadius: 8, padding: "16px 20px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#999"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.boxShadow = "none"; }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#222", marginBottom: 4 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <DiagramSVG steps={steps} svgRef={svgRef} />
          )}
        </div>
      </div>

      {/* Right Property Panel */}
      {sel && (
        <div style={{ width: 280, background: "#1a1a1a", borderLeft: "1px solid #333", overflowY: "auto", padding: 16 }}>
          <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Step Properties</div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 3 }}>Equipment Type</label>
            <select value={sel.equipmentType} onChange={(e) => {
              const eq = EQUIPMENT_TYPES.find((t) => t.id === e.target.value);
              updateStep(sel.id, { equipmentType: e.target.value, subtype: eq.subtypes[0], name: eq.label });
            }}
              style={{ width: "100%", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 3, padding: "5px 7px", fontSize: 12 }}>
              {EQUIPMENT_TYPES.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 3 }}>Subtype</label>
            <select value={sel.subtype} onChange={(e) => updateStep(sel.id, { subtype: e.target.value })}
              style={{ width: "100%", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 3, padding: "5px 7px", fontSize: 12 }}>
              {EQUIPMENT_TYPES.find((e) => e.id === sel.equipmentType)?.subtypes.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 3 }}>Display Name</label>
            <input value={sel.name} onChange={(e) => updateStep(sel.id, { name: e.target.value })}
              style={{ width: "100%", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 3, padding: "5px 7px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 3 }}>Equipment ID</label>
            <input value={sel.equipId} onChange={(e) => updateStep(sel.id, { equipId: e.target.value })}
              placeholder="e.g. GLR-805, SCF-804"
              style={{ width: "100%", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 3, padding: "5px 7px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 3 }}>Note (below block)</label>
            <input value={sel.note} onChange={(e) => updateStep(sel.id, { note: e.target.value })}
              placeholder="e.g. (If applicable)"
              style={{ width: "100%", background: "#2a2a2a", border: "1px solid #444", color: "#eee", borderRadius: 3, padding: "5px 7px", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ height: 1, background: "#333", margin: "14px 0" }} />

          {sideIOEditor("Left Inputs", sel.leftInputs, (items) => updateStep(sel.id, { leftInputs: items }))}
          {sideIOEditor("Right Inputs", sel.rightInputs, (items) => updateStep(sel.id, { rightInputs: items }))}
          {sideIOEditor("Right Outputs (IPQC / Side)", sel.rightOutputs, (items) => updateStep(sel.id, { rightOutputs: items }))}

          <div style={{ height: 1, background: "#333", margin: "14px 0" }} />

          <button onClick={() => removeStep(sel.id)}
            style={{ width: "100%", background: "#3a1a1a", border: "1px solid #633", color: "#c88", borderRadius: 4, padding: "7px 0", fontSize: 12, cursor: "pointer" }}>
            Remove This Step
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#222", color: "#eee", padding: "10px 24px", borderRadius: 8,
          fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.3)", zIndex: 999,
          animation: "fadeIn 0.2s"
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
