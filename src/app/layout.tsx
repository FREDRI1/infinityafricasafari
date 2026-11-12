import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { canPreviewMarketplace } from "@/lib/admin";
import { getBrandSettings } from "@/lib/brand-settings";
import { getMaintenanceSettings } from "@/lib/maintenance-settings";
import { getPublicMediaUrl } from "@/lib/media-storage";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandSettings();
  const brandedTitle = branding.tagline
    ? `${branding.name} | ${branding.tagline}`
    : branding.name;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: brandedTitle,
      template: `%s | ${branding.name}`,
    },
    description:
      "Thoughtful safari journeys across East Africa, tailored around your dates, interests and travel style.",
    applicationName: branding.name,
    icons: {
      icon: branding.icon ? getPublicMediaUrl(branding.icon) : "/favicon.ico",
    },
    openGraph: {
      title: brandedTitle,
      description:
        "Thoughtful journeys through East Africa, shaped around the way you want to experience the wild.",
      type: "website",
      images: ["/assets/images/hero/savannah-dawn.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description:
        "Thoughtful journeys through East Africa, shaped around the way you want to experience the wild.",
      images: ["/assets/images/hero/savannah-dawn.jpg"],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [maintenance, canPreview, branding] = await Promise.all([
    getMaintenanceSettings(),
    canPreviewMarketplace(),
    getBrandSettings(),
  ]);
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <SiteChrome
          branding={{
            name: branding.name,
            tagline: branding.tagline,
            logoUrl: branding.logo ? getPublicMediaUrl(branding.logo) : "",
          }}
          maintenance={{
            ...maintenance,
            backgroundImageUrl: getPublicMediaUrl(maintenance.backgroundImage),
          }}
          canPreviewMarketplace={canPreview}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
