import type { Metadata } from "next";
import Link from "next/link";
import { StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { AdminDestinationForm } from "@/components/admin-destination-form";
import { saveDestination } from "@/app/admin/destinations/actions";
import { requireStaff } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Add destination",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function NewDestinationPage() {
  const staff = await requireStaff([
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.CONTENT_EDITOR,
  ]);

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
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
      <AdminDestinationForm action={saveDestination} />
    </main>
  );
}
