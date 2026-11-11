import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(
    /\D/g,
    "",
  );

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href="/" className="brand brand-light">
            <span className="brand-mark" aria-hidden="true">
              I
            </span>
            <span className="brand-wordmark">
              <strong>INFINITY</strong>
              <small>AFRICA SAFARI</small>
            </span>
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
        <span>© Infinity Africa Safari</span>
        <span>Every journey begins with a conversation.</span>
      </div>
    </footer>
  );
}
