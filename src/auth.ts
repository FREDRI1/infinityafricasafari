import { PrismaAdapter } from "@auth/prisma-adapter";
import { StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success || !process.env.AUTH_SECRET) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLocaleLowerCase() },
        });
        if (!user?.isActive || !user.passwordHash) return null;

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          authVersion: user.authVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.authVersion =
          typeof user.authVersion === "number" ? user.authVersion : 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as StaffRole;
        session.user.authVersion =
          typeof token.authVersion === "number" ? token.authVersion : 0;
      }
      return session;
    },
  },
});
