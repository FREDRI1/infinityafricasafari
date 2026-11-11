import type { Metadata } from "next";
import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { bookingStaffRoles, requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Booking requests",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const staff = await requireStaff(bookingStaffRoles);
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const selectedStatus = Object.values(BookingStatus).find(
    (status) => status === params.status,
  );
  const bookings = await prisma.booking.findMany({
    where: {
      ...(selectedStatus ? { status: selectedStatus } : {}),
      ...(query
        ? {
            OR: [
              { reference: { contains: query, mode: "insensitive" } },
              { customer: { fullName: { contains: query, mode: "insensitive" } } },
              { customer: { email: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    take: 100,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      status: true,
      travelStart: true,
      createdAt: true,
      customer: { select: { fullName: true } },
      safariSnapshot: true,
    },
  });

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Customer requests</span>
          <h1>Booking requests</h1>
          <p>Requests are not confirmed until staff review availability.</p>
        </div>
        <Link className="button button-outline" href="/admin">
          Dashboard
        </Link>
      </div>

      <form className="admin-filters" action="/admin/bookings">
        <label>
          <span className="sr-only">Search bookings</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search reference, customer or email"
          />
        </label>
        <label>
          <span className="sr-only">Filter by booking status</span>
          <select name="status" defaultValue={selectedStatus ?? ""}>
            <option value="">All statuses</option>
            {Object.values(BookingStatus).map((status) => (
              <option value={status} key={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-dark">Filter</button>
      </form>

      {bookings.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Safari</th>
                <th>Travel date</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const title =
                  typeof booking.safariSnapshot === "object" &&
                  booking.safariSnapshot !== null &&
                  "title" in booking.safariSnapshot &&
                  typeof booking.safariSnapshot.title === "string"
                    ? booking.safariSnapshot.title
                    : "Safari request";
                return (
                  <tr key={booking.id}>
                    <td>
                      <Link href={`/admin/bookings/${booking.reference}`}>
                        {booking.reference}
                      </Link>
                    </td>
                    <td>{booking.customer.fullName}</td>
                    <td>{title}</td>
                    <td>
                      {booking.travelStart.toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      <span className="status-pill">
                        {booking.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>
                      {booking.createdAt.toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <span className="eyebrow">No results</span>
          <h2>No requests match this search.</h2>
          <p>Try a different name, booking reference or status.</p>
        </div>
      )}
      <p className="admin-note-small">
        Showing up to 100 newest matching requests. Customer and payment
        information is restricted to authorized staff.
      </p>
    </main>
  );
}
