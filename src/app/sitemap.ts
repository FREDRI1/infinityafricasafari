import type { MetadataRoute } from "next";
import { getPublicDestinations, getPublicSafaris } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [safaris, destinations] = await Promise.all([
    getPublicSafaris(),
    getPublicDestinations(),
  ]);
  const pages = [
    "",
    "/safaris",
    ...safaris.map((safari) => `/safaris/${safari.slug}`),
    ...destinations.map((destination) => `/destinations/${destination.slug}`),
    "/booking",
  ];

  return pages.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/safaris" ? 0.8 : 0.6,
  }));
}
