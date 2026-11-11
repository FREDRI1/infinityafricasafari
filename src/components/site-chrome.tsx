"use client";

import { usePathname } from "next/navigation";
import { MarketplaceClickTracker } from "@/components/marketplace-click-tracker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) return children;

  return (
    <>
      <MarketplaceClickTracker />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
