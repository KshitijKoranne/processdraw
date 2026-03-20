"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import ProcessDrawV2 from "./ProcessDrawV2";
import AdminPanel from "./AdminPanel";

export default function ProcessDrawApp() {
  const { user: clerkUser } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const currentUser = useQuery(api.users.getCurrentUser);
  const diagrams = useQuery(api.diagrams.listAll);
  const createDiagram = useMutation(api.diagrams.create);
  const updateDiagram = useMutation(api.diagrams.update);
  const removeDiagram = useMutation(api.diagrams.remove);
  const submitDiagram = useMutation(api.diagrams.submit);
  const reviewDiagram = useMutation(api.diagrams.review);

  const [showAdmin, setShowAdmin] = useState(false);

  // Sync Clerk user → Convex on login
  useEffect(() => {
    if (clerkUser) {
      upsertUser().catch(console.error);
    }
  }, [clerkUser, upsertUser]);

  if (!currentUser) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#f5f0e8",
          fontFamily: "'Source Sans 3', sans-serif",
        }}
      >
        <div style={{ color: "#a09890", fontSize: 14 }}>Setting up your account...</div>
      </div>
    );
  }

  if (showAdmin && currentUser.role === "it_admin") {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  // Build cloud diagram handlers for ProcessDrawV2
  const cloudHandlers = {
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
      const data = {
        name,
        blocks: JSON.stringify(blocks),
        arrowAnnotations: JSON.stringify(annotations),
        settings: JSON.stringify(settings),
      };
      if (existingId) {
        await updateDiagram({ diagramId: existingId as any, ...data });
      } else {
        await createDiagram(data);
      }
    },
    onDelete: async (id: string) => {
      await removeDiagram({ diagramId: id as any });
    },
    onSubmit: async (id: string) => {
      await submitDiagram({ diagramId: id as any });
    },
    onReview: async (id: string, decision: string) => {
      await reviewDiagram({ diagramId: id as any, decision });
    },
    isAdmin: currentUser.role === "it_admin",
    isApprover: currentUser.role === "approver" || currentUser.role === "it_admin",
    canEdit: currentUser.role !== "viewer",
    onShowAdmin: () => setShowAdmin(true),
    UserButton: <UserButton />,
  };

  return <ProcessDrawV2 cloud={cloudHandlers} />;
}
