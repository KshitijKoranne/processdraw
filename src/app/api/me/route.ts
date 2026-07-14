import { NextResponse } from "next/server";
import { getAuthUser, handleError } from "@/lib/server/helpers";

export const dynamic = "force-dynamic";

/** Returns the signed-in user's record (without the password hash). */
export async function GET() {
  try {
    // allowDisabled: the frontend needs the row to show the "Account Disabled" screen.
    const user = await getAuthUser({ allowDisabled: true });
    const { passwordHash, ...safe } = user;
    return NextResponse.json(safe);
  } catch (error) {
    return handleError(error);
  }
}
