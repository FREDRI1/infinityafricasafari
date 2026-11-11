import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { SafariCard } from "@/components/safari-card";
import { getPublicDestinationBySlug, getPublicSafaris } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getPublicDestinationBySlug(slug);
  if (!destination) return { title: "Destination not found" };

  return {
    title: destination.seoTitle ?? `${destination.name} Safari Journeys`,
    description: destination.seoDescription ?? destination.summary,
    openGraph: {
      title: destination.seoTitle ?? `${destination.name} Safari Journeys`,
      description: destination.seoDescription ?? destination.summary,
      images: [destination.image],
    },
  };
}

export default async function DestinationPage({ params }: Props) {
  const { slug } = await params;
  const [destination, safaris] = await Promise.all([
    getPublicDestinationBySlug(slug),
    getPublicSafaris(),
  ]);
  if (!destination) notFound();

  const relatedSafaris = safaris.filter(
    (safari) => safari.country.toLocaleLowerCase() === destination.country.toLocaleLowerCase(),
  );

  return (
    <main className="destination-detail-page">
      <section className="destination-detail-hero">
        <Image
          src={destination.image}
          alt={destination.imageAlt}
          fill
          priority
          sizes="100vw"
        />
        <span className="destination-detail-shade" />
        <div className="page-width destination-detail-content">
          <Link className="back-link back-link-light" href="/#destinations">
            <ArrowLeft size={15} aria-hidden="true" /> All destinations
          </Link>
          <span className="eyebrow eyebrow-light">
            <MapPin size={13} aria-hidden="true" />
            {destination.country}
          </span>
          <h1>{destination.name}</h1>
          <p>{destination.summary}</p>
        </div>
      </section>

      <section className="page-width destination-detail-body">
        <div className="destination-overview">
          <span className="eyebrow">A sense of place</span>
          <h2>
            Find your own
            <br />
            <em>way into the wild.</em>
          </h2>
          <p>{destination.description}</p>
          <p className="editorial-note">
            Destination details and photographs are intended as an introduction.
            Exact routes, services and availability are confirmed with our
            team before any booking is made.
          </p>
          <Link className="button button-outline" href="/booking">
            Plan a journey here <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="destination-journeys">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Start exploring</span>
              <h2>Journeys in <em>{destination.name}.</em></h2>
            </div>
          </div>
          {relatedSafaris.length ? (
            <div className="safari-grid">
              {relatedSafaris.map((safari) => (
                <SafariCard safari={safari} key={safari.slug} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>We&apos;re shaping journeys here.</h2>
              <p>Send a request and tell us what you hope to experience.</p>
              <Link className="text-link" href="/booking">
                Plan a journey <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
