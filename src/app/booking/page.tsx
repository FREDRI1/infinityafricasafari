import type { Metadata } from "next";
import { BookingForm } from "@/components/booking-form";
import { getPublicSafaris } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Plan Your Safari",
  description:
    "Send a safari request to Infinity Africa Safari. Our team will check availability and help shape your journey.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ safari?: string }>;
}) {
  const { safari = "" } = await searchParams;
  const safaris = await getPublicSafaris();
  const initialSafariSlug = safaris.some((item) => item.slug === safari)
    ? safari
    : "";

  return (
    <main className="page-shell booking-page">
      <section className="page-hero page-width booking-intro">
        <span className="eyebrow">A personal safari starts here</span>
        <h1>
          Tell us about
          <br />
          <em>your Africa.</em>
        </h1>
        <p>
          A few details help us begin. This is a request only; our team will
          confirm availability and final arrangements with you.
        </p>
      </section>
      <section className="booking-layout page-width">
        <BookingForm
          safaris={safaris}
          initialSafariSlug={initialSafariSlug}
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
