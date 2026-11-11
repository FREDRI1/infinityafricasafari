import type { Metadata } from "next";
import { SafariCatalog } from "@/components/safari-catalog";
import { getPublicSafaris } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Safari Journeys",
  description:
    "Explore considered safari journeys across East Africa. Every itinerary is tailored to your dates, interests and travel style.",
};

export default async function SafarisPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination = "" } = await searchParams;
  const safaris = await getPublicSafaris();

  return (
    <main className="page-shell">
      <section className="page-hero page-width">
        <span className="eyebrow">The journey is yours</span>
        <h1>
          A starting point
          <br />
          for <em>somewhere wild.</em>
        </h1>
        <p>
          Explore journey ideas and indicative seasonal prices, then tell us
          what you would make your own. Final routes, availability and quotes
          are confirmed with our team.
        </p>
      </section>
      <section className="catalog-section page-width">
        <SafariCatalog safaris={safaris} initialDestination={destination} />
      </section>
    </main>
  );
}
