import type { StaffRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: StaffRole;
      authVersion: number;
    };
  }

  interface User {
    role: StaffRole;
    authVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: StaffRole;
    authVersion?: number;
  }
}
