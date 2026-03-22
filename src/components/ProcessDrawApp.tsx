"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser, useAuth, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import ProcessDrawV2 from "./ProcessDrawV2";
import AdminPanel from "./AdminPanel";

const H = "'Fraunces', 'Georgia', serif";
const B = "'Outfit', 'Helvetica Neue', sans-serif";

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

  const [showAdmin, setShowAdmin] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const [syncError, setSyncError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Sync Clerk user → Convex on login with retry
  const syncUser = useCallback(async () => {
    if (!clerkUser || !isSignedIn) return;
    
    setSyncState("syncing");
    try {
      await upsertUser();
      setSyncState("done");
    } catch (err: any) {
      console.error("User sync failed:", err);
      setSyncError(err?.message || "Failed to sync user");
      setSyncState("error");
    }
  }, [clerkUser, isSignedIn, upsertUser]);

  useEffect(() => {
    if (isClerkLoaded && isSignedIn && clerkUser && syncState === "idle") {
      syncUser();
    }
  }, [isClerkLoaded, isSignedIn, clerkUser, syncState, syncUser]);

  // Retry sync if it failed
  useEffect(() => {
    if (syncState === "error" && retryCount < 3) {
      const timer = setTimeout(() => {
        setSyncState("idle");
        setRetryCount((c) => c + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [syncState, retryCount]);

  // Also retry if currentUser is still null after sync completed
  useEffect(() => {
    if (syncState === "done" && currentUser === null && retryCount < 5) {
      const timer = setTimeout(() => {
        setSyncState("idle");
        setRetryCount((c) => c + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [syncState, currentUser, retryCount]);

  // Loading state
  if (!isClerkLoaded || !isSignedIn) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (syncState === "error" && retryCount >= 3) {
    return (
      <ErrorScreen
        message={syncError || "Failed to connect to the database. Please check your connection and try again."}
        onRetry={() => { setRetryCount(0); setSyncState("idle"); }}
      />
    );
  }

  if (!currentUser) {
    return <LoadingScreen message={syncState === "syncing" ? "Setting up your account..." : "Connecting..."} />;
  }

  // Admin panel
  if (showAdmin && currentUser.role === "it_admin") {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  // Build cloud handlers
  const cloud = {
    role: currentUser.role,
    userName: currentUser.name,
    userEmail: currentUser.email,
    diagrams: (diagrams || []).map((d: any) => ({
      _id: d._id,
      name: d.name,
      ownerName: d.ownerName,
      blocks: JSON.parse(d.blocks || "[]"),
      arrowAnnotations: JSON.parse(d.arrowAnnotations || "{}"),
      settings: JSON.parse(d.settings || "{}"),
      status: d.status,
      updatedAt: d.updatedAt,
      isOwn: d.ownerId === currentUser.clerkId,
    })),
    onSave: async (name: string, blocks: any, annotations: any, settings: any, existingId?: string) => {
      const data = { name, blocks: JSON.stringify(blocks), arrowAnnotations: JSON.stringify(annotations), settings: JSON.stringify(settings) };
      if (existingId) { await updateDiagram({ diagramId: existingId as any, ...data }); }
      else { await createDiagram(data); }
    },
    onDelete: async (id: string) => { await removeDiagram({ diagramId: id as any }); },
    onSubmit: async (id: string) => { await submitDiagram({ diagramId: id as any }); },
    onReview: async (id: string, decision: string) => { await reviewDiagram({ diagramId: id as any, decision }); },
    isAdmin: currentUser.role === "it_admin",
    isApprover: currentUser.role === "approver" || currentUser.role === "it_admin",
    canEdit: currentUser.role !== "viewer",
    onShowAdmin: () => setShowAdmin(true),
    UserButton: <UserButton />,
  };

  return <ProcessDrawV2 cloud={cloud} />;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee", fontFamily: B }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#2c2824", fontFamily: H, marginBottom: 12 }}>ProcessDraw</div>
        <div style={{ fontSize: 13, color: "#a09890" }}>{message}</div>
        <div style={{ marginTop: 20, width: 32, height: 32, border: "3px solid #e5e0d8", borderTopColor: "#3d8b8b", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "20px auto 0" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee", fontFamily: B }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#2c2824", fontFamily: H, marginBottom: 12 }}>ProcessDraw</div>
        <div style={{ fontSize: 14, color: "#c47a6a", marginBottom: 8 }}>Connection Error</div>
        <div style={{ fontSize: 13, color: "#8a8078", lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        <button onClick={onRetry} style={{
          background: "#3d8b8b", border: "none", color: "#fff", borderRadius: 8,
          padding: "10px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: B,
        }}>Retry</button>
      </div>
    </div>
  );
}
