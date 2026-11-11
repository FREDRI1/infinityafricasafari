import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  Clock3,
  Heart,
  Leaf,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SafariSearch } from "@/components/safari-search";
import { getPublicDestinations } from "@/lib/catalog";

const excursions = [
  {
    title: "Kaya Kinondo Sacred Forest",
    duration: "Half day",
    description: "A guided cultural and nature walk through a sacred coastal forest.",
    price: "$85",
    image: "/assets/images/excursions/kaya-kinondo.jpg",
    imageAlt: "Visitors walking beneath the canopy at Kaya Kinondo Sacred Forest",
  },
  {
    title: "Malindi Marine National Park",
    duration: "Half day",
    description: "Snorkelling and coral reef exploration in the Indian Ocean.",
    price: "$80",
    image: "/assets/images/excursions/malindi-reef.jpg",
    imageAlt: "Coral and sponges at Malindi Reef",
  },
  {
    title: "Funzi & Kinazini Islands",
    duration: "Full day",
    description: "A mangrove dhow cruise and a relaxed sandbank swim.",
    price: "$90",
    image: "/assets/images/excursions/kenya-coast.jpg",
    imageAlt: "Kenyan coastline at Diani Beach, shown as illustrative coastal photography",
  },
];

export default async function Home() {
  const destinations = await getPublicDestinations();

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
          <a className="scroll-cue" href="#destinations">
            <span>Explore destinations</span>
            <ArrowDown size={15} aria-hidden="true" />
          </a>
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
                    src={excursion.image}
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
                    <strong>From {excursion.price}</strong>
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
            pricing are confirmed by our team. Images are illustrative. Photo
            credits:{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Kaya_Kinondo,_Sacred_Forest,_Kenya.jpg"
              target="_blank"
              rel="noreferrer"
            >
              Ninara (CC BY 2.0)
            </a>
            ,{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Corals_at_Malindi_Reef.jpg"
              target="_blank"
              rel="noreferrer"
            >
              ordercrazy (CC0)
            </a>
            , and{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Diani_Beach_-_December_2023.jpg"
              target="_blank"
              rel="noreferrer"
            >
              Tall Black (CC BY-SA 4.0)
            </a>{" "}
            via Wikimedia Commons.
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
