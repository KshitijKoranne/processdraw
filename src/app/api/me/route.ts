import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { handleError, logAction, newId } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

function buildName(profile: Awaited<ReturnType<typeof currentUser>>) {
  if (!profile) return "User";
  const full = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  if (full && full !== "User") return full;
  if (profile.username) return profile.username;
  return "User";
}

/** Returns the signed-in user's record, creating or refreshing it on the fly. */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const db = getDb();

    const existingRows = await db.select().from(schema.users).where(eq(schema.users.clerkId, userId)).limit(1);
    const existing = existingRows[0];

    const profile = await currentUser();
    const email = profile?.primaryEmailAddress?.emailAddress || profile?.username || "";
    const imageUrl = profile?.imageUrl || undefined;
    const resolvedName = buildName(profile);

    if (existing) {
      const nameIsGeneric = !resolvedName || resolvedName === "User";
      const updated = await db.update(schema.users).set({
        name: nameIsGeneric ? existing.name : resolvedName,
        email: email || existing.email,
        imageUrl: imageUrl || existing.imageUrl,
      }).where(eq(schema.users.id, existing.id)).returning();
      return NextResponse.json(updated[0]);
    }

    // First user in the system becomes IT Admin.
    const countRows = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users);
    const isFirstUser = (countRows[0]?.count ?? 0) === 0;
    const role = isFirstUser ? "it_admin" : "user";

    let inserted;
    try {
      inserted = await db.insert(schema.users).values({
        id: newId(),
        clerkId: userId,
        email,
        name: resolvedName,
        role,
        imageUrl,
        disabled: false,
        isDemo: false,
        createdAt: Date.now(),
      }).returning();
    } catch {
      // Concurrent first request already created the row (unique clerk_id).
      const raced = await db.select().from(schema.users).where(eq(schema.users.clerkId, userId)).limit(1);
      return NextResponse.json(raced[0] ?? null);
    }

    await logAction({
      action: "user_created",
      actorId: userId,
      actorName: resolvedName,
      actorEmail: email,
      targetType: "user",
      targetId: userId,
      targetName: resolvedName,
      details: JSON.stringify({ role, isFirstUser }),
    });

    return NextResponse.json(inserted[0]);
  } catch (error) {
    return handleError(error);
  }
}
