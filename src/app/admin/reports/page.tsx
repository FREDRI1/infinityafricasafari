import type { Metadata } from "next";
import { StaffPermission } from "@prisma/client";
import { ArrowDownToLine, MousePointerClick } from "lucide-react";
import { AdminSafariClickChart } from "@/components/admin-safari-click-chart";
import { AdminTopbar } from "@/components/admin-topbar";
import { bookingStaffRoles, requireStaffPermission } from "@/lib/admin";
import { getSafariSlugFromTarget } from "@/lib/marketplace-clicks";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reports & analytics",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const periods = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
} as const;

type PeriodKey = keyof typeof periods;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const staff = await requireStaffPermission(bookingStaffRoles, StaffPermission.ANALYTICS);
  const params = await searchParams;
  const periodKey: PeriodKey =
    params.period === "7d" || params.period === "30d" || params.period === "90d"
      ? params.period
      : "30d";
  const period = periods[periodKey];
  const since = new Date();
  since.setTime(since.getTime() - period.days * 24 * 60 * 60 * 1000);

  const [totalClicks, totalBookings, targetGroups, countries, recentClicks] =
    await Promise.all([
      prisma.marketplaceClick.count({ where: { timestamp: { gte: since } } }),
      prisma.booking.count({ where: { createdAt: { gte: since } } }),
      prisma.marketplaceClick.groupBy({
        by: ["targetUrl"],
        where: {
          timestamp: { gte: since },
          OR: [
            { targetUrl: { startsWith: "/safaris/" } },
            { targetUrl: { startsWith: "/booking" } },
          ],
        },
        _count: { _all: true },
        orderBy: { _count: { targetUrl: "desc" } },
        take: 100,
      }),
      prisma.marketplaceClick.groupBy({
        by: ["country"],
        where: { timestamp: { gte: since } },
      }),
      prisma.marketplaceClick.findMany({
        where: { timestamp: { gte: since } },
        orderBy: { timestamp: "desc" },
        take: 8,
        select: {
          timestamp: true,
          elementClicked: true,
          targetUrl: true,
          country: true,
        },
      }),
    ]);

  const clicksBySafari = new Map<string, number>();
  for (const group of targetGroups) {
    const slug = getSafariSlugFromTarget(group.targetUrl);
    if (slug) {
      clicksBySafari.set(
        slug,
        (clicksBySafari.get(slug) ?? 0) + group._count._all,
      );
    }
  }

  const safariRecords = clicksBySafari.size
    ? await prisma.safari.findMany({
        where: { slug: { in: [...clicksBySafari.keys()] } },
        select: { slug: true, title: true },
      })
    : [];
  const safariTitles = new Map(safariRecords.map(({ slug, title }) => [slug, title]));
  const topSafaris = [...clicksBySafari]
    .map(([slug, clicks]) => ({
      name: safariTitles.get(slug) ?? slug.replaceAll("-", " "),
      clicks,
    }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 5);

  const conversionRate =
    totalClicks > 0 ? (totalBookings / totalClicks) * 100 : 0;
  const conversionAngle = Math.min(conversionRate, 100) * 3.6;
  const representedCountries = countries.filter(
    ({ country }) => country !== "XX",
  ).length;

  return (
    <main className="admin-shell page-width analytics-page">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <header className="analytics-heading">
        <div>
          <span className="eyebrow">Marketplace performance</span>
          <h1>Reports &amp; Analytics</h1>
          <p>Track marketplace clicks and see how they compare with booking requests.</p>
        </div>
        <form className="analytics-period-filter" action="/admin/reports">
          <label htmlFor="analytics-period">Reporting period</label>
          <select
            defaultValue={periodKey}
            id="analytics-period"
            name="period"
          >
            {Object.entries(periods).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          <button className="button button-dark" type="submit">
            Apply
          </button>
        </form>
      </header>

      <section className="analytics-metric-grid" aria-label="Marketplace metrics">
        <article className="analytics-metric analytics-metric-primary">
          <span className="analytics-metric-icon"><MousePointerClick size={20} /></span>
          <span className="analytics-metric-label">Total marketplace clicks</span>
          <strong>{totalClicks.toLocaleString()}</strong>
          <small>{period.label}</small>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric-label">Booking requests</span>
          <strong>{totalBookings.toLocaleString()}</strong>
          <small>Created during {period.label.toLowerCase()}</small>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric-label">Click-to-booking estimate</span>
          <strong>{conversionRate.toFixed(2)}%</strong>
          <small>Period-level comparison, not individual attribution</small>
        </article>
        <article className="analytics-metric">
          <span className="analytics-metric-label">Countries represented</span>
          <strong>{representedCountries.toLocaleString()}</strong>
          <small>Based on Vercel country headers</small>
        </article>
      </section>

      <section className="analytics-chart-grid" aria-label="Marketplace performance charts">
        <article className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <span className="analytics-kicker">Interest by journey</span>
              <h2>Most clicked safaris</h2>
            </div>
            <span className="analytics-top-count">Top 5</span>
          </div>
          <AdminSafariClickChart data={topSafaris} />
        </article>

        <article className="analytics-panel analytics-conversion-panel">
          <div className="analytics-panel-heading">
            <div>
              <span className="analytics-kicker">Marketplace funnel</span>
              <h2>Clicks vs. bookings</h2>
            </div>
            <ArrowDownToLine size={18} aria-hidden="true" />
          </div>
          <div className="analytics-conversion-content">
            <div
              aria-label={`${conversionRate.toFixed(2)} percent booking requests per click`}
              className="analytics-donut"
              role="img"
              style={{
                background: `conic-gradient(#d4af37 0deg ${conversionAngle}deg, #e8e7e1 ${conversionAngle}deg 360deg)`,
              }}
            >
              <div>
                <strong>{conversionRate.toFixed(2)}%</strong>
                <span>Bookings / clicks</span>
              </div>
            </div>
            <dl className="analytics-conversion-legend">
              <div>
                <dt><span className="analytics-legend-dot is-clicks" />Clicks</dt>
                <dd>{totalClicks.toLocaleString()}</dd>
              </div>
              <div>
                <dt><span className="analytics-legend-dot is-bookings" />Bookings</dt>
                <dd>{totalBookings.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
          <p className="analytics-disclaimer">
            This compares activity in the same period. Bookings are not attributed to
            individual visitors or clicks.
          </p>
        </article>
      </section>

      <section className="analytics-panel analytics-activity-panel">
        <div className="analytics-panel-heading">
          <div>
            <span className="analytics-kicker">Latest events</span>
            <h2>Recent marketplace activity</h2>
          </div>
        </div>
        {recentClicks.length ? (
          <div className="admin-table-wrap analytics-table-wrap">
            <table className="admin-table analytics-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Element clicked</th>
                  <th>Target URL</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.map((click, index) => (
                  <tr key={`${click.timestamp.toISOString()}-${index}`}>
                    <td>
                      {click.timestamp.toLocaleString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>{click.elementClicked}</td>
                    <td><code>{click.targetUrl}</code></td>
                    <td>{click.country === "XX" ? "Unknown" : click.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="analytics-empty">
            <p>No marketplace clicks have been recorded for {period.label.toLowerCase()}.</p>
          </div>
        )}
      </section>

      <p className="analytics-privacy-note">
        Click events store the selected element, destination path, timestamp, and
        country code only. No visitor identifier or IP address is saved.
      </p>
    </main>
  );
}
