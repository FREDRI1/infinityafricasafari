"use client";

import Image from "next/image";
import { useState } from "react";
import { localMedia } from "@/data/media";
import type { AdminMediaChoice } from "@/lib/admin-media";

export type SafariEditorValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationDays: number;
  category: string;
  region: string;
  destinationId: string;
  coverImage: string;
  imageAlt: string;
  highlights: string[];
  isPublished: boolean;
  itinerary: { title: string; description: string }[];
  seasonalPrices: SafariSeasonalPriceEditorValue[];
};

export type SafariSeasonalPriceEditorValue = {
  seasonName: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  pricePerPerson: string;
  currency: string;
  isEstimate: boolean;
};

type Props = {
  destinations: { id: string; name: string; isPublished: boolean }[];
  mediaChoices: AdminMediaChoice[];
  initialValues?: SafariEditorValues;
  action: (formData: FormData) => Promise<void>;
};

const emptyValues: SafariEditorValues = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  durationDays: 5,
  category: "Wildlife",
  region: "",
  destinationId: "",
  coverImage: localMedia[0].src,
  imageAlt: localMedia[0].alt,
  highlights: [],
  isPublished: false,
  itinerary: [{ title: "", description: "" }],
  seasonalPrices: [],
};

export function AdminSafariForm({
  destinations,
  mediaChoices,
  initialValues = emptyValues,
  action,
}: Props) {
  const [itinerary, setItinerary] = useState(initialValues.itinerary);
  const [seasonalPrices, setSeasonalPrices] = useState(
    initialValues.seasonalPrices,
  );
  const [selectedImage, setSelectedImage] = useState(initialValues.coverImage);
  const [imageAlt, setImageAlt] = useState(initialValues.imageAlt);
  const selectedMedia = mediaChoices.find((item) => item.value === selectedImage);

  function updateDay(
    index: number,
    key: "title" | "description",
    value: string,
  ) {
    setItinerary((days) =>
      days.map((day, dayIndex) =>
        dayIndex === index ? { ...day, [key]: value } : day,
      ),
    );
  }

  function updateSeasonalPrice<K extends keyof SafariSeasonalPriceEditorValue>(
    index: number,
    key: K,
    value: SafariSeasonalPriceEditorValue[K],
  ) {
    setSeasonalPrices((prices) =>
      prices.map((price, priceIndex) =>
        priceIndex === index ? { ...price, [key]: value } : price,
      ),
    );
  }

  return (
    <form action={action} className="admin-content-form">
      {initialValues.id && (
        <input type="hidden" name="id" value={initialValues.id} />
      )}
      <label className="field">
        Journey title
        <input
          name="title"
          defaultValue={initialValues.title}
          maxLength={120}
          required
        />
      </label>
      <label className="field">
        URL slug
        <input
          name="slug"
          defaultValue={initialValues.slug}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          maxLength={100}
          required
        />
      </label>
      <label className="field field-wide">
        Short description
        <textarea
          name="summary"
          defaultValue={initialValues.summary}
          rows={3}
          maxLength={1000}
          required
        />
      </label>
      <label className="field field-wide">
        Full description <span className="field-optional">Optional</span>
        <textarea
          name="description"
          defaultValue={initialValues.description}
          rows={5}
          maxLength={8000}
        />
      </label>
      <label className="field">
        Destination
        <select
          name="destinationId"
          defaultValue={initialValues.destinationId}
          required
        >
          <option value="">Choose a destination</option>
          {destinations.map((destination) => (
            <option value={destination.id} key={destination.id}>
              {destination.name}
              {destination.isPublished ? "" : " (draft)"}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Region or park
        <input
          name="region"
          defaultValue={initialValues.region}
          maxLength={120}
          required
        />
      </label>
      <label className="field">
        Duration (days)
        <input
          name="durationDays"
          type="number"
          min={1}
          max={60}
          defaultValue={initialValues.durationDays}
          required
        />
      </label>
      <label className="field">
        Journey category
        <input
          name="category"
          defaultValue={initialValues.category}
          maxLength={60}
          required
        />
      </label>
      <label className="field field-wide">
        Highlights <span className="field-optional">Separate each with a comma</span>
        <input
          name="highlights"
          defaultValue={initialValues.highlights.join(", ")}
          maxLength={1000}
        />
      </label>
      <label className="field">
        Cover image from the media library
        <select
          name="coverImage"
          value={selectedImage}
          onChange={(event) => {
            const image = mediaChoices.find(
              (media) => media.value === event.target.value,
            );
            setSelectedImage(event.target.value);
            if (image) setImageAlt(image.alt);
          }}
          required
        >
          {mediaChoices.map((media) => (
            <option value={media.value} key={media.value}>
              {media.category} · {media.alt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Image alt text
        <input
          name="imageAlt"
          value={imageAlt}
          onChange={(event) => setImageAlt(event.target.value)}
          maxLength={250}
          required
        />
      </label>
      {selectedMedia && (
        <div className="admin-media-preview field-wide">
          <Image
            src={selectedMedia.src}
            alt={selectedMedia.alt}
            width={selectedMedia.width}
            height={selectedMedia.height}
          />
          <span>
            {selectedMedia.width} × {selectedMedia.height} · {selectedMedia.category}
          </span>
        </div>
      )}
      <section className="admin-pricing-editor field-wide">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Per-person estimates · USD</span>
            <h2>Seasonal pricing</h2>
          </div>
          <button
            className="button button-outline button-small"
            type="button"
            onClick={() =>
              setSeasonalPrices((prices) => [
                ...prices,
                {
                  seasonName: "",
                  startMonth: 1,
                  startDay: 1,
                  endMonth: 12,
                  endDay: 31,
                  pricePerPerson: "",
                  currency: "USD",
                  isEstimate: true,
                },
              ])
            }
          >
            Add season
          </button>
        </div>
        <p className="admin-pricing-help">
          Set the date range and per-person price for each season. Estimates
          are clearly identified to guests. Replace them with confirmed rates
          when available.
        </p>
        <input
          type="hidden"
          name="seasonalPrices"
          value={JSON.stringify(seasonalPrices)}
        />
        {seasonalPrices.length ? (
          <div className="admin-pricing-list">
            {seasonalPrices.map((price, index) => (
              <fieldset className="admin-pricing-row" key={`${price.seasonName}-${index}`}>
                <legend>Season {index + 1}</legend>
                <label className="field">
                  Season name
                  <input
                    value={price.seasonName}
                    onChange={(event) =>
                      updateSeasonalPrice(index, "seasonName", event.target.value)
                    }
                    maxLength={60}
                    placeholder="Peak season"
                    required
                  />
                </label>
                <label className="field">
                  Price per person (USD)
                  <input
                    type="number"
                    min="1"
                    max="10000000"
                    step="0.01"
                    value={price.pricePerPerson}
                    onChange={(event) =>
                      updateSeasonalPrice(index, "pricePerPerson", event.target.value)
                    }
                    required
                  />
                </label>
                <div className="admin-season-date-fields">
                  <span>Valid travel dates</span>
                  <label className="field">
                    Start month
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={price.startMonth}
                      onChange={(event) =>
                        updateSeasonalPrice(index, "startMonth", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    Day
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={price.startDay}
                      onChange={(event) =>
                        updateSeasonalPrice(index, "startDay", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                  <span className="admin-season-date-separator">to</span>
                  <label className="field">
                    End month
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={price.endMonth}
                      onChange={(event) =>
                        updateSeasonalPrice(index, "endMonth", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    Day
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={price.endDay}
                      onChange={(event) =>
                        updateSeasonalPrice(index, "endDay", Number(event.target.value))
                      }
                      required
                    />
                  </label>
                </div>
                <label className="publish-toggle admin-estimate-toggle">
                  <input
                    type="checkbox"
                    checked={price.isEstimate}
                    onChange={(event) =>
                      updateSeasonalPrice(index, "isEstimate", event.target.checked)
                    }
                  />
                  <span>
                    <strong>Indicative estimate</strong>
                    <small>Turn off only when this is a confirmed price.</small>
                  </span>
                </label>
                <button
                  className="text-link remove-day"
                  type="button"
                  onClick={() =>
                    setSeasonalPrices((prices) =>
                      prices.filter((_, priceIndex) => priceIndex !== index),
                    )
                  }
                >
                  Remove season
                </button>
              </fieldset>
            ))}
          </div>
        ) : (
          <p className="admin-pricing-empty">
            No seasonal rates yet. Add at least one rate before publishing this
            journey.
          </p>
        )}
      </section>
      <div className="admin-itinerary-editor field-wide">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Daily outline</span>
            <h2>Itinerary</h2>
          </div>
          <button
            className="button button-outline button-small"
            type="button"
            onClick={() =>
              setItinerary((days) => [
                ...days,
                { title: "", description: "" },
              ])
            }
          >
            Add a day
          </button>
        </div>
        <input type="hidden" name="itinerary" value={JSON.stringify(itinerary)} />
        {itinerary.map((day, index) => (
          <fieldset className="itinerary-editor-day" key={index}>
            <legend>Day {index + 1}</legend>
            <label className="field">
              Day title
              <input
                value={day.title}
                onChange={(event) =>
                  updateDay(index, "title", event.target.value)
                }
                maxLength={120}
                required
              />
            </label>
            <label className="field">
              Description
              <textarea
                value={day.description}
                onChange={(event) =>
                  updateDay(index, "description", event.target.value)
                }
                rows={3}
                maxLength={1500}
                required
              />
            </label>
            {itinerary.length > 1 && (
              <button
                className="text-link remove-day"
                type="button"
                onClick={() =>
                  setItinerary((days) =>
                    days.filter((_, dayIndex) => dayIndex !== index),
                  )
                }
              >
                Remove day
              </button>
            )}
          </fieldset>
        ))}
      </div>
      <label className="publish-toggle field-wide">
        <input
          type="checkbox"
          name="isPublished"
          value="true"
          defaultChecked={initialValues.isPublished}
        />
        <span>
          <strong>Publish this safari</strong>
          <small>Published journeys are visible in the public catalogue.</small>
        </span>
      </label>
      <p className="admin-warning field-wide">
        Published prices are per person and do not confirm availability.
        Final itineraries and quotes are confirmed with each customer.
      </p>
      <button className="button button-dark field-wide">
        Save safari
      </button>
    </form>
  );
}
