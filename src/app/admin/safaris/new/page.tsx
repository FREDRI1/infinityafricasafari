import type { Metadata } from "next";
import Link from "next/link";
import { StaffPermission, StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { AdminSafariForm } from "@/components/admin-safari-form";
import { requireStaffPermission } from "@/lib/admin";
import { getAdminMediaChoices } from "@/lib/admin-media";
import { prisma } from "@/lib/prisma";
import { saveSafari } from "@/app/admin/safaris/actions";

export const metadata: Metadata = {
  title: "Create a safari",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const contentRoles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

export default async function NewSafariPage() {
  const staff = await requireStaffPermission(contentRoles, StaffPermission.CATALOG_MANAGEMENT);
  const [destinations, mediaChoices] = await Promise.all([
    prisma.destination.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, isPublished: true },
      orderBy: { name: "asc" },
    }),
    getAdminMediaChoices(),
  ]);

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Create a safari</h1>
          <p>Add seasonal per-person prices and manage when rates apply.</p>
        </div>
        <Link className="button button-outline" href="/admin/safaris">
          All safaris
        </Link>
      </div>
      {destinations.length ? (
        <AdminSafariForm
          destinations={destinations}
          mediaChoices={mediaChoices}
          action={saveSafari}
        />
      ) : (
        <div className="admin-empty">
          <h2>Create a destination first.</h2>
          <p>A safari must be linked to an active destination.</p>
          <Link className="button button-dark" href="/admin/destinations/new">
            Create a destination
          </Link>
        </div>
      )}
    </main>
  );
}
