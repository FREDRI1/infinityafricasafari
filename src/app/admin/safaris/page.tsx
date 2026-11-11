import type { Metadata } from "next";
import Link from "next/link";
import { StaffPermission, StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { requireStaffPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { archiveSafari } from "@/app/admin/safaris/actions";

export const metadata: Metadata = {
  title: "Safari content",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const contentRoles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.SALES_MANAGER,
  StaffRole.CONTENT_EDITOR,
];

export default async function AdminSafarisPage() {
  const staff = await requireStaffPermission(contentRoles, StaffPermission.CATALOG_MANAGEMENT);
  const safaris = await prisma.safari.findMany({
    orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    include: { destination: { select: { name: true, country: true } } },
  });

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Safari journeys</h1>
          <p>Manage the itineraries shown in the public catalogue.</p>
        </div>
        <Link className="button button-dark" href="/admin/safaris/new">
          Create a safari
        </Link>
      </div>
      {safaris.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Journey</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {safaris.map((safari) => (
                <tr key={safari.id}>
                  <td>{safari.title}</td>
                  <td>
                    {safari.destination?.name ?? safari.destination?.country ?? "Not assigned"}
                  </td>
                  <td>{safari.durationDays} days</td>
                  <td>
                    <span className="status-pill">
                      {safari.archivedAt
                        ? "ARCHIVED"
                        : safari.isPublished
                          ? "PUBLISHED"
                          : "DRAFT"}
                    </span>
                  </td>
                  <td className="admin-row-actions">
                    <Link href={`/admin/safaris/${safari.id}/edit`}>Edit</Link>
                    {!safari.archivedAt && (
                      <ConfirmActionForm
                        action={archiveSafari.bind(null, safari.id)}
                        confirmation="Archive this safari? Historical booking details will remain unchanged."
                        buttonLabel="Archive"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <span className="eyebrow">A blank canvas</span>
          <h2>No safari journeys yet.</h2>
          <p>Create a journey outline to add it to the catalogue.</p>
          <Link className="button button-dark" href="/admin/safaris/new">
            Create a safari
          </Link>
        </div>
      )}
      <p className="admin-note-small">
        Historical booking snapshots are retained even when safari content is
        later changed or archived.
      </p>
    </main>
  );
}
