"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!clerkKey) {
    // Build time / no env: render without auth providers
    return <>{children}</>;
  }

  return <ClerkProvider publishableKey={clerkKey}>{children}</ClerkProvider>;
}
