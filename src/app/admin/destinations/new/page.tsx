import type { Metadata } from "next";
import Link from "next/link";
import { StaffPermission, StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { AdminDestinationForm } from "@/components/admin-destination-form";
import { saveDestination } from "@/app/admin/destinations/actions";
import { requireStaffPermission } from "@/lib/admin";
import { getAdminMediaChoices } from "@/lib/admin-media";

export const metadata: Metadata = {
  title: "Add destination",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewDestinationPage() {
  const staff = await requireStaffPermission([
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.CONTENT_EDITOR,
  ], StaffPermission.CATALOG_MANAGEMENT);
  const mediaChoices = await getAdminMediaChoices();

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Add a destination</h1>
          <p>Write and review destination information before publishing.</p>
        </div>
        <Link className="button button-outline" href="/admin/destinations">
          All destinations
        </Link>
      </div>
      <AdminDestinationForm
        mediaChoices={mediaChoices}
        action={saveDestination}
      />
    </main>
  );
}
