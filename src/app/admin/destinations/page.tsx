import type { Metadata } from "next";
import Link from "next/link";
import { StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { archiveDestination } from "@/app/admin/destinations/actions";
import { requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Destinations",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const roles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

export default async function AdminDestinationsPage() {
  const staff = await requireStaff(roles);
  const destinations = await prisma.destination.findMany({
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
  });

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Destinations</h1>
          <p>Manage the places available for public safari journeys.</p>
        </div>
        <Link className="button button-dark" href="/admin/destinations/new">
          Add destination
        </Link>
      </div>
      {destinations.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Country</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((destination) => (
                <tr key={destination.id}>
                  <td>{destination.name}</td>
                  <td>{destination.country}</td>
                  <td>
                    <span className="status-pill">
                      {destination.archivedAt
                        ? "ARCHIVED"
                        : destination.isPublished
                          ? "PUBLISHED"
                          : "DRAFT"}
                    </span>
                  </td>
                  <td className="admin-row-actions">
                    <Link href={`/admin/destinations/${destination.id}/edit`}>
                      Edit
                    </Link>
                    {!destination.archivedAt && (
                      <ConfirmActionForm
                        action={archiveDestination.bind(null, destination.id)}
                        confirmation="Archive this destination? Any linked public journeys will no longer be shown."
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
          <h2>No destinations yet.</h2>
          <p>Add destinations before publishing safari journeys.</p>
          <Link className="button button-dark" href="/admin/destinations/new">
            Add destination
          </Link>
        </div>
      )}
    </main>
  );
}
