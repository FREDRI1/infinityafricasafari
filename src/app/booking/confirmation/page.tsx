import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference = "" } = await searchParams;
  if (!/^IAS-\d{4}-[A-F0-9]{8}$/.test(reference)) notFound();

  const booking = await prisma.booking.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      travelStart: true,
      adults: true,
      children: true,
      safariSnapshot: true,
      notificationStatus: true,
      createdAt: true,
    },
  });
  if (!booking) notFound();

  const safariSnapshot =
    typeof booking.safariSnapshot === "object" &&
    booking.safariSnapshot !== null &&
    "title" in booking.safariSnapshot
      ? booking.safariSnapshot
      : null;
  const safariTitle =
    safariSnapshot && typeof safariSnapshot.title === "string"
      ? safariSnapshot.title
      : "Your requested safari";

  return (
    <main className="confirmation-page page-width">
      <div className="confirmation-card">
        <span className="confirmation-check">
          <Check size={26} aria-hidden="true" />
        </span>
        <span className="eyebrow">Request received</span>
        <h1>
          Thank you for
          <br />
          choosing <em>Infinity Africa.</em>
        </h1>
        <p className="confirmation-lead">
          Your safari request is safely with us. Our team will check
          availability and contact you to discuss the details.
        </p>
        <div className="reference-box">
          <span>Booking reference</span>
          <strong>{booking.reference}</strong>
        </div>
        <dl className="confirmation-details">
          <div>
            <dt>Safari</dt>
            <dd>{safariTitle}</dd>
          </div>
          <div>
            <dt>Preferred start</dt>
            <dd>
              {booking.travelStart.toLocaleDateString("en", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              })}
            </dd>
          </div>
          <div>
            <dt>Travellers</dt>
            <dd>
              {booking.adults} adult{booking.adults === 1 ? "" : "s"}
              {booking.children
                ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
                : ""}
            </dd>
          </div>
          <div>
            <dt>Request status</dt>
            <dd>{booking.status.replaceAll("_", " ").toLowerCase()}</dd>
          </div>
        </dl>
        <p className="confirmation-note">
          This is a request, not a confirmed reservation. No payment has been
          taken. Final availability, pricing and payment arrangements are
          handled personally by our team.
        </p>
        {booking.notificationStatus === "SENT" && (
          <p className="confirmation-email-note">
            A request confirmation email has also been sent.
          </p>
        )}
        {booking.notificationStatus === "FAILED" && (
          <p className="confirmation-email-note">
            Your request is saved. Email delivery is delayed, but our team can
            follow up using your preferred contact method.
          </p>
        )}
        <Link className="button button-dark" href="/">
          Return to the homepage <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
