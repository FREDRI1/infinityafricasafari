import type { Metadata } from "next";
import { BookingForm } from "@/components/booking-form";
import { getBrandSettings } from "@/lib/brand-settings";
import { getPublicSafaris } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandSettings();
  return {
    title: "Plan Your Safari",
    description: `Send a safari request to ${branding.name}. Our team will check availability and help shape your journey.`,
  };
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ safari?: string; activity?: string }>;
}) {
  const { safari = "", activity = "" } = await searchParams;
  const safaris = await getPublicSafaris();
  const initialSafariSlug = safaris.some((item) => item.slug === safari)
    ? safari
    : "";
  const initialRequestedActivities = activity.trim().slice(0, 120);

  return (
    <main className="page-shell booking-page">
      <section className="booking-layout page-width">
        <BookingForm
          safaris={safaris}
          initialSafariSlug={initialSafariSlug}
          initialRequestedActivities={initialRequestedActivities}
        />
        <aside className="booking-aside">
          <span className="eyebrow">What happens next</span>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>We receive your request</strong>
                <p>Your travel details stay attached to a unique reference.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>We check the details</strong>
                <p>Our team follows up to discuss availability and your plans.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>You decide</strong>
                <p>
                  Final pricing and payment instructions come from our team.
                  Nothing is charged online.
                </p>
              </div>
            </li>
          </ol>
          <div className="booking-aside-note">
            <span className="eyebrow">Your privacy matters</span>
            <p>
              We use your details to respond to this enquiry and plan your
              request. Never send card or bank credentials.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
