import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { Safari } from "@/data/safaris";
import { formatPrice } from "@/lib/pricing";

export function SafariCard({ safari }: { safari: Safari }) {
  const startingPrice = safari.seasonalPrices
    .map((price) => Number(price.pricePerPerson))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)[0];
  const currency = safari.seasonalPrices[0]?.currency ?? "USD";

  return (
    <article className="safari-card">
      <Link
        className="safari-card-image"
        href={`/safaris/${safari.slug}`}
        aria-label={`View ${safari.title}`}
      >
        <Image
          src={safari.image}
          alt={safari.imageAlt}
          fill
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        <span className="image-tag">{safari.category}</span>
      </Link>
      <div className="safari-card-body">
        <div className="safari-card-meta">
          <span>
            <MapPin size={14} aria-hidden="true" />
            {safari.region}, {safari.country}
          </span>
          <span>
            <Clock3 size={14} aria-hidden="true" />
            {safari.durationDays} days
          </span>
        </div>
        <h3>
          <Link href={`/safaris/${safari.slug}`}>{safari.title}</Link>
        </h3>
        {startingPrice !== undefined && (
          <div className="safari-card-price">
            <strong>From {formatPrice(startingPrice, currency)} <span>per person</span></strong>
            <small>Indicative estimate · varies by season</small>
          </div>
        )}
        <p>{safari.summary}</p>
        <Link className="text-link" href={`/safaris/${safari.slug}`}>
          Explore this journey <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
