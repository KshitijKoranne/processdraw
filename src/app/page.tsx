"use client";

import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues with Convex/Clerk
const AppContent = dynamic(() => import("@/components/AppContent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f6f3ee",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color: "#2c2824" }}>
        ProcessDraw
      </div>
    </div>
  ),
});

export default function Home() {
  return <AppContent />;
}
