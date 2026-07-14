import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { ApiError, getAuthUser, handleError } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (user.role !== "it_admin") throw new ApiError("Only IT Admins can list users", 403);
    const db = getDb();
    const rows = await db.select().from(schema.users);
    return NextResponse.json(rows.map(({ passwordHash, ...safe }) => safe));
  } catch (error) {
    return handleError(error);
  }
}
