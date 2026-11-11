"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import {
  bookingFormSchema,
  type BookingFormInput,
  type BookingFormOutput,
} from "@/lib/booking-validation";
import { findSeasonalRate, formatPrice, formatSeasonDate } from "@/lib/pricing";
import type { Safari } from "@/data/safaris";

type Props = {
  safaris: Safari[];
  initialSafariSlug?: string;
  initialRequestedActivities?: string;
};

export function BookingForm({
  safaris,
  initialSafariSlug = "",
  initialRequestedActivities = "",
}: Props) {
  const router = useRouter();
  const [submissionId, setSubmissionId] = useState<string>();
  const form = useForm<BookingFormInput, undefined, BookingFormOutput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      safariSlug: initialSafariSlug,
      travelDate: "",
      adults: 2,
      children: 0,
      rooms: 1,
      requestedActivities: initialRequestedActivities,
      accommodationPreference: "",
      fullName: "",
      email: "",
      phone: "",
      whatsapp: "",
      countryOfResidence: "",
      preferredCommunication: "EMAIL",
      specialRequirements: "",
      website: "",
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  const selectedSafariSlug = useWatch({
    control: form.control,
    name: "safariSlug",
  });
  const selectedTravelDate = useWatch({
    control: form.control,
    name: "travelDate",
  });
  const selectedSafari = safaris.find(
    (safari) => safari.slug === selectedSafariSlug,
  );
  const selectedSeasonalPrice =
    selectedSafari && selectedTravelDate
      ? findSeasonalRate(
          selectedSafari.seasonalPrices,
          new Date(`${selectedTravelDate}T00:00:00.000Z`),
        )
      : undefined;

  async function submit(values: BookingFormOutput) {
    try {
      const requestId = submissionId ?? crypto.randomUUID();
      setSubmissionId(requestId);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, submissionId: requestId }),
      });
      const result: { reference?: string; error?: string } =
        await response.json();

      if (!response.ok || !result.reference) {
        setError("root.server", {
          message:
            result.error ??
            "We could not submit your request. Please try again.",
        });
        return;
      }

      router.push(
        `/booking/confirmation?reference=${encodeURIComponent(result.reference)}`,
      );
    } catch {
      setError("root.server", {
        message:
          "We could not connect to the booking service. Please check your connection and try again.",
      });
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <section className="form-section">
        <span className="step-label">01 / YOUR JOURNEY</span>
        <h2>Tell us what you have in mind.</h2>
        <div className="form-grid">
          <label className="field field-wide">
            Safari journey
            <select {...register("safariSlug")}>
              <option value="">Choose a starting point</option>
              {safaris.map((safari) => (
                <option value={safari.slug} key={safari.slug}>
                  {safari.title} · {safari.country}
                </option>
              ))}
            </select>
            {errors.safariSlug && (
              <span className="field-error">{errors.safariSlug.message}</span>
            )}
          </label>
          <label className="field">
            Preferred start date
            <input type="date" min={new Date().toISOString().slice(0, 10)} {...register("travelDate")} />
            {errors.travelDate && (
              <span className="field-error">{errors.travelDate.message}</span>
            )}
          </label>
          <label className="field">
            Accommodation preference
            <select {...register("accommodationPreference")}>
              <option value="">Let&apos;s discuss</option>
              <option value="Comfortable">Comfortable</option>
              <option value="Premium">Premium</option>
              <option value="Luxury">Luxury</option>
            </select>
          </label>
          <label className="field">
            Adults
            <input type="number" min="1" max="50" {...register("adults")} />
            {errors.adults && (
              <span className="field-error">{errors.adults.message}</span>
            )}
          </label>
          <label className="field">
            Children
            <input type="number" min="0" max="50" {...register("children")} />
            {errors.children && (
              <span className="field-error">{errors.children.message}</span>
            )}
          </label>
          <label className="field">
            Rooms
            <input type="number" min="1" max="20" {...register("rooms")} />
            {errors.rooms && (
              <span className="field-error">{errors.rooms.message}</span>
            )}
          </label>
          <label className="field field-wide">
            Experiences you are interested in{" "}
            <span className="field-optional">Optional</span>
            <input
              placeholder="For example: game drives, birding, cultural visits"
              {...register("requestedActivities")}
            />
          </label>
        </div>
        {selectedSafari && (
          <div className="booking-season-price" aria-live="polite">
            {selectedSeasonalPrice ? (
              <>
                <strong>
                  {selectedSeasonalPrice.seasonName}:{" "}
                  {formatPrice(
                    selectedSeasonalPrice.pricePerPerson,
                    selectedSeasonalPrice.currency,
                  )}{" "}
                  per person
                </strong>
                <span>
                  {formatSeasonDate(selectedSeasonalPrice.startMonth, selectedSeasonalPrice.startDay)}{" "}
                  – {formatSeasonDate(selectedSeasonalPrice.endMonth, selectedSeasonalPrice.endDay)}
                  {selectedSeasonalPrice.isEstimate ? " · Indicative estimate" : ""}. Final quote and
                  availability are confirmed by our team.
                </span>
              </>
            ) : (
              <span>
                Choose your preferred travel date to see its seasonal
                per-person estimate. Final pricing is confirmed by our team.
              </span>
            )}
          </div>
        )}
      </section>

      <section className="form-section">
        <span className="step-label">02 / YOUR DETAILS</span>
        <h2>How can we reach you?</h2>
        <div className="form-grid">
          <label className="field">
            Full name
            <input autoComplete="name" {...register("fullName")} />
            {errors.fullName && (
              <span className="field-error">{errors.fullName.message}</span>
            )}
          </label>
          <label className="field">
            Email address
            <input type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </label>
          <label className="field">
            Phone number
            <input type="tel" autoComplete="tel" {...register("phone")} />
            {errors.phone && (
              <span className="field-error">{errors.phone.message}</span>
            )}
          </label>
          <label className="field">
            WhatsApp number <span className="field-optional">Optional</span>
            <input type="tel" autoComplete="tel" {...register("whatsapp")} />
          </label>
          <label className="field">
            Country of residence <span className="field-optional">Optional</span>
            <input autoComplete="country-name" {...register("countryOfResidence")} />
          </label>
          <label className="field">
            Preferred way to reach you
            <select {...register("preferredCommunication")}>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Phone</option>
            </select>
          </label>
          <label className="field field-wide">
            Anything else we should know? <span className="field-optional">Optional</span>
            <textarea rows={4} {...register("specialRequirements")} />
          </label>
        </div>
      </section>

      <aside className="request-summary">
        <span className="eyebrow">A note on pricing</span>
        <p>
          Your request is not a confirmed booking. Our team will check
          availability, discuss the details and share a final quote before you
          decide.
        </p>
        {selectedSafari && (
          <div className="summary-selection">
            <span>Selected journey</span>
            <strong>{selectedSafari.title}</strong>
          </div>
        )}
      </aside>

      {errors.root?.server && (
        <p className="form-server-error" role="alert">
          {errors.root.server.message}
        </p>
      )}
      <button className="button button-dark submit-booking" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="spin" size={18} aria-hidden="true" />
            Sending your request
          </>
        ) : (
          <>
            Submit booking request <ArrowRight size={17} aria-hidden="true" />
          </>
        )}
      </button>
      <p className="form-privacy">
        Your details are used only to respond to this safari enquiry. We never
        ask for payment details online.
      </p>
    </form>
  );
}
