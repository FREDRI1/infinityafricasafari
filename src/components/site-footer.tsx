import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteBrand } from "@/components/site-brand";

export function SiteFooter({
  branding,
}: {
  branding: { name: string; tagline: string; logoUrl: string };
}) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(
    /\D/g,
    "",
  );

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href="/" className="brand brand-light">
            <SiteBrand {...branding} className="brand-light" />
          </Link>
          <p>
            A more personal way to experience Africa. Tell us what you have in
            mind and our team will help shape the journey.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <span className="footer-label">Discover</span>
            <Link href="/safaris">All safaris</Link>
            <Link href="/#destinations">Destinations</Link>
            <Link href="/#excursions">Day excursions</Link>
            <Link href="/#contact">Guest reviews</Link>
            <Link href="/#our-approach">Our approach</Link>
          </div>
          <div>
            <span className="footer-label">Start planning</span>
            <Link href="/booking">Send a safari request</Link>
            <Link href="/#contact">Get in touch</Link>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello, I would like to plan a safari.")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp us
              </a>
            )}
          </div>
          <div>
            <span className="footer-label">Staff</span>
            <Link href="/admin/login">Staff sign in</Link>
          </div>
        </div>
        <Link href="/booking" className="footer-cta">
          Begin your journey <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <div className="footer-bottom">
        <span>© {branding.name}</span>
        <small>
          We record anonymous clicks and country-level visit data to improve
          our journeys. IP addresses and visitor IDs are not stored.
        </small>
        <span>Every journey begins with a conversation.</span>
      </div>
    </footer>
  );
}
