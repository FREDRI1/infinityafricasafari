"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { StaffRole } from "@prisma/client";

export function AdminTopbar({ role }: { role: StaffRole }) {
  const isEditor = role === "CONTENT_EDITOR";

  return (
    <div className="admin-topbar">
      <Link href={isEditor ? "/admin/safaris" : "/admin"} className="admin-topbar-brand">
        <span className="brand-mark" aria-hidden="true">
          I
        </span>
        <span>INFINITY / STAFF</span>
      </Link>
      <nav className="admin-topbar-links" aria-label="Staff navigation">
        {!isEditor && <Link href="/admin/bookings">Bookings</Link>}
        <Link href="/admin/safaris">Safaris</Link>
        <Link href="/admin/destinations">Destinations</Link>
        <Link href="/admin/media">Media</Link>
      </nav>
      <button
        type="button"
        onClick={() => signOut({ redirectTo: "/admin/login" })}
      >
        Sign out <LogOut size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
