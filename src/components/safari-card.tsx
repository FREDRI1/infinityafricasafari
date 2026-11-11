import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { Safari } from "@/data/safaris";

export function SafariCard({ safari }: { safari: Safari }) {
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
        <p>{safari.summary}</p>
        <Link className="text-link" href={`/safaris/${safari.slug}`}>
          Explore this journey <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
