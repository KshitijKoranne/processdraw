"use client";

import { useState } from "react";
import { BODY_FONT, COLORS, HEADING_FONT } from "./constants";

export function buttonStyle(kind: "primary" | "ghost" | "danger" | "warn" | "purple" | "success" = "ghost") {
  const map: Record<string, [string, string, string]> = {
    primary: [COLORS.accent, "#fff", COLORS.accent],
    ghost: ["transparent", COLORS.muted, COLORS.border],
    danger: ["transparent", COLORS.danger, COLORS.border],
    warn: [COLORS.warn, "#fff", COLORS.warn],
    purple: [COLORS.purple, "#fff", COLORS.purple],
    success: [COLORS.success, "#fff", COLORS.success],
  };
  const [background, color, border] = map[kind];
  return {
    background,
    color,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "7px 12px",
    font: `600 12px ${BODY_FONT}`,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };
}

export function TextModal({ title, initial = "", placeholder, onOk, onClose }: any) {
  const [value, setValue] = useState(initial);
  return (
    <div className="pd-back" onClick={onClose}>
      <div className="pd-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        <textarea
          autoFocus
          rows={4}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && value.trim()) {
              event.preventDefault();
              onOk(value.trim());
            }
          }}
        />
        <div className="pd-modal-actions">
          <button style={buttonStyle()} onClick={onClose}>Cancel</button>
          <button style={buttonStyle("primary")} disabled={!value.trim()} onClick={() => value.trim() && onOk(value.trim())}>OK</button>
        </div>
      </div>
    </div>
  );
}

export function PickerModal({ title, options, onPick, onClose }: any) {
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
        <button style={{ ...buttonStyle(), width: "100%" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pd-back" onClick={onClose}>
      <div className="pd-modal" onClick={(event) => event.stopPropagation()}>
        <h3>Workflow rule</h3>
        <p style={{ color: COLORS.muted, fontSize: 13, lineHeight: 1.55 }}>
          Users must click END / Preview before submission. Submit saves the finalized version with settings.finalized = true.
          If the user edits again, the diagram returns to a draft/finalize-required state.
        </p>
        <button style={buttonStyle("primary")} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

export function ProcessDrawStyles() {
  return (
    <style>{`.pd{height:100vh;display:flex;background:${COLORS.bg};font-family:${BODY_FONT};color:${COLORS.text};overflow:hidden}.pd-side{width:310px;background:${COLORS.soft};border-right:1px solid ${COLORS.border};display:flex;flex-direction:column}.pd-side h2{font:700 17px ${HEADING_FONT};margin:0;padding:16px;border-bottom:1px solid ${COLORS.border}}.pd-list{padding:12px;overflow:auto}.pd-card{background:#fff;border:1px solid ${COLORS.border};border-radius:12px;padding:11px;margin-bottom:8px;cursor:pointer}.pd-card:hover{border-color:${COLORS.accent}}.pd-card b{display:block;font-size:13px}.pd-card span{font-size:11px;color:${COLORS.muted}}.pd-main{flex:1;display:flex;flex-direction:column;min-width:0}.pd-top{min-height:54px;background:#fff;border-bottom:1px solid ${COLORS.border};display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 18px}.pd-brand{display:flex;align-items:center;gap:10px}.pd-brand h1{font:700 20px ${HEADING_FONT};margin:0}.pd-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pd-bar{background:${COLORS.soft};border-bottom:1px solid ${COLORS.border};display:flex;justify-content:space-between;padding:8px 18px;font-size:12px;color:${COLORS.muted}}.pd-canvas{flex:1;overflow:auto;padding:28px;display:flex;justify-content:center;background:radial-gradient(circle at 1px 1px,rgba(44,40,36,.08) 1px,transparent 0);background-size:22px 22px}.pd-wrap{transform-origin:top center}.pd-svg{background:white;border:1px solid ${COLORS.border};box-shadow:0 8px 30px rgba(44,40,36,.09)}.pd-empty{height:100%;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;text-align:center}.pd-empty h2{font:700 34px ${HEADING_FONT};margin:0}.pd-empty p{margin:0;color:${COLORS.muted}}.pd-plus{width:56px;height:56px;border:0;border-radius:50%;background:${COLORS.accent};color:#fff;font-size:28px;cursor:pointer}.pd-back{position:fixed;inset:0;background:rgba(44,40,36,.32);display:flex;align-items:center;justify-content:center;z-index:10}.pd-modal{width:min(430px,calc(100vw - 32px));background:#fff;border:1px solid ${COLORS.border};border-radius:18px;padding:26px;box-shadow:0 28px 90px rgba(44,40,36,.2)}.pd-modal h3{font:700 19px ${HEADING_FONT};margin:0 0 14px}.pd-modal textarea{width:100%;box-sizing:border-box;border:1px solid ${COLORS.border};border-radius:10px;background:${COLORS.bg};padding:12px;font:14px ${BODY_FONT};line-height:1.5}.pd-modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}.pd-pick{width:100%;text-align:left;border:1px solid ${COLORS.border};background:${COLORS.bg};border-radius:11px;padding:12px;margin-bottom:8px;cursor:pointer}.pd-pick:hover{background:${COLORS.accentLight};border-color:${COLORS.accent}}.pd-pick b,.pd-pick span{display:block}.pd-pick span{font-size:11px;color:${COLORS.muted};margin-top:3px}.pd-ctl,.pd-del,.pd-shape{cursor:pointer}.pd-ctl{opacity:.65}.pd-ctl:hover,.pd-del:hover{opacity:1}.pd-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${COLORS.text};color:white;border-radius:10px;padding:9px 18px;font-size:12px;z-index:20}@media(max-width:850px){.pd{flex-direction:column}.pd-side{width:100%;max-height:42vh;border-right:0;border-bottom:1px solid ${COLORS.border}}.pd-top{align-items:flex-start;flex-direction:column}.pd-canvas{justify-content:flex-start;padding:14px}.pd-wrap{transform-origin:top left}}`}</style>
  );
}
