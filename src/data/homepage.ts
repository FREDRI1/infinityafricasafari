export type HomepageExcursion = {
  title: string;
  duration: string;
  description: string;
  priceUsd: number;
  image: string;
  imageAlt: string;
};

export type HomepageReview = {
  quote: string;
  name: string;
  country: string;
  rating: number;
};

export type HomepageContent = {
  excursions: HomepageExcursion[];
  reviews: HomepageReview[];
};

export const defaultHomepageContent: HomepageContent = {
  excursions: [
    {
      title: "Kaya Kinondo Sacred Forest",
      duration: "Half day",
      description:
        "A guided cultural and nature walk through a sacred coastal forest.",
      priceUsd: 85,
      image: "/assets/images/excursions/kaya-kinondo.jpg",
      imageAlt:
        "Visitors walking beneath the canopy at Kaya Kinondo Sacred Forest",
    },
    {
      title: "Malindi Marine National Park",
      duration: "Half day",
      description:
        "Snorkelling and coral reef exploration in the Indian Ocean.",
      priceUsd: 80,
      image: "/assets/images/excursions/malindi-reef.jpg",
      imageAlt: "Coral and sponges at Malindi Reef",
    },
    {
      title: "Funzi & Kinazini Islands",
      duration: "Full day",
      description: "A mangrove dhow cruise and a relaxed sandbank swim.",
      priceUsd: 90,
      image: "/assets/images/excursions/kenya-coast.jpg",
      imageAlt:
        "Kenyan coastline at Diani Beach, shown as illustrative coastal photography",
    },
  ],
  reviews: [
    {
      quote:
        "An absolutely incredible experience! The guides were so knowledgeable and the accommodations were top-notch. Highly recommend!",
      name: "Sarah Jenkins",
      country: "United Kingdom",
      rating: 5,
    },
    {
      quote:
        "We saw the big five on our second day! The attention to detail in planning our itinerary made this trip completely stress-free.",
      name: "Michael Chen",
      country: "USA",
      rating: 5,
    },
    {
      quote:
        "Infinity Africa Safari provided a perfect balance of adventure and relaxation. The coastal extension after the safari was magical.",
      name: "Elena Rossi",
      country: "Italy",
      rating: 5,
    },
  ],
};
