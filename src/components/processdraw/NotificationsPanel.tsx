"use client";

import { useEffect, useRef, useState } from "react";
import { COLORS } from "./constants";
import { buttonStyle } from "./ui";

export type NotificationRecord = {
  id: string;
  type: string;
  diagramName: string;
  actorName: string;
  comment?: string;
  read: boolean;
  createdAt: number;
};

const TYPE_COPY: Record<string, { label: string; color: string }> = {
  submitted: { label: "Submitted for approval", color: COLORS.warn },
  approved: { label: "Approved", color: COLORS.success },
  rejected: { label: "Rejected", color: COLORS.danger },
  reverted: { label: "Reverted for correction", color: COLORS.warn },
};

function timeAgo(timestamp: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NotificationsBell({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: NotificationRecord[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        style={{ ...buttonStyle(), position: "relative", padding: "7px 10px" }}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 99, background: COLORS.danger, color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px", boxSizing: "border-box" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 330, maxHeight: 420, overflow: "auto", background: COLORS.paper, border: `1px solid ${COLORS.border}`, borderRadius: 14, boxShadow: "0 18px 60px rgba(44,40,36,.18)", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: COLORS.paper }}>
            <strong style={{ fontSize: 13 }}>Notifications</strong>
            {unreadCount > 0 && (
              <button style={{ ...buttonStyle(), padding: "4px 8px", fontSize: 11 }} onClick={onMarkAllRead}>Mark all read</button>
            )}
          </div>
          {notifications.length === 0 && (
            <p style={{ color: COLORS.light, fontSize: 12, textAlign: "center", padding: "22px 14px", margin: 0 }}>No notifications yet.</p>
          )}
          {notifications.map((notification) => {
            const copy = TYPE_COPY[notification.type] || { label: notification.type, color: COLORS.muted };
            return (
              <div
                key={notification.id}
                onClick={() => { if (!notification.read) onMarkRead(notification.id); }}
                style={{ padding: "11px 14px", borderBottom: `1px solid ${COLORS.border}`, cursor: notification.read ? "default" : "pointer", background: notification.read ? "transparent" : COLORS.accentLight }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: copy.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{copy.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.light, flexShrink: 0 }}>{timeAgo(notification.createdAt)}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.text, marginTop: 4 }}>{notification.diagramName}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                  by {notification.actorName}
                  {notification.comment ? ` — “${notification.comment}”` : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
