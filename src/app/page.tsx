import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  Clock3,
  Heart,
  Leaf,
  ShieldCheck,
  Star,
} from "lucide-react";
import { HomepageHero } from "@/components/homepage-hero";
import { getHomepageContent } from "@/lib/homepage-content";
import { getPublicDestinations } from "@/lib/catalog";
import { formatPrice } from "@/lib/pricing";
import { getPublicMediaUrl } from "@/lib/media-storage";
import {
  getHeroConfig,
  isLocalHeroImagePath,
  isLocalHeroVideoPath,
} from "@/lib/hero-config";

export default async function Home() {
  const [destinations, homepageContent, heroConfig] = await Promise.all([
    getPublicDestinations(),
    getHomepageContent(),
    getHeroConfig(),
  ]);
  const excursions = homepageContent.excursions;
  const guestReviews = homepageContent.reviews;

  return (
    <main>
      <HomepageHero
        config={{
          ...heroConfig,
          videoUrl:
            heroConfig.videoUrl && !isLocalHeroVideoPath(heroConfig.videoUrl)
              ? getPublicMediaUrl(heroConfig.videoUrl)
              : heroConfig.videoUrl,
        }}
        destinations={destinations.map(({ name, slug }) => ({ name, slug }))}
        imageUrls={heroConfig.imageUrls.map((image) =>
          isLocalHeroImagePath(image) ? image : getPublicMediaUrl(image),
        )}
        key={`${heroConfig.mode}:${heroConfig.videoUrl ?? ""}:${heroConfig.imageUrls.join(",")}`}
      />

      <section className="destination-section section-pad" id="destinations">
        <div className="page-width">
          <div className="section-heading destination-heading">
            <div>
              <span className="eyebrow">DESTINATIONS & EXPERIENCES</span>
              <h2>Discover East Africa, <em>one journey at a time.</em></h2>
            </div>
            
          </div>
          <div className="destination-grid">
            {destinations.map((destination, index) => (
              <Link
                href={`/destinations/${destination.slug}`}
                className={`destination-card destination-card-${index + 1}`}
                key={destination.slug}
              >
                <Image
                  src={destination.image}
                  alt={destination.imageAlt}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
                <span className="destination-overlay" />
                <span className="destination-copy">
                  <span className="destination-number">0{index + 1} / EAST AFRICA</span>
                  <strong>{destination.name}</strong>
                  <span className="destination-link">
                    Explore journeys <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="editorial-note">
            Destination images are licensed illustrative photography, not a
            claim that they depict a specific itinerary.
          </p>
        </div>
      </section>

      <section className="excursions-section section-pad" id="excursions">
        <div className="page-width">
          <div className="section-heading excursions-heading">
            <span className="eyebrow">A little more to discover</span>
            <h2>Featured <em>Excursions</em></h2>
            <p>Explore unforgettable day adventures along the Kenyan coast.</p>
          </div>
          <div className="excursions-grid">
            {excursions.map((excursion) => (
              <article className="excursion-card" key={excursion.title}>
                <div className="excursion-image">
                  <Image
                    src={getPublicMediaUrl(excursion.image)}
                    alt={excursion.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                  />
                </div>
                <div className="excursion-body">
                  <h3>{excursion.title}</h3>
                  <span className="excursion-duration">
                    <Clock3 size={12} aria-hidden="true" />
                    {excursion.duration}
                  </span>
                  <p>{excursion.description}</p>
                  <div className="excursion-price">
                    <strong>From {formatPrice(excursion.priceUsd)}</strong>
                    <span>Indicative estimate · per person</span>
                  </div>
                  <Link
                    className="button excursion-button"
                    href={`/booking?activity=${encodeURIComponent(excursion.title)}`}
                  >
                    Enquire about excursion
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="excursion-note">
            Prices are indicative estimates in USD; availability and final
            pricing are confirmed by our team. Upload only images you own or
            have permission to use. Bundled image credits are listed in the{" "}
            <Link href="/assets/MEDIA.md">media manifest</Link>.
          </p>
        </div>
      </section>

      <section className="approach-section section-pad" id="our-approach">
        <div className="page-width approach-grid">
          <div className="approach-image">
            <Image
              src="/assets/images/experiences/wildlife.jpg"
              alt="Giraffe standing quietly among trees"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <span className="image-caption">The beauty is in the details.</span>
          </div>
          <div className="approach-copy">
            <span className="eyebrow">A more considered way to travel</span>
            <h2>
              Thoughtful by
              <br />
              <em>nature.</em>
            </h2>
            <p>
              A good safari is more than a list of sightings. It&apos;s the
              guide who knows when to wait, the right camp for your rhythm, and
              a plan with room to breathe.
            </p>
            <div className="approach-values">
              <div>
                <Compass size={20} aria-hidden="true" />
                <span>Made around you</span>
              </div>
              <div>
                <Heart size={20} aria-hidden="true" />
                <span>People come first</span>
              </div>
              <div>
                <Leaf size={20} aria-hidden="true" />
                <span>Travel with care</span>
              </div>
              <div>
                <ShieldCheck size={20} aria-hidden="true" />
                <span>Clear, personal guidance</span>
              </div>
            </div>
            <Link className="button button-outline" href="/booking">
              Let&apos;s plan together <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="reviews-section section-pad" id="contact">
        <div className="page-width">
          <div className="reviews-heading">
            <h2>Guest Reviews</h2>
            <p>What our travelers say</p>
          </div>
          <div className="reviews-grid">
            {guestReviews.map((review) => (
              <article className="review-card" key={review.name}>
                <div
                  className="review-stars"
                  role="img"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star
                      key={index}
                      size={15}
                      fill="currentColor"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote>&ldquo;{review.quote}&rdquo;</blockquote>
                <div className="review-author">
                  <strong>{review.name}</strong>
                  <span>{review.country}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
