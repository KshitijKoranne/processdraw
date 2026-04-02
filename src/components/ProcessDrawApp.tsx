"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser, useAuth, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import ProcessDrawV2 from "./ProcessDrawV2";
import AdminPanel from "./AdminPanel";

const H = "'Fraunces', 'Georgia', serif";
const B = "'Outfit', 'Helvetica Neue', sans-serif";
const C = { bg: "#f6f3ee", surface: "#fff", text: "#2c2824", mid: "#8a8078", light: "#b5ada5", accent: "#3d8b8b", danger: "#c47a6a", success: "#5a9e7a", warn: "#d4a040" };

export default function ProcessDrawApp() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const upsertUser = useMutation(api.users.upsertUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  const diagrams = useQuery(api.diagrams.listAll);
  const createDiagram = useMutation(api.diagrams.create);
  const updateDiagram = useMutation(api.diagrams.update);
  const removeDiagram = useMutation(api.diagrams.remove);
  const submitDiagram = useMutation(api.diagrams.submit);
  const reviewDiagram = useMutation(api.diagrams.review);
  const reviseDiagram = useMutation(api.diagrams.revise);
  const sendBackDiagram = useMutation(api.diagrams.sendBack);
  const isDemoUser = useQuery(api.demoData.isDemoUser);
  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.unreadCount);
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncError, setSyncError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const syncUser = useCallback(async () => {
    if (!clerkUser || !isSignedIn) return;
    setSyncState("syncing");
    try { await upsertUser(); setSyncState("done"); }
    catch (err: any) { setSyncError(err?.message || "Failed to sync"); setSyncState("error"); }
  }, [clerkUser, isSignedIn, upsertUser]);

  useEffect(() => { if (isClerkLoaded && isSignedIn && clerkUser && syncState === "idle") syncUser(); }, [isClerkLoaded, isSignedIn, clerkUser, syncState, syncUser]);
  useEffect(() => { if (syncState === "error" && retryCount < 3) { const t = setTimeout(() => { setSyncState("idle"); setRetryCount((c) => c + 1); }, 2000); return () => clearTimeout(t); } }, [syncState, retryCount]);
  useEffect(() => { if (syncState === "done" && currentUser === null && retryCount < 5) { const t = setTimeout(() => { setSyncState("idle"); setRetryCount((c) => c + 1); }, 1500); return () => clearTimeout(t); } }, [syncState, currentUser, retryCount]);

  if (!isClerkLoaded || !isSignedIn) return <LoadingScreen message="Authenticating..." />;
  if (syncState === "error" && retryCount >= 3) return <ErrorScreen message={syncError} onRetry={() => { setRetryCount(0); setSyncState("idle"); }} />;
  if (!currentUser) return <LoadingScreen message={syncState === "syncing" ? "Setting up your account..." : "Connecting..."} />;

  // Disabled user screen
  if (currentUser.disabled) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee", fontFamily: B }}>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#2c2824", fontFamily: H, marginBottom: 12 }}>Account Disabled</div>
          <div style={{ fontSize: 14, color: "#8a8078", lineHeight: 1.6, marginBottom: 24 }}>
            Your account has been disabled by an administrator. Please contact your IT Admin for assistance.
          </div>
          <UserButton appearance={{ elements: { profileSectionPrimaryButton__danger: { display: "none" }, profileSectionContent__danger: { display: "none" } } }} />
        </div>
      </div>
    );
  }

  // IT Admin always sees admin panel — they don't create or approve diagrams
  if (currentUser.role === "it_admin") return <AdminPanel onBack={() => {}} isFullScreen />;

  if (showAdmin && currentUser.role === "it_admin") return <AdminPanel onBack={() => setShowAdmin(false)} />;

  const cloud = {
    role: currentUser.role,
    userName: currentUser.name,
    userEmail: currentUser.email,
    diagrams: (diagrams || []).map((d: any) => ({
      _id: d._id, name: d.name, ownerName: d.ownerName,
      blocks: JSON.parse(d.blocks || "[]"),
      arrowAnnotations: JSON.parse(d.arrowAnnotations || "{}"),
      settings: JSON.parse(d.settings || "{}"),
      status: d.status, updatedAt: d.updatedAt,
      isOwn: d.ownerId === currentUser.clerkId,
      rejectionComment: d.rejectionComment,
      rejectedByName: d.rejectedByName,
      approvedByName: d.approvedByName,
      revisionCount: d.revisionCount || 0,
    })),
    onSave: async (name: string, blocks: any, annotations: any, settings: any, existingId?: string) => {
      const data = { name, blocks: JSON.stringify(blocks), arrowAnnotations: JSON.stringify(annotations), settings: JSON.stringify(settings) };
      if (existingId) { await updateDiagram({ diagramId: existingId as any, ...data }); return existingId; }
      else { const newId = await createDiagram(data); return newId as string; }
    },
    onDelete: async (id: string) => { await removeDiagram({ diagramId: id as any }); },
    onSubmit: async (id: string) => { await submitDiagram({ diagramId: id as any }); },
    onReview: async (id: string, decision: string, comment?: string) => {
      await reviewDiagram({ diagramId: id as any, decision, comment });
    },
    onRevise: async (id: string) => { await reviseDiagram({ diagramId: id as any }); },
    onSendBack: async (id: string, comment: string) => { await sendBackDiagram({ diagramId: id as any, comment }); },
    isAdmin: false, // IT Admin never reaches here
    isApprover: currentUser.role === "approver",
    canEdit: currentUser.role === "user", // only user role can create/edit
    canCreate: currentUser.role === "user", // only user role can create new diagrams
    onShowAdmin: () => setShowAdmin(true),
    UserButton: <UserButton appearance={{ elements: { profileSectionPrimaryButton__danger: { display: "none" }, profileSectionContent__danger: { display: "none" } } }} />,
    // Notifications
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    showNotifications,
    onToggleNotifications: () => setShowNotifications(!showNotifications),
    onMarkRead: async (id: string) => { await markRead({ notificationId: id as any }); },
    onMarkAllRead: async () => { await markAllRead(); },
    isDemo: isDemoUser || false,
  };

  return <ProcessDrawV2 cloud={cloud} />;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: B }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: H, marginBottom: 12 }}>ProcessDraw</div>
        <div style={{ fontSize: 13, color: C.light }}>{message}</div>
        <div style={{ marginTop: 20, width: 32, height: 32, border: `3px solid #e5e0d8`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "20px auto 0" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, fontFamily: B }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFamily: H, marginBottom: 12 }}>ProcessDraw</div>
        <div style={{ fontSize: 14, color: C.danger, marginBottom: 8 }}>Connection Error</div>
        <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        <button onClick={onRetry} style={{ background: C.accent, border: "none", color: "#fff", borderRadius: 8, padding: "10px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: B }}>Retry</button>
      </div>
    </div>
  );
}
