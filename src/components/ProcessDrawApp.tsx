"use client";

import { useEffect, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { fetcher, apiCall } from "@/lib/api";
import ProcessDrawV2 from "./ProcessDrawV2";
import AdminPanel from "./AdminPanel";
import AccountMenu, { ForcedPasswordChange } from "./AccountMenu";

const H = "'Fraunces', 'Georgia', serif";
const B = "'Outfit', 'Helvetica Neue', sans-serif";
const C = { bg: "#f6f3ee", surface: "#fff", text: "#2c2824", mid: "#8a8078", light: "#b5ada5", accent: "#3d8b8b", danger: "#c47a6a", success: "#5a9e7a", warn: "#d4a040" };
const DEMO_TIMEOUT_MS = 30 * 60 * 1000;
const REAL_TIMEOUT_MS = 60 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

const DIAGRAMS_KEY = "/api/diagrams";
const NOTIFICATIONS_KEY = "/api/notifications";

export default function ProcessDrawApp() {
  const { data: session, status: sessionStatus } = useSession();
  const sessionUserId = (session?.user as any)?.id as string | undefined;
  const isSignedIn = sessionStatus === "authenticated";
  const { mutate } = useSWRConfig();
  const [sessionExpired, setSessionExpired] = useState(false);

  const { data: currentUser, error: userError, mutate: retryUser } = useSWR(
    isSignedIn ? "/api/me" : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const isAdmin = currentUser?.role === "it_admin";
  const { data: diagrams } = useSWR(
    currentUser && !currentUser.disabled && !isAdmin ? DIAGRAMS_KEY : null,
    fetcher,
    { refreshInterval: 15000 }
  );
  const { data: notificationData } = useSWR(
    currentUser && !currentUser.disabled && !isAdmin ? NOTIFICATIONS_KEY : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Inactivity sign-out (shorter window for demo accounts).
  useEffect(() => {
    if (!isSignedIn || !sessionUserId || !currentUser) return;

    const timeoutMs = currentUser.isDemo ? DEMO_TIMEOUT_MS : REAL_TIMEOUT_MS;
    const storageKey = `processdraw:lastActivity:${sessionUserId}`;
    const now = Date.now();
    const stored = Number(window.localStorage.getItem(storageKey) || now);

    if (Number.isFinite(stored) && now - stored > timeoutMs) {
      window.localStorage.removeItem(storageKey);
      setSessionExpired(true);
      void signOut({ callbackUrl: "/" });
      return;
    }

    window.localStorage.setItem(storageKey, String(now));
    let lastWrite = now;

    const recordActivity = () => {
      const current = Date.now();
      if (current - lastWrite < 10000) return;
      lastWrite = current;
      window.localStorage.setItem(storageKey, String(current));
    };

    const checkExpiry = () => {
      const lastActivity = Number(window.localStorage.getItem(storageKey) || Date.now());
      if (Number.isFinite(lastActivity) && Date.now() - lastActivity > timeoutMs) {
        window.localStorage.removeItem(storageKey);
        setSessionExpired(true);
        void signOut({ callbackUrl: "/" });
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    const intervalId = window.setInterval(checkExpiry, 60 * 1000);
    const visibilityHandler = () => { if (!document.hidden) checkExpiry(); };
    document.addEventListener("visibilitychange", visibilityHandler);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [isSignedIn, sessionUserId, currentUser]);

  const mappedDiagrams = useMemo(() => (diagrams || []).map((d: any) => ({
    _id: d.id,
    name: d.name,
    ownerName: d.ownerName,
    blocks: d.blocks || [],
    arrowAnnotations: d.arrowAnnotations || {},
    settings: { ...(d.settings || {}), finalized: !!d.finalized },
    status: d.status,
    currentRevision: d.currentRevision ?? undefined,
    updatedAt: d.updatedAt,
    isOwn: d.ownerId === currentUser?.id,
    rejectionComment: d.rejectionComment,
    rejectedByName: d.rejectedByName,
    revertComment: d.revertComment,
    revertedByName: d.revertedByName,
    approvedByName: d.approvedByName,
    revisionCount: d.revisionCount || 0,
  })), [diagrams, currentUser?.id]);

  if (sessionExpired) return <LoadingScreen message="Session expired. Signing you out..." />;
  if (sessionStatus === "loading" || !isSignedIn) return <LoadingScreen message="Authenticating..." />;
  if (userError) return <ErrorScreen message={userError.message || "Could not load your account"} onRetry={() => retryUser()} />;
  if (!currentUser) return <LoadingScreen message="Setting up your account..." />;

  if (currentUser.disabled) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee", fontFamily: B }}><div style={{ textAlign: "center", maxWidth: 400 }}><div style={{ fontSize: 24, fontWeight: 700, color: "#2c2824", fontFamily: H, marginBottom: 12 }}>Account Disabled</div><div style={{ fontSize: 14, color: "#8a8078", lineHeight: 1.6, marginBottom: 24 }}>Your account has been disabled by an administrator. Please contact your IT Admin for assistance.</div><button onClick={() => signOut({ callbackUrl: "/" })} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: B }}>Sign out</button></div></div>;
  if (currentUser.mustChangePassword) return <ForcedPasswordChange userName={currentUser.name} onDone={() => retryUser()} />;
  if (isAdmin) return <AdminPanel onBack={() => {}} isFullScreen />;

  const refreshData = () => {
    void mutate(DIAGRAMS_KEY);
    void mutate(NOTIFICATIONS_KEY);
  };

  const cloud = {
    role: currentUser.role,
    userName: currentUser.name,
    userEmail: currentUser.email,
    diagrams: mappedDiagrams,
    onSave: async (name: string, blocks: any, annotations: any, settings: any, existingId?: string) => {
      const data = { name, blocks, arrowAnnotations: annotations, settings: { ...settings, finalized: false } };
      let id = existingId;
      if (existingId) {
        await apiCall(`/api/diagrams/${existingId}`, "PATCH", data);
      } else {
        const result = await apiCall("/api/diagrams", "POST", data);
        id = result.id;
      }
      refreshData();
      return id;
    },
    onDelete: async (id: string) => { await apiCall(`/api/diagrams/${id}`, "DELETE"); refreshData(); },
    onSubmit: async (id: string, remarks: string) => { await apiCall(`/api/diagrams/${id}/submit`, "POST", { remarks }); refreshData(); },
    onReview: async (id: string, decision: string, remarks: string) => { await apiCall(`/api/diagrams/${id}/review`, "POST", { decision, remarks }); refreshData(); },
    onSendBack: async (id: string, remarks: string) => { await apiCall(`/api/diagrams/${id}/send-back`, "POST", { remarks }); refreshData(); },
    isApprover: currentUser.role === "approver",
    canEdit: currentUser.role === "user",
    canCreate: currentUser.role === "user",
    UserButton: <AccountMenu name={currentUser.name} email={currentUser.email} role={currentUser.role} />,
    notifications: notificationData?.notifications || [],
    unreadCount: notificationData?.unreadCount || 0,
    onMarkRead: async (id: string) => { await apiCall("/api/notifications", "POST", { id }); void mutate(NOTIFICATIONS_KEY); },
    onMarkAllRead: async () => { await apiCall("/api/notifications", "POST", {}); void mutate(NOTIFICATIONS_KEY); },
    isDemo: !!currentUser.isDemo,
  };
  return <ProcessDrawV2 cloud={cloud} />;
}

function LoadingScreen({ message }: { message: string }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: B }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: H, marginBottom: 12 }}>ProcessDraw</div><div style={{ fontSize: 13, color: C.light }}>{message}</div><div style={{ marginTop: 20, width: 32, height: 32, border: `3px solid #e5e0d8`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "20px auto 0" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div></div>;
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: B }}><div style={{ textAlign: "center", maxWidth: 400 }}><div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: H, marginBottom: 12 }}>ProcessDraw</div><div style={{ fontSize: 14, color: C.danger, marginBottom: 8 }}>Connection Error</div><div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 24 }}>{message}</div><button onClick={onRetry} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 8, padding: "10px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: B }}>Retry</button></div></div>;
}
