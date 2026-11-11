import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingStatus, StaffRole } from "@prisma/client";
import { auth } from "@/auth";
import { AdminTopbar } from "@/components/admin-topbar";
import { bookingStaffRoles } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Staff dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!process.env.AUTH_SECRET || !process.env.DATABASE_URL) {
    redirect("/admin/login?setup=required");
  }
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (!bookingStaffRoles.includes(session.user.role)) {
    redirect("/admin/unauthorized");
  }

  const [
    totalRequests,
    newRequests,
    awaitingPayment,
    confirmedBookings,
    customerCount,
    recentBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.NEW_REQUEST } }),
    prisma.booking.count({ where: { status: BookingStatus.AWAITING_PAYMENT } }),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.customer.count(),
    prisma.booking.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        reference: true,
        status: true,
        createdAt: true,
        customer: { select: { fullName: true } },
        safariSnapshot: true,
      },
    }),
  ]);
  const isSuperAdmin = session.user.role === StaffRole.SUPER_ADMIN;

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={session.user.role} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Operations</span>
          <h1>Good day, {session.user.name?.split(" ")[0] ?? "team"}.</h1>
          <p>Here&apos;s a clear view of what needs your attention.</p>
        </div>
        <span className="admin-role">{session.user.role.replaceAll("_", " ")}</span>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat">
          <span>Total requests</span>
          <strong>{totalRequests}</strong>
          <small>All time</small>
        </article>
        <article className="admin-stat admin-stat-highlight">
          <span>New requests</span>
          <strong>{newRequests}</strong>
          <small>Needs first review</small>
        </article>
        <article className="admin-stat">
          <span>Awaiting payment</span>
          <strong>{awaitingPayment}</strong>
          <small>Staff-managed only</small>
        </article>
        <article className="admin-stat">
          <span>Confirmed</span>
          <strong>{confirmedBookings}</strong>
          <small>Reservations</small>
        </article>
        <article className="admin-stat">
          <span>Customers</span>
          <strong>{customerCount}</strong>
          <small>With request history</small>
        </article>
      </div>

      <section className="admin-recent">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Latest activity</span>
            <h2>Recent booking requests</h2>
          </div>
          <Link className="text-link" href="/admin/bookings">
            View all requests
          </Link>
        </div>
        {recentBookings.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Safari</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const snapshot =
                    typeof booking.safariSnapshot === "object" &&
                    booking.safariSnapshot !== null &&
                    "title" in booking.safariSnapshot &&
                    typeof booking.safariSnapshot.title === "string"
                      ? booking.safariSnapshot.title
                      : "Safari request";
                  return (
                    <tr key={booking.reference}>
                      <td>
                        <Link href={`/admin/bookings/${booking.reference}`}>
                          {booking.reference}
                        </Link>
                      </td>
                      <td>{booking.customer.fullName}</td>
                      <td>{snapshot}</td>
                      <td>
                        <span className="status-pill">
                          {booking.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        {booking.createdAt.toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
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
            <p>No booking requests yet.</p>
          </div>
        )}
      </section>

      <section className="admin-tools">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Workspace</span>
            <h2>Manage the business</h2>
          </div>
        </div>
        <div className="admin-quick-links">
          <Link href="/admin/safaris">
            <span>01</span>
            <strong>Safari content</strong>
            <small>Itineraries and publishing</small>
          </Link>
          <Link href="/admin/destinations">
            <span>02</span>
            <strong>Destinations</strong>
            <small>Descriptions and visibility</small>
          </Link>
          <Link href="/admin/media">
            <span>03</span>
            <strong>Media library</strong>
            <small>Local and persistent assets</small>
          </Link>
          <Link href="/admin/bookings">
            <span>04</span>
            <strong>Booking requests</strong>
            <small>Customer enquiries and history</small>
          </Link>
        </div>
      </section>

      <section className="admin-note">
        <span className="eyebrow">Role-based access</span>
        <p>
          {isSuperAdmin
            ? "You have full staff access. Payment verification and account administration remain restricted to authorized roles."
            : "Your access is limited to booking operations. Financial verification and user administration are reserved for authorized staff."}
        </p>
      </section>
    </main>
  );
}
