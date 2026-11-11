import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookingStatus, Prisma, StaffRole } from "@prisma/client";
import { AdminDashboardWidgets, DashboardMetric, DashboardQuickActions, DashboardRecentTable, DashboardToolbar, DashboardUpcoming, type DashboardStatus, type DashboardTrendPoint } from "@/components/admin-dashboard-widgets";
import { AdminTopbar } from "@/components/admin-topbar";
import { bookingStaffRoles, requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Staff dashboard",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type DailyCount = { date: Date; count: number };
type BookingDailyCount = { date: Date; bookings: number };
type ConfirmationDailyCount = { date: Date; confirmed: number };

function getSnapshotTitle(snapshot: Prisma.JsonValue) {
  if (
    typeof snapshot === "object" &&
    snapshot !== null &&
    "title" in snapshot &&
    typeof snapshot.title === "string"
  ) {
    return snapshot.title;
  }
  return "Safari request";
}

function fillDailyCounts(rows: DailyCount[], days: number, now: Date) {
  const counts = new Map(rows.map((row) => [row.date.toISOString().slice(0, 10), row.count]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    return {
      date: date.toISOString().slice(0, 10),
      count: counts.get(date.toISOString().slice(0, 10)) ?? 0,
    };
  });
}

function getTrendNote(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "New activity in the last 30 days" : "No recent activity";
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "No change over the previous 30 days";
  return `${change > 0 ? "+" : ""}${change}% vs previous 30 days`;
}

export default async function AdminDashboardPage() {
  if (!process.env.AUTH_SECRET || !process.env.DATABASE_URL) {
    redirect("/admin/login?setup=required");
  }
  const staff = await requireStaff(bookingStaffRoles);
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  const previousPeriod = { gte: sixtyDaysAgo, lt: thirtyDaysAgo };
  const currentPeriod = { gte: thirtyDaysAgo };

  const [
    totalRequests,
    newRequests,
    confirmedBookings,
    customerCount,
    verifiedPayments,
    bookingStatuses,
    recentBookings,
    upcomingBookings,
    currentBookings,
    previousBookings,
    currentConfirmed,
    previousConfirmed,
    currentCustomers,
    previousCustomers,
    currentPayments,
    previousPayments,
    bookingDaily,
    confirmationDaily,
    customerDaily,
    paymentDaily,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.NEW_REQUEST } }),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.customer.count(),
    prisma.paymentRecord.groupBy({
      by: ["currency"],
      where: { verified: true },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { currency: "asc" },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        reference: true,
        status: true,
        travelStart: true,
        customer: { select: { fullName: true } },
        safariSnapshot: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        travelStart: { gte: now },
      },
      take: 4,
      orderBy: { travelStart: "asc" },
      select: {
        reference: true,
        travelStart: true,
        adults: true,
        children: true,
        customer: { select: { fullName: true } },
        safari: { select: { title: true, coverImage: true } },
        safariSnapshot: true,
      },
    }),
    prisma.booking.count({ where: { createdAt: currentPeriod } }),
    prisma.booking.count({ where: { createdAt: previousPeriod } }),
    prisma.bookingStatusHistory.count({
      where: { newStatus: BookingStatus.CONFIRMED, createdAt: currentPeriod },
    }),
    prisma.bookingStatusHistory.count({
      where: { newStatus: BookingStatus.CONFIRMED, createdAt: previousPeriod },
    }),
    prisma.customer.count({ where: { createdAt: currentPeriod } }),
    prisma.customer.count({ where: { createdAt: previousPeriod } }),
    prisma.paymentRecord.count({
      where: { verified: true, paymentDate: currentPeriod },
    }),
    prisma.paymentRecord.count({
      where: { verified: true, paymentDate: previousPeriod },
    }),
    prisma.$queryRaw<BookingDailyCount[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS date,
        count(*)::int AS bookings
      FROM "Booking"
      WHERE "createdAt" >= ${ninetyDaysAgo}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date
    `),
    prisma.$queryRaw<ConfirmationDailyCount[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS date, count(*)::int AS confirmed
      FROM "BookingStatusHistory"
      WHERE "newStatus" = 'CONFIRMED' AND "createdAt" >= ${ninetyDaysAgo}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date
    `),
    prisma.$queryRaw<DailyCount[]>(Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS date, count(*)::int AS count
      FROM "Customer"
      WHERE "createdAt" >= ${ninetyDaysAgo}
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date
    `),
    prisma.$queryRaw<DailyCount[]>(Prisma.sql`
      SELECT date_trunc('day', "paymentDate") AS date, count(*)::int AS count
      FROM "PaymentRecord"
      WHERE verified = true AND "paymentDate" >= ${ninetyDaysAgo}
      GROUP BY date_trunc('day', "paymentDate")
      ORDER BY date
    `),
  ]);

  const bookingRows = new Map(
    bookingDaily.map((row) => [row.date.toISOString().slice(0, 10), row]),
  );
  const confirmationRows = new Map(
    confirmationDaily.map((row) => [row.date.toISOString().slice(0, 10), row.confirmed]),
  );
  const trendPoints: DashboardTrendPoint[] = Array.from({ length: 90 }, (_, index) => {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (89 - index));
    const key = date.toISOString().slice(0, 10);
    const bookingRow = bookingRows.get(key);
    return {
      date: key,
      bookings: bookingRow?.bookings ?? 0,
      confirmed: confirmationRows.get(key) ?? 0,
      customers: 0,
      payments: 0,
    };
  });
  const customerCounts = fillDailyCounts(customerDaily, 90, now);
  const paymentCounts = fillDailyCounts(paymentDaily, 90, now);
  trendPoints.forEach((point, index) => {
    point.customers = customerCounts[index].count;
    point.payments = paymentCounts[index].count;
  });

  const groupedStatuses = new Map(
    bookingStatuses.map((status) => [status.status, status._count._all]),
  );
  const statusData: DashboardStatus[] = [
    { label: "New request", count: groupedStatuses.get(BookingStatus.NEW_REQUEST) ?? 0, color: "#2b9c71" },
    {
      label: "Contact pending",
      count:
        (groupedStatuses.get(BookingStatus.CONTACT_PENDING) ?? 0) +
        (groupedStatuses.get(BookingStatus.CONTACTED) ?? 0) +
        (groupedStatuses.get(BookingStatus.AVAILABILITY_PENDING) ?? 0) +
        (groupedStatuses.get(BookingStatus.ON_HOLD) ?? 0),
      color: "#49a0e2",
    },
    {
      label: "Awaiting payment",
      count:
        (groupedStatuses.get(BookingStatus.AWAITING_PAYMENT) ?? 0) +
        (groupedStatuses.get(BookingStatus.DEPOSIT_PAID) ?? 0) +
        (groupedStatuses.get(BookingStatus.FULLY_PAID) ?? 0),
      color: "#e5aa3c",
    },
    { label: "Confirmed", count: groupedStatuses.get(BookingStatus.CONFIRMED) ?? 0, color: "#65429a" },
    { label: "Cancelled", count: groupedStatuses.get(BookingStatus.CANCELLED) ?? 0, color: "#df6557" },
  ];

  const recentRows = recentBookings.map((booking) => ({
    reference: booking.reference,
    customerName: booking.customer.fullName,
    safariTitle: getSnapshotTitle(booking.safariSnapshot),
    travelStart: booking.travelStart.toISOString(),
    status: booking.status,
  }));
  const upcomingRows = upcomingBookings.map((booking) => ({
    reference: booking.reference,
    safariTitle: booking.safari?.title ?? getSnapshotTitle(booking.safariSnapshot),
    customerName: booking.customer.fullName,
    travelStart: booking.travelStart.toISOString(),
    travelers: booking.adults + booking.children,
    image: booking.safari?.coverImage ?? null,
  }));

  const paymentValue =
    verifiedPayments.length === 0
      ? "—"
      : verifiedPayments.length === 1
        ? `${verifiedPayments[0].currency} ${Number(verifiedPayments[0]._sum.amount ?? 0).toLocaleString("en", { maximumFractionDigits: 0 })}`
        : `${verifiedPayments.length} currencies`;
  const paymentNote =
    verifiedPayments.length > 1
      ? verifiedPayments
          .map(({ currency, _sum }) => `${currency} ${Number(_sum.amount ?? 0).toLocaleString("en", { maximumFractionDigits: 0 })}`)
          .join(" · ")
      : `${verifiedPayments[0]?._count._all ?? 0} verified payments · ${getTrendNote(currentPayments, previousPayments)}`;
  const isEditor = staff.role === StaffRole.CONTENT_EDITOR;

  return (
    <main className="admin-shell page-width admin-dashboard-page">
      <AdminTopbar
        role={staff.role}
        permissions={staff.permissions}
        pendingCount={newRequests}
      />
      <DashboardToolbar
        name={staff.name?.trim() || "Team"}
        role={staff.role}
      />

      <section className="dashboard-hero" aria-labelledby="dashboard-welcome">
        <div className="dashboard-hero-copy">
          <span className="dashboard-panel-kicker">Infinity Africa Safari · Command center</span>
          <h1 id="dashboard-welcome">Welcome back, {staff.name?.split(" ")[0] || "team"}.</h1>
          <p>Every detail for the journeys ahead, together in one place.</p>
          <span className="dashboard-date-chip">
            {now.toLocaleDateString("en", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="dashboard-hero-mark" aria-hidden="true">INFINITY · AFRICA SAFARI</div>
      </section>

      <section className="dashboard-metrics-grid" aria-label="Business overview">
        <DashboardMetric
          icon="bookings"
          label="Total booking requests"
          value={totalRequests.toLocaleString()}
          note={getTrendNote(currentBookings, previousBookings)}
          values={trendPoints.slice(-30).map((point) => point.bookings)}
        />
        <DashboardMetric
          icon="confirmed"
          label="Confirmed bookings"
          value={confirmedBookings.toLocaleString()}
          note={getTrendNote(currentConfirmed, previousConfirmed)}
          values={trendPoints.slice(-30).map((point) => point.confirmed)}
          accent
        />
        <DashboardMetric
          icon="customers"
          label="Total customers"
          value={customerCount.toLocaleString()}
          note={getTrendNote(currentCustomers, previousCustomers)}
          values={trendPoints.slice(-30).map((point) => point.customers)}
        />
        <DashboardMetric
          icon="payments"
          label="Verified payments"
          value={paymentValue}
          note={paymentNote}
          values={trendPoints.slice(-30).map((point) => point.payments)}
          accent
        />
      </section>

      <AdminDashboardWidgets trends={trendPoints} statuses={statusData} />

      <section className="dashboard-operations-grid" aria-label="Operations workspace">
        <DashboardRecentTable bookings={recentRows} />
        <DashboardUpcoming bookings={upcomingRows} />
        <DashboardQuickActions isEditor={isEditor} />
      </section>
    </main>
  );
}
