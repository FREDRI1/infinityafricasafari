"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SafariCard } from "@/components/safari-card";
import type { Safari } from "@/data/safaris";

export function SafariCatalog({
  safaris,
  initialDestination = "",
}: {
  safaris: Safari[];
  initialDestination?: string;
}) {
  const [destination, setDestination] = useState(initialDestination);
  const [query, setQuery] = useState("");

  const visibleSafaris = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return safaris.filter((safari) => {
      const matchesDestination =
        !destination || safari.country.toLowerCase() === destination.toLowerCase();
      const searchableText =
        `${safari.title} ${safari.region} ${safari.country} ${safari.category}`.toLowerCase();
      return matchesDestination && searchableText.includes(normalizedQuery);
    });
  }, [destination, query, safaris]);

  return (
    <>
      <div className="catalog-filters">
        <label className="catalog-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search safari journeys</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search journeys"
          />
        </label>
        <label className="catalog-destination">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span className="sr-only">Filter by destination</span>
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">All destinations</option>
            {[...new Set(safaris.map((safari) => safari.country))].map(
              (country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {visibleSafaris.length ? (
        <div className="safari-grid">
          {visibleSafaris.map((safari) => (
            <SafariCard key={safari.slug} safari={safari} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="eyebrow">No journeys found</span>
          <h2>Try another destination or search.</h2>
          <p>We can also create a route around the places you have in mind.</p>
        </div>
      )}
    </>
  );
}
