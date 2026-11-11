"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Compass,
  FileText,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type DashboardTrendPoint = {
  date: string;
  bookings: number;
  confirmed: number;
  customers: number;
  payments: number;
};

export type DashboardStatus = {
  label: string;
  count: number;
  color: string;
};

type TrendPeriod = "7D" | "30D" | "3M";

function Sparkline({ values }: { values: number[] }) {
  const width = 94;
  const height = 30;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = values.length < 2 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - 3 - (value / max) * (height - 7);
    return `${x},${y}`;
  });

  return (
    <svg
      className="admin-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Recent activity sparkline"
    >
      <polyline points={points.join(" ")} />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(",")[0]}
          cy={points[points.length - 1].split(",")[1]}
          r="2.8"
        />
      )}
    </svg>
  );
}

function curvedPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midpointX = (current.x + next.x) / 2;
    const midpointY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${midpointX} ${midpointY}`;
  }
  const last = points[points.length - 1];
  if (points.length > 1) path += ` T ${last.x} ${last.y}`;
  return path;
}

function BookingTrends({ data }: { data: DashboardTrendPoint[] }) {
  const [period, setPeriod] = useState<TrendPeriod>("30D");
  const points = useMemo(() => {
    const days = period === "7D" ? 7 : period === "30D" ? 30 : 90;
    return data.slice(-days);
  }, [data, period]);

  const chart = useMemo(() => {
    const width = 700;
    const height = 218;
    const left = 30;
    const top = 14;
    const right = 12;
    const bottom = 25;
    const max = Math.max(
      1,
      ...points.map((point) => Math.max(point.bookings, point.confirmed)),
    );
    const toCoordinates = (key: "bookings" | "confirmed") =>
      points.map((point, index) => ({
        x: left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * (width - left - right)),
        y: top + (1 - point[key] / max) * (height - top - bottom),
      }));
    return {
      width,
      height,
      max,
      bookings: toCoordinates("bookings"),
      confirmed: toCoordinates("confirmed"),
    };
  }, [points]);

  const dateLabel = (index: number) => {
    const point = points[index];
    if (!point) return "";
    return new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };
  const labelIndexes = points.length > 1
    ? [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])]
    : [0];

  return (
    <section className="dashboard-panel dashboard-trend-panel" id="reports" aria-labelledby="trends-title">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Performance</span>
          <h2 id="trends-title">Booking trends</h2>
        </div>
        <div className="dashboard-periods" aria-label="Trend period">
          {(["7D", "30D", "3M"] as const).map((option) => (
            <button
              aria-pressed={period === option}
              className={period === option ? "is-selected" : ""}
              key={option}
              onClick={() => setPeriod(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="dashboard-chart-legend">
        <span><i className="legend-bookings" /> Bookings</span>
        <span><i className="legend-confirmed" /> Confirmed</span>
      </div>
      <div className="dashboard-line-chart">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img"
          aria-label={`Daily booking and confirmed booking counts over ${period}`}
        >
          <defs>
            <linearGradient id="bookings-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#176b4a" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#176b4a" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="confirmed-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e6a32d" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#e6a32d" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = 14 + fraction * (chart.height - 39);
            return (
              <g key={fraction}>
                <line x1="30" x2={chart.width - 12} y1={y} y2={y} />
                <text x="0" y={y + 4}>{Math.round(chart.max * (1 - fraction))}</text>
              </g>
            );
          })}
          <path className="chart-area-bookings" d={`${curvedPath(chart.bookings)} L 688 193 L 30 193 Z`} />
          <path className="chart-area-confirmed" d={`${curvedPath(chart.confirmed)} L 688 193 L 30 193 Z`} />
          <path className="chart-line-bookings" d={curvedPath(chart.bookings)} />
          <path className="chart-line-confirmed" d={curvedPath(chart.confirmed)} />
          {chart.bookings.length > 0 && (
            <circle className="chart-last-booking" cx={chart.bookings.at(-1)?.x} cy={chart.bookings.at(-1)?.y} r="4" />
          )}
          {chart.confirmed.length > 0 && (
            <circle className="chart-last-confirmed" cx={chart.confirmed.at(-1)?.x} cy={chart.confirmed.at(-1)?.y} r="4" />
          )}
          {labelIndexes.map((index) => {
            const x = chart.bookings[index]?.x ?? 30;
            return <text className="chart-date-label" key={index} x={x} y="212" textAnchor="middle">{dateLabel(index)}</text>;
          })}
        </svg>
      </div>
    </section>
  );
}

function BookingStatusChart({ data }: { data: DashboardStatus[] }) {
  const circumference = 2 * Math.PI * 48;
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const segments = data.map((item, index) => {
    const length = total ? (item.count / total) * circumference : 0;
    const offset = data
      .slice(0, index)
      .reduce((sum, previous) => sum + (total ? (previous.count / total) * circumference : 0), 0);
    return { ...item, length, offset };
  });

  return (
    <section className="dashboard-panel dashboard-status-panel" aria-labelledby="status-title">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Live pipeline</span>
          <h2 id="status-title">Booking status</h2>
        </div>
      </div>
      <div className="dashboard-donut-layout">
        <div className="dashboard-donut">
          <svg viewBox="0 0 124 124" role="img" aria-label={`${total} booking requests by status`}>
            <circle className="donut-track" cx="62" cy="62" r="48" />
            {segments.map((item) => (
                <circle
                  className="donut-segment"
                  cx="62"
                  cy="62"
                  key={item.label}
                  r="48"
                  stroke={item.color}
                  strokeDasharray={`${item.length} ${circumference - item.length}`}
                  strokeDashoffset={-item.offset}
                />
            ))}
          </svg>
          <div className="dashboard-donut-total">
            <strong>{total.toLocaleString()}</strong>
            <span>Requests</span>
          </div>
        </div>
        <ul className="dashboard-status-legend">
          {data.map((item) => (
            <li key={item.label}>
              <i style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
              <strong>{item.count.toLocaleString()}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AdminDashboardWidgets({
  trends,
  statuses,
}: {
  trends: DashboardTrendPoint[];
  statuses: DashboardStatus[];
}) {
  return (
    <div className="dashboard-insights-grid">
      <BookingTrends data={trends} />
      <BookingStatusChart data={statuses} />
    </div>
  );
}

export function DashboardToolbar({
  name,
  role,
}: {
  name: string;
  role: StaffRoleLabel;
}) {
  return (
    <div className="dashboard-toolbar">
      <form className="dashboard-search" action="/admin/bookings">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="admin-global-search">Search bookings, customers or safaris</label>
        <input
          id="admin-global-search"
          name="q"
          maxLength={100}
          placeholder="Search bookings, customers or safari journeys"
        />
        <button type="submit">Search</button>
      </form>
      <div className="dashboard-user-context">
        <span className="dashboard-user-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
        <span><strong>{name}</strong><small>{role.replaceAll("_", " ")}</small></span>
      </div>
    </div>
  );
}

export type StaffRoleLabel = "SUPER_ADMIN" | "ADMIN" | "SALES_MANAGER" | "CONTENT_EDITOR";

export function DashboardMetric({
  label,
  value,
  note,
  values,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  values: number[];
  icon: "bookings" | "confirmed" | "customers" | "payments";
  accent?: boolean;
}) {
  const Icon = icon === "bookings" ? CalendarDays
    : icon === "confirmed" ? CheckCircle2
      : icon === "customers" ? UsersRound
        : CircleDollarSign;

  return (
    <article className={`dashboard-metric${accent ? " is-accent" : ""}`}>
      <span className="dashboard-metric-icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="dashboard-metric-label">{label}</span>
      <strong className="dashboard-metric-value">{value}</strong>
      <span className="dashboard-metric-note">{note}</span>
      <Sparkline values={values} />
    </article>
  );
}

export function DashboardRecentTable({
  bookings,
}: {
  bookings: Array<{
    reference: string;
    customerName: string;
    safariTitle: string;
    travelStart: string;
    status: string;
  }>;
}) {
  return (
    <section className="dashboard-panel dashboard-recent-panel" aria-labelledby="recent-bookings-title">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">The latest in your inbox</span>
          <h2 id="recent-bookings-title">Recent booking requests</h2>
        </div>
        <Link className="dashboard-view-all" href="/admin/bookings">View all <ArrowRight size={14} /></Link>
      </div>
      {bookings.length ? (
        <div className="dashboard-table-scroll">
          <table className="dashboard-bookings-table">
            <thead>
              <tr><th>Reference</th><th>Safari</th><th>Customer</th><th>Travel date</th><th>Status</th><th aria-label="Open booking" /></tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.reference}>
                  <td><Link className="dashboard-reference" href={`/admin/bookings/${booking.reference}`}>{booking.reference}</Link></td>
                  <td>{booking.safariTitle}</td>
                  <td>{booking.customerName}</td>
                  <td>{new Date(booking.travelStart).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</td>
                  <td><span className={`dashboard-status-pill status-${booking.status.toLowerCase()}`}>{booking.status.replaceAll("_", " ")}</span></td>
                  <td><Link className="dashboard-view-control" href={`/admin/bookings/${booking.reference}`}>View <ArrowUpRight size={13} /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dashboard-empty">
          <Sparkles size={22} aria-hidden="true" />
          <p>New enquiries will appear here as soon as guests get in touch.</p>
        </div>
      )}
    </section>
  );
}

export function DashboardUpcoming({
  bookings,
}: {
  bookings: Array<{
    reference: string;
    safariTitle: string;
    customerName: string;
    travelStart: string;
    travelers: number;
    image: string | null;
  }>;
}) {
  return (
    <section className="dashboard-panel dashboard-upcoming-panel" aria-labelledby="upcoming-title">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">Confirmed journeys</span>
          <h2 id="upcoming-title">Upcoming travel</h2>
        </div>
        <CalendarDays size={17} aria-hidden="true" />
      </div>
      {bookings.length ? (
        <ul className="dashboard-upcoming-list">
          {bookings.map((booking) => (
            <li key={booking.reference}>
              <Link href={`/admin/bookings/${booking.reference}`} className="dashboard-upcoming-link">
                <span
                  aria-hidden="true"
                  className="dashboard-upcoming-thumb"
                  style={{ backgroundImage: `url("${booking.image || "/assets/images/hero/savannah-dawn.jpg"}")` }}
                />
                <span className="dashboard-upcoming-info">
                  <strong>{booking.safariTitle}</strong>
                  <small>{new Date(booking.travelStart).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} · {booking.customerName}</small>
                </span>
                <span className="dashboard-traveler-count">{booking.travelers} guests</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="dashboard-empty dashboard-upcoming-empty">
          <Clock3 size={20} aria-hidden="true" />
          <p>No confirmed future departures yet.</p>
        </div>
      )}
    </section>
  );
}

export function DashboardQuickActions({ isEditor }: { isEditor: boolean }) {
  const actions = [
    { label: "Add new safari", href: "/admin/safaris/new", icon: Compass, primary: true },
    ...(!isEditor ? [{ label: "Manage bookings", href: "/admin/bookings", icon: CalendarDays, primary: false }] : []),
    { label: "Update content", href: "/admin/content", icon: FileText, primary: false },
    ...(!isEditor ? [{ label: "View reports", href: "/admin/reports", icon: ChartNoAxesCombined, primary: false }] : []),
  ];

  return (
    <section className="dashboard-panel dashboard-actions-panel" aria-labelledby="quick-actions-title">
      <div className="dashboard-panel-heading">
        <div>
          <span className="dashboard-panel-kicker">At your fingertips</span>
          <h2 id="quick-actions-title">Quick actions</h2>
        </div>
        <Sparkles size={17} aria-hidden="true" />
      </div>
      <div className="dashboard-action-list">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link className={action.primary ? "is-primary" : ""} href={action.href} key={action.label}>
              <Icon size={16} aria-hidden="true" />
              <span>{action.label}</span>
              {action.primary && <ArrowRight size={14} aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function MetricTrendNote({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="dashboard-trend-neutral">{current > 0 ? "New activity" : "No recent activity"}</span>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return <span className="dashboard-trend-neutral">No change</span>;
  return (
    <span className={change > 0 ? "dashboard-trend-up" : "dashboard-trend-down"}>
      {change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(change)}% vs previous 30 days
    </span>
  );
}
