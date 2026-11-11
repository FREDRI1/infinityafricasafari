export type Safari = {
  slug: string;
  title: string;
  country: string;
  region: string;
  durationDays: number;
  category: string;
  image: string;
  imageAlt: string;
  summary: string;
  highlights: string[];
  itinerary: { title: string; description: string }[];
  seasonalPrices: SafariSeasonalPrice[];
};

export type SafariSeasonalPrice = {
  seasonName: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  pricePerPerson: string;
  currency: string;
  isEstimate: boolean;
};

export type Destination = {
  name: string;
  slug: string;
  country: string;
  summary: string;
  description: string;
  image: string;
  imageAlt: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export const safaris: Safari[] = [
  {
    slug: "maasai-mara-safari",
    title: "The Mara, unhurried",
    country: "Kenya",
    region: "Maasai Mara",
    durationDays: 5,
    category: "Wildlife",
    image: "/assets/images/hero/savannah-dawn.jpg",
    imageAlt: "Safari vehicle beneath an African sunset",
    summary:
      "A thoughtful introduction to the open plains, guided game drives and quiet moments that make a safari unforgettable.",
    highlights: ["Private game drives", "A slower pace", "Time on the open plains"],
    seasonalPrices: [
      { seasonName: "Green season", startMonth: 11, startDay: 1, endMonth: 5, endDay: 31, pricePerPerson: "1800", currency: "USD", isEstimate: true },
      { seasonName: "Peak season", startMonth: 6, startDay: 1, endMonth: 10, endDay: 31, pricePerPerson: "2500", currency: "USD", isEstimate: true },
    ],
    itinerary: [
      {
        title: "Arrive and settle in",
        description:
          "Meet your local team, travel to your chosen camp and ease into the landscape at your own pace.",
      },
      {
        title: "Follow the rhythm of the plains",
        description:
          "Spend the day exploring with a guide, with time to pause, watch and ask questions along the way.",
      },
      {
        title: "A final morning in the bush",
        description:
          "Enjoy one last early outing before your onward journey. The route and camp are confirmed with you before travel.",
      },
    ],
  },
  {
    slug: "tanzania-wilderness",
    title: "Tanzania, wide open",
    country: "Tanzania",
    region: "Northern Tanzania",
    durationDays: 7,
    category: "Classic",
    image: "/assets/images/destinations/wild-africa.jpg",
    imageAlt: "Lone acacia tree across a wide African plain at sunset",
    summary:
      "A made-to-measure route through expansive landscapes, shaped around the season, your interests and preferred pace.",
    highlights: ["Open landscapes", "Flexible routing", "Tailored camp choices"],
    seasonalPrices: [
      { seasonName: "Green season", startMonth: 11, startDay: 1, endMonth: 5, endDay: 31, pricePerPerson: "3200", currency: "USD", isEstimate: true },
      { seasonName: "Peak season", startMonth: 6, startDay: 1, endMonth: 10, endDay: 31, pricePerPerson: "4500", currency: "USD", isEstimate: true },
    ],
    itinerary: [
      {
        title: "A gentle beginning",
        description:
          "Arrive, meet your guide and settle into the first stop selected for your travel dates.",
      },
      {
        title: "Explore at your pace",
        description:
          "Choose between a relaxed morning, a full day in the field or a quieter day at camp.",
      },
      {
        title: "The journey continues",
        description:
          "Travel between landscapes with time for wildlife viewing and unhurried stops.",
      },
    ],
  },
  {
    slug: "kenya-wildlife-journey",
    title: "A closer look at Kenya",
    country: "Kenya",
    region: "Kenya",
    durationDays: 6,
    category: "Wildlife",
    image: "/assets/images/experiences/wildlife.jpg",
    imageAlt: "Giraffe standing among trees",
    summary:
      "A flexible wildlife-focused journey with room for the places, experiences and level of comfort that matter to you.",
    highlights: ["Expert local guiding", "Wildlife viewing", "Your choice of pace"],
    seasonalPrices: [
      { seasonName: "Green season", startMonth: 11, startDay: 1, endMonth: 5, endDay: 31, pricePerPerson: "2300", currency: "USD", isEstimate: true },
      { seasonName: "Peak season", startMonth: 6, startDay: 1, endMonth: 10, endDay: 31, pricePerPerson: "3100", currency: "USD", isEstimate: true },
    ],
    itinerary: [
      {
        title: "Welcome to Kenya",
        description:
          "Start with a personal welcome and a clear outline of the route agreed for your trip.",
      },
      {
        title: "Time in the wild",
        description:
          "Explore with a local guide and let the day unfold around the conditions and wildlife activity.",
      },
      {
        title: "A memorable farewell",
        description:
          "Enjoy a final outing before returning to your departure point.",
      },
    ],
  },
  {
    slug: "wildlife-conservation-journey",
    title: "Wildlife and conservation",
    country: "Kenya",
    region: "Kenya",
    durationDays: 4,
    category: "Conservation",
    image: "/assets/images/experiences/wildlife-encounter.jpg",
    imageAlt: "Rhinoceros and calf in their natural habitat",
    summary:
      "A considered itinerary concept focused on wildlife and the landscapes that support it. Final experiences depend on availability.",
    highlights: ["Wildlife-focused days", "Local guiding", "Time to learn"],
    seasonalPrices: [
      { seasonName: "Green season", startMonth: 11, startDay: 1, endMonth: 5, endDay: 31, pricePerPerson: "1450", currency: "USD", isEstimate: true },
      { seasonName: "Peak season", startMonth: 6, startDay: 1, endMonth: 10, endDay: 31, pricePerPerson: "1950", currency: "USD", isEstimate: true },
    ],
    itinerary: [
      {
        title: "Plan your arrival",
        description:
          "We confirm a suitable start point, transfers and accommodation together before any arrangements are finalized.",
      },
      {
        title: "Discover the landscape",
        description:
          "Spend time in the field with a guide, with activities tailored to your interests.",
      },
      {
        title: "Depart at your own pace",
        description:
          "The final morning and transfer are planned around your confirmed travel schedule.",
      },
    ],
  },
  {
    slug: "uganda-wild-places",
    title: "Uganda, a slower kind of wild",
    country: "Uganda",
    region: "Uganda",
    durationDays: 6,
    category: "Wildlife",
    image: "/assets/images/experiences/wildlife.jpg",
    imageAlt: "Giraffe standing quietly among trees",
    summary:
      "A flexible journey concept for travellers drawn to quieter landscapes, guided time outdoors and unhurried days.",
    highlights: ["A gentler pace", "Local guiding", "Flexible experiences"],
    seasonalPrices: [
      { seasonName: "Green season", startMonth: 11, startDay: 1, endMonth: 5, endDay: 31, pricePerPerson: "2800", currency: "USD", isEstimate: true },
      { seasonName: "Peak season", startMonth: 6, startDay: 1, endMonth: 10, endDay: 31, pricePerPerson: "3900", currency: "USD", isEstimate: true },
    ],
    itinerary: [
      {
        title: "Arrive and find your rhythm",
        description:
          "Meet your local team and settle into the first stop chosen for your dates and travel style.",
      },
      {
        title: "Explore with a local guide",
        description:
          "Spend time outdoors with the route and activities confirmed together before travel.",
      },
      {
        title: "A thoughtful journey home",
        description:
          "Plan your final morning and onward transfer around the schedule you have agreed.",
      },
    ],
  },
  {
    slug: "rwanda-wildlife-journey",
    title: "Rwanda, closer to nature",
    country: "Rwanda",
    region: "Rwanda",
    durationDays: 5,
    category: "Wildlife",
    image: "/assets/images/experiences/wildlife-encounter.jpg",
    imageAlt: "Rhinoceros and calf in their natural habitat",
    summary:
      "A tailored starting point for a nature-led journey, with experiences, permits and availability discussed in advance.",
    highlights: ["Nature-led planning", "Personal itinerary", "Advance availability checks"],
    seasonalPrices: [
      { seasonName: "Green season", startMonth: 11, startDay: 1, endMonth: 5, endDay: 31, pricePerPerson: "2600", currency: "USD", isEstimate: true },
      { seasonName: "Peak season", startMonth: 6, startDay: 1, endMonth: 10, endDay: 31, pricePerPerson: "3600", currency: "USD", isEstimate: true },
    ],
    itinerary: [
      {
        title: "A warm welcome",
        description:
          "Begin with a personal welcome and a route review based on your confirmed travel dates.",
      },
      {
        title: "Time in the landscape",
        description:
          "Choose the experiences that suit your interests, with any permits and availability confirmed before booking.",
      },
      {
        title: "Depart with ease",
        description:
          "Coordinate the final transfer around your confirmed onward journey.",
      },
    ],
  },
];

export const destinations = [
  {
    name: "Kenya",
    slug: "kenya",
    country: "Kenya",
    image: "/assets/images/hero/savannah-dawn.jpg",
    imageAlt: "Safari vehicle on the savannah at sunset",
    summary:
      "From broad grasslands to forested highlands, explore a Kenyan journey shaped around your dates and interests.",
    description:
      "From broad grasslands to forested highlands, explore a Kenyan journey shaped around your dates and interests.",
    seoTitle: null,
    seoDescription: null,
  },
  {
    name: "Tanzania",
    slug: "tanzania",
    country: "Tanzania",
    image: "/assets/images/destinations/wild-africa.jpg",
    imageAlt: "Acacia tree silhouetted against the evening sky",
    summary:
      "Create space for remarkable landscapes, wildlife and the small details of a slower journey.",
    description:
      "Create space for remarkable landscapes, wildlife and the small details of a slower journey.",
    seoTitle: null,
    seoDescription: null,
  },
  {
    name: "Uganda",
    slug: "uganda",
    country: "Uganda",
    image: "/assets/images/experiences/wildlife.jpg",
    imageAlt: "Giraffe among trees",
    summary:
      "A starting point for a more intimate itinerary, with the route and activities confirmed to suit your plans.",
    description:
      "A starting point for a more intimate itinerary, with the route and activities confirmed to suit your plans.",
    seoTitle: null,
    seoDescription: null,
  },
  {
    name: "Rwanda",
    slug: "rwanda",
    country: "Rwanda",
    image: "/assets/images/experiences/wildlife-encounter.jpg",
    imageAlt: "Rhinoceros and calf in their natural habitat",
    summary:
      "Thoughtful, nature-led journeys with key experiences and availability checked well ahead of travel.",
    description:
      "Thoughtful, nature-led journeys with key experiences and availability checked well ahead of travel.",
    seoTitle: null,
    seoDescription: null,
  },
];
