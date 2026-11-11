"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function SafariSearch({
  destinations,
}: {
  destinations: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const [destination, setDestination] = useState("");

  function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = destination
      ? `?destination=${encodeURIComponent(destination)}`
      : "";
    router.push(`/safaris${query}`);
  }

  return (
    <form className="hero-search" onSubmit={search}>
      <label htmlFor="hero-destination">
        <span>Where to?</span>
        <select
          id="hero-destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        >
          <option value="">All destinations</option>
          {destinations.map((item) => (
            <option value={item.name} key={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className="search-divider" />
      <p className="search-prompt">A journey designed around you</p>
      <button className="search-button" type="submit">
        <Search size={17} aria-hidden="true" />
        <span>Find a safari</span>
      </button>
    </form>
  );
}
