import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const normalizeLogin = (value: string) => value.trim().toLowerCase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        employeeCode: { label: "Employee code" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const employeeCode = normalizeLogin(String(credentials?.employeeCode || ""));
        const password = String(credentials?.password || "");
        if (!employeeCode || !password) return null;

        const db = getDb();
        const rows = await db.select().from(schema.users).where(eq(schema.users.email, employeeCode)).limit(1);
        const user = rows[0];
        if (!user || user.disabled) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        await db.insert(schema.auditLog).values({
          id: crypto.randomUUID(),
          action: "user_login",
          actorId: user.id,
          actorName: user.name,
          actorEmail: user.email,
          details: user.isDemo ? JSON.stringify({ isDemo: true }) : undefined,
          timestamp: Date.now(),
        });

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.uid && session.user) (session.user as any).id = token.uid as string;
      return session;
    },
  },
});
