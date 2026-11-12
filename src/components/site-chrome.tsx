"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { MarketplaceClickTracker } from "@/components/marketplace-click-tracker";
import { SiteBrand } from "@/components/site-brand";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { MaintenanceSettings } from "@/lib/maintenance-settings";

type SiteChromeProps = {
  children: React.ReactNode;
  branding: { name: string; tagline: string; logoUrl: string };
  maintenance: MaintenanceSettings & { backgroundImageUrl: string };
  canPreviewMarketplace: boolean;
};

export function SiteChrome({
  children,
  branding,
  maintenance,
  canPreviewMarketplace,
}: SiteChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (isAdminRoute) return;

    const refresh = () => router.refresh();
    const interval = window.setInterval(refresh, 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isAdminRoute, router]);

  if (isAdminRoute) return children;

  if (maintenance.enabled && !canPreviewMarketplace) {
    return (
      <main
        aria-labelledby="marketplace-maintenance-heading"
        className="marketplace-maintenance"
        style={{
          backgroundImage: `linear-gradient(110deg, rgb(8 28 20 / 78%), rgb(8 28 20 / 38%)), url(${JSON.stringify(maintenance.backgroundImageUrl)})`,
        }}
      >
        <div className="marketplace-maintenance-content">
          <SiteBrand {...branding} className="marketplace-maintenance-brand" />
          <span className="marketplace-maintenance-kicker">A brief pause, a better journey</span>
          <h1 id="marketplace-maintenance-heading">{maintenance.heading}</h1>
          <p>{maintenance.message}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {maintenance.enabled && canPreviewMarketplace && (
        <aside className="marketplace-preview-banner" role="status">
          <span>
            <strong>Admin preview</strong>
            <span>Visitors still see the maintenance notice.</span>
          </span>
          <Link href="/admin/settings">
            Return to settings <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </aside>
      )}
      <MarketplaceClickTracker />
      <SiteHeader branding={branding} />
      {children}
      <SiteFooter branding={branding} />
    </>
  );
}
