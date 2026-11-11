import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Heart,
  Leaf,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SafariCard } from "@/components/safari-card";
import { SafariSearch } from "@/components/safari-search";
import { getPublicDestinations, getPublicSafaris } from "@/lib/catalog";

export default async function Home() {
  const [safaris, destinations] = await Promise.all([
    getPublicSafaris(),
    getPublicDestinations(),
  ]);

  return (
    <main>
      <section className="hero">
        <Image
          src="/assets/images/hero/savannah-dawn.jpg"
          alt="Safari vehicle on the African savannah at sunset"
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content page-width">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light">
              <span className="eyebrow-line" />
              A safari, made yours
            </span>
            <h1>
              Africa is not
              <br />
              just a place.
              <br />
              <em>It stays with you.</em>
            </h1>
            <p>
              Thoughtful journeys, shaped around the way you want to experience
              the wild.
            </p>
            <div className="hero-actions">
              <Link className="button button-gold" href="/safaris">
                Explore our journeys <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <span className="hero-note">Personal planning. Local perspective.</span>
            </div>
          </div>
          <div className="hero-caption">
            <span>01 — The first light</span>
            <span>East Africa</span>
          </div>
          <SafariSearch
            destinations={destinations.map(({ name, slug }) => ({ name, slug }))}
          />
          <a className="scroll-cue" href="#welcome">
            <span>Scroll to discover</span>
            <ArrowDown size={15} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="welcome-section section-pad" id="welcome">
        <div className="page-width welcome-grid">
          <div className="welcome-heading">
            <span className="eyebrow">Not a package. A point of departure.</span>
            <h2>
              The best journeys
              <br />
              <em>feel like your own.</em>
            </h2>
          </div>
          <div className="welcome-copy">
            <p className="lead">
              Some come for the wide-open plains. Others for the small,
              unplanned moments in between.
            </p>
            <p>
              Tell us what draws you to Africa. We&apos;ll help you shape a
              considered itinerary, with the right pace, places and people at
              its heart.
            </p>
            <Link className="text-link" href="/booking">
              Start a conversation <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="journeys-section section-pad">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A few ways to begin</span>
              <h2>Find your kind of <em>wild.</em></h2>
            </div>
            <Link className="text-link section-heading-link" href="/safaris">
              View all journeys <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="safari-grid">
            {safaris.slice(0, 3).map((safari) => (
              <SafariCard safari={safari} key={safari.slug} />
            ))}
          </div>
          <p className="editorial-note">
            Journey outlines are starting points only. Availability, final
            itineraries and pricing are confirmed with our team.
          </p>
        </div>
      </section>

      <section className="destination-section section-pad" id="destinations">
        <div className="page-width">
          <div className="section-heading destination-heading">
            <div>
              <span className="eyebrow">Places with a pulse</span>
              <h2>East Africa, <em>open to you.</em></h2>
            </div>
            <p>
              Four countries. Countless ways to slow down, look closer and
              travel well.
            </p>
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

      <section className="closing-section" id="contact">
        <Image
          src="/assets/images/destinations/wild-africa.jpg"
          alt=""
          fill
          sizes="100vw"
        />
        <span className="closing-overlay" />
        <div className="closing-content">
          <span className="eyebrow eyebrow-light">Your journey begins here</span>
          <h2>
            Come for the wild.
            <br />
            <em>Leave with a story.</em>
          </h2>
          <p>Share a few details. We&apos;ll take it from there, together.</p>
          <Link className="button button-gold" href="/booking">
            Plan your safari <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <span className="closing-location">
            <MapPin size={14} aria-hidden="true" /> Kenya · Tanzania · Uganda · Rwanda
          </span>
        </div>
      </section>
    </main>
  );
}
