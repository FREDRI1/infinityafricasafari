"use client";

import { signOut } from "next-auth/react";

export function AdminSessionSignOut() {
  return (
    <button
      className="button button-outline"
      onClick={() => signOut({ redirectTo: "/admin/login" })}
      type="button"
    >
      Sign out of inactive account
    </button>
  );
}
