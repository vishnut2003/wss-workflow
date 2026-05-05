import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/models/user";
import { isRole, type Role } from "@/lib/auth/roles";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

async function authenticate(
  emailRaw: unknown,
  passwordRaw: unknown
): Promise<{ id: string; email: string; name: string | null; role: Role } | null> {
  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") return null;
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;
  if (!email || !password) return null;

  const superEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const superPass = process.env.SUPER_ADMIN_PASS;
  if (superEmail && superPass && email === superEmail && password === superPass) {
    return {
      id: "super_admin",
      email: superEmail,
      name: "Super Admin",
      role: "super_admin",
    };
  }

  const user = await findUserByEmail(email);
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  if (!isRole(user.role)) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? null,
    role: user.role,
  };
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await authenticate(credentials?.email, credentials?.password);
        if (!user) throw new InvalidCredentialsError();
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.sub = user.id;
        const role = (user as { role?: unknown }).role;
        if (isRole(role)) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        const role = (token as { role?: unknown }).role;
        if (isRole(role)) session.user.role = role;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
