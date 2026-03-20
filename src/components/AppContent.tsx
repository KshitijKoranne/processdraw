"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import ProcessDrawApp from "./ProcessDrawApp";

const HEADING = "'Fraunces', 'Georgia', serif";
const BODY = "'Outfit', 'Helvetica Neue', sans-serif";

export default function AppContent() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <AuthLoading>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2c2824", fontFamily: HEADING }}>ProcessDraw</div>
            <div style={{ fontSize: 13, color: "#b5ada5", marginTop: 8, fontFamily: BODY }}>Loading...</div>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f6f3ee", fontFamily: BODY }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#2c2824", fontFamily: HEADING, marginBottom: 8, lineHeight: 1.1 }}>ProcessDraw</div>
            <div style={{ fontSize: 11, color: "#b5ada5", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 28 }}>KJR LABS</div>
            <p style={{ fontSize: 15, color: "#8a8078", lineHeight: 1.7, marginBottom: 36 }}>
              Create clean, standardized process flow diagrams for pharmaceutical API manufacturing. No design skills needed.
            </p>
            <SignInButton mode="modal">
              <button style={{
                background: "#3d8b8b", border: "none", color: "#fff", borderRadius: 8,
                padding: "13px 36px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: BODY, boxShadow: "0 4px 20px rgba(61,139,139,0.3)",
                transition: "transform 0.15s"
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                Sign In to Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <ProcessDrawApp />
      </Authenticated>
    </>
  );
}
