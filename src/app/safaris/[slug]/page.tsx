import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Clock3, MapPin } from "lucide-react";
import { getPublicSafariBySlug } from "@/lib/catalog";
import { formatPrice, formatSeasonDate } from "@/lib/pricing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const safari = await getPublicSafariBySlug(slug);

  return safari
    ? {
        title: safari.title,
        description: safari.summary,
        openGraph: { images: [safari.image] },
      }
    : { title: "Safari journey not found" };
}

export default async function SafariDetailPage({ params }: Props) {
  const { slug } = await params;
  const safari = await getPublicSafariBySlug(slug);
  if (!safari) notFound();

  return (
    <main className="detail-page">
      <section className="detail-hero">
        <Image
          src={safari.image}
          alt={safari.imageAlt}
          fill
          priority
          sizes="100vw"
        />
        <span className="detail-hero-shade" />
        <div className="detail-hero-content page-width">
          <Link className="back-link back-link-light" href="/safaris">
            <ArrowLeft size={15} aria-hidden="true" /> All journeys
          </Link>
          <span className="eyebrow eyebrow-light">
            {safari.category} · {safari.country}
          </span>
          <h1>{safari.title}</h1>
          <p>{safari.summary}</p>
          <div className="detail-hero-meta">
            <span>
              <MapPin size={16} aria-hidden="true" />
              {safari.region}, {safari.country}
            </span>
            <span>
              <Clock3 size={16} aria-hidden="true" />
              {safari.durationDays} days
            </span>
          </div>
        </div>
      </section>

      <section className="detail-body page-width">
        <div className="detail-main">
          <div className="detail-intro">
            <span className="eyebrow">The feeling of the journey</span>
            <h2>Made for the moments <em>in between.</em></h2>
            <p>{safari.summary}</p>
          </div>

          <div className="detail-highlights">
            <span className="eyebrow">A few things to look forward to</span>
            <ul>
              {safari.highlights.map((highlight) => (
                <li key={highlight}>
                  <Check size={17} aria-hidden="true" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className="itinerary">
            <span className="eyebrow">A suggested rhythm</span>
            <h2>Room to <em>discover.</em></h2>
            {safari.itinerary.map((day, index) => (
              <article className="itinerary-day" key={day.title}>
                <span className="itinerary-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{day.title}</h3>
                  <p>{day.description}</p>
                </div>
              </article>
            ))}
            <p className="editorial-note">
              This is a sample itinerary concept, not a confirmed departure.
              Specific camps, activities and availability are agreed before
              booking.
            </p>
          </div>
        </div>

        <aside className="detail-aside">
          <div className="detail-aside-card">
            <span className="eyebrow">Designed around you</span>
            <h2>Let&apos;s make it <em>yours.</em></h2>
            <div className="detail-seasonal-pricing">
              <span className="eyebrow">Seasonal price · per person</span>
              {safari.seasonalPrices.length ? (
                <ul>
                  {safari.seasonalPrices.map((price) => (
                    <li key={price.seasonName}>
                      <span>
                        <strong>{price.seasonName}</strong>
                        <small>
                          {formatSeasonDate(price.startMonth, price.startDay)} –{" "}
                          {formatSeasonDate(price.endMonth, price.endDay)}
                        </small>
                      </span>
                      <span className="detail-price-value">
                        {formatPrice(price.pricePerPerson, price.currency)}
                        {price.isEstimate && <small>Estimate</small>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="detail-price-unavailable">Price on request</p>
              )}
              <p className="detail-price-note">
                Indicative per-person pricing only. Final quote depends on your
                travel dates, availability, accommodation and confirmed
                itinerary. No payment is taken online.
              </p>
            </div>
            <p>
              Share your dates and travel style. Our team will check
              availability and prepare a personal quote.
            </p>
            <Link
              className="button button-dark detail-booking-cta"
              href={`/booking?safari=${safari.slug}`}
              data-marketplace-click={`Request journey button: ${safari.title}`}
            >
              Request this journey <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <span className="no-payment-note">
              No payment is taken online.
            </span>
          </div>
        </aside>
      </section>
    </main>
  );
}
