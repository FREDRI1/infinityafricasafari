import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Infinity Africa Safari | Journeys shaped around you",
    template: "%s | Infinity Africa Safari",
  },
  description:
    "Thoughtful safari journeys across East Africa, tailored around your dates, interests and travel style.",
  applicationName: "Infinity Africa Safari",
  openGraph: {
    title: "Infinity Africa Safari",
    description:
      "Thoughtful journeys through East Africa, shaped around the way you want to experience the wild.",
    type: "website",
    images: ["/assets/images/hero/savannah-dawn.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infinity Africa Safari",
    description:
      "Thoughtful journeys through East Africa, shaped around the way you want to experience the wild.",
    images: ["/assets/images/hero/savannah-dawn.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <SiteChrome />
        {children}
      </body>
    </html>
  );
}
