"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Archive,
  ChartNoAxesCombined,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessageCircle,
  Settings,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import type { StaffRole } from "@prisma/client";

type AdminTopbarProps = {
  role: StaffRole;
  pendingCount?: number;
};

type AdminNavItem = {
  label: string;
  href?: string;
  disabled?: boolean;
  icon: LucideIcon;
  roles?: StaffRole[];
};

const navigationGroups: { label: string; items: AdminNavItem[] }[] = [
  {
    label: "Core systems",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Safaris", href: "/admin/safaris", icon: Compass },
      { label: "Destinations", href: "/admin/destinations", icon: MapPinned },
      { label: "Itineraries", href: "/admin/safaris", icon: FileText },
      { label: "Pricing", disabled: true, icon: CreditCard },
    ],
  },
  {
    label: "Operations hub",
    items: [
      { label: "Bookings", href: "/admin/bookings", icon: Archive },
      { label: "Customers", disabled: true, icon: UsersRound },
      { label: "Payments", disabled: true, icon: CreditCard },
      { label: "Communications", disabled: true, icon: MessageCircle },
    ],
  },
  {
    label: "CMS & assets",
    items: [
      { label: "Media library", href: "/admin/media", icon: FileText },
      { label: "Blog", disabled: true, icon: FileText },
      { label: "Website content", href: "/admin/content", icon: Compass },
    ],
  },
  {
    label: "System admin",
    items: [
      {
        label: "Users & roles",
        href: "/admin/users",
        icon: UsersRound,
        roles: ["SUPER_ADMIN"],
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      { label: "Reports & analytics", href: "/admin/reports", icon: ChartNoAxesCombined },
    ],
  },
];

export function AdminTopbar({ role, pendingCount }: AdminTopbarProps) {
  const pathname = usePathname();
  const isEditor = role === "CONTENT_EDITOR";

  return (
    <aside className="admin-topbar" aria-label="Administration">
      <Link
        href={isEditor ? "/admin/safaris" : "/admin"}
        className="admin-topbar-brand"
      >
        <span className="brand-mark" aria-hidden="true">I</span>
        <span className="admin-brand-wordmark">
          <strong>INFINITY</strong>
          <small>AFRICA SAFARI</small>
        </span>
      </Link>
      <span className="admin-sidebar-caption">Explore Africa. Experience Infinity.</span>

      <nav className="admin-sidebar-nav" aria-label="Staff navigation">
        {navigationGroups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <h2>{group.label}</h2>
            {group.items.filter((item) => !item.roles || item.roles.includes(role)).map((item) => {
              const Icon = item.icon;
              const isCurrent = Boolean(
                item.href &&
                  (item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href)),
              );
              const isUnavailable = item.disabled || !item.href;
              const isRestricted =
                isEditor &&
                (item.href === "/admin/bookings" ||
                  item.href === "/admin" ||
                  item.href === "/admin/reports");

              return isUnavailable || isRestricted ? (
                <span
                  aria-disabled="true"
                  className="admin-nav-link admin-nav-disabled"
                  key={item.label}
                  title="This workspace area is not available yet."
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                  <small>Soon</small>
                </span>
              ) : (
                <Link
                  aria-current={isCurrent ? "page" : undefined}
                  className={`admin-nav-link${isCurrent ? " is-active" : ""}`}
                  href={item.href ?? "/admin"}
                  key={item.label}
                >
                  <Icon size={17} aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.label === "Bookings" && pendingCount !== undefined && pendingCount > 0 && (
                    <small className="admin-nav-count">{pendingCount}</small>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <ShieldCheck size={16} aria-hidden="true" />
        <span>{role.replaceAll("_", " ")}</span>
        <button
          type="button"
          aria-label="Sign out"
          onClick={() => signOut({ redirectTo: "/admin/login" })}
        >
          <LogOut size={17} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
