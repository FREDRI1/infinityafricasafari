"use client";

import Image from "next/image";
import { useState } from "react";
import { localMedia } from "@/data/media";

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
};

type Props = {
  destinations: { id: string; name: string; isPublished: boolean }[];
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
};

export function AdminSafariForm({
  destinations,
  initialValues = emptyValues,
  action,
}: Props) {
  const [itinerary, setItinerary] = useState(initialValues.itinerary);
  const [selectedImage, setSelectedImage] = useState(initialValues.coverImage);
  const [imageAlt, setImageAlt] = useState(initialValues.imageAlt);
  const selectedMedia = localMedia.find((item) => item.src === selectedImage);

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
        Cover image from the local library
        <select
          name="coverImage"
          value={selectedImage}
          onChange={(event) => {
            const image = localMedia.find(
              (media) => media.src === event.target.value,
            );
            setSelectedImage(event.target.value);
            if (image) setImageAlt(image.alt);
          }}
          required
        >
          {localMedia.map((media) => (
            <option value={media.src} key={media.src}>
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
            src={selectedImage}
            alt={selectedMedia.alt}
            width={selectedMedia.width}
            height={selectedMedia.height}
          />
          <span>
            {selectedMedia.width} × {selectedMedia.height} · {selectedMedia.category}
          </span>
        </div>
      )}
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
        This editor does not set prices. Availability and final pricing are
        confirmed with each customer.
      </p>
      <button className="button button-dark field-wide">
        Save safari
      </button>
    </form>
  );
}
