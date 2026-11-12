"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUpRight, Menu, X } from "lucide-react";
import { destinations } from "@/data/safaris";
import { SiteBrand } from "@/components/site-brand";

export function SiteHeader({
  branding,
}: {
  branding: { name: string; tagline: string; logoUrl: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <Link
          href="/"
          className="brand"
          aria-label={`${branding.name} home`}
          onClick={() => setMenuOpen(false)}
        >
          <SiteBrand {...branding} />
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/safaris">Explore safaris</Link>
          <details className="destination-dropdown">
            <summary>
              Destinations <ArrowDown size={14} aria-hidden="true" />
            </summary>
            <div className="destination-dropdown-panel">
              {destinations.map((destination) => (
                <Link
                  href={`/destinations/${destination.slug}`}
                  key={destination.slug}
                >
                  {destination.name}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/#our-approach">Our approach</Link>
        </nav>

        <Link className="button button-dark header-cta" href="/booking">
          Plan your safari <ArrowUpRight size={16} aria-hidden="true" />
        </Link>

        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link href="/safaris" onClick={() => setMenuOpen(false)}>
            Explore safaris
          </Link>
          <details className="mobile-destination-dropdown">
            <summary>
              Destinations <ArrowDown size={14} aria-hidden="true" />
            </summary>
            <div>
              {destinations.map((destination) => (
                <Link
                  href={`/destinations/${destination.slug}`}
                  key={destination.slug}
                  onClick={() => setMenuOpen(false)}
                >
                  {destination.name}
                </Link>
              ))}
            </div>
          </details>
          <Link href="/#our-approach" onClick={() => setMenuOpen(false)}>
            Our approach
          </Link>
          <Link href="/booking" onClick={() => setMenuOpen(false)}>
            Plan your safari <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/admin/login" onClick={() => setMenuOpen(false)}>
            Staff sign in
          </Link>
        </nav>
      )}
    </>
  );
}
