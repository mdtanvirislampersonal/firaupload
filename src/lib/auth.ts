// ===========================================================================
// NextAuth v4 configuration (server-only)
// ---------------------------------------------------------------------------
// Users are stored in the GitHub repo at `.file-manager/users.json` (bcrypt-
// hashed passwords). There is no local database.
// ===========================================================================

import "server-only";

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByUsername } from "@/lib/github-store";
import { verifyPassword } from "@/lib/security";
import { logger } from "@/lib/logger";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim().toLowerCase();
        const password = credentials?.password || "";
        if (!username || !password) return null;
        const user = await getUserByUsername(username);
        if (!user) {
          logger.warn("auth.login.unknownUser", { username });
          return null;
        }
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          logger.warn("auth.login.badPassword", { username });
          return null;
        }
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.username = (user as { username: string }).username;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || "";
        session.user.username = token.username || "";
        session.user.role = token.role || "ADMIN";
        session.user.name = token.username || session.user.name;
      }
      return session;
    },
  },
};
