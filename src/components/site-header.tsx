"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { href: "/safaris", label: "Explore safaris" },
  { href: "/#destinations", label: "Destinations" },
  { href: "/#our-approach", label: "Our approach" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="topline">
        <p>Thoughtful journeys. Wild places. Your own kind of Africa.</p>
        <span>Kenya · Tanzania · Uganda · Rwanda</span>
      </div>
      <header className="site-header">
        <Link
          href="/"
          className="brand"
          aria-label="Infinity Africa Safari home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-mark" aria-hidden="true">
            I
          </span>
          <span className="brand-wordmark">
            <strong>INFINITY</strong>
            <small>AFRICA SAFARI</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
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
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
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
