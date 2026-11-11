"use client";

import { useState } from "react";
import type {
  HomepageContent,
  HomepageExcursion,
  HomepageReview,
} from "@/data/homepage";

type Props = {
  initialValues: HomepageContent;
  mediaChoices: { value: string; label: string; src: string }[];
  action: (formData: FormData) => Promise<void>;
};

function createExcursion(): HomepageExcursion {
  return {
    title: "",
    duration: "Half day",
    description: "",
    priceUsd: 1,
    image: "",
    imageAlt: "",
  };
}

function createReview(): HomepageReview {
  return { quote: "", name: "", country: "", rating: 5 };
}

export function AdminHomepageContentForm({
  initialValues,
  mediaChoices,
  action,
}: Props) {
  const [excursions, setExcursions] = useState(initialValues.excursions);
  const [reviews, setReviews] = useState(initialValues.reviews);
  const homepageContent: HomepageContent = { excursions, reviews };

  function updateExcursion<K extends keyof HomepageExcursion>(
    index: number,
    key: K,
    value: HomepageExcursion[K],
  ) {
    setExcursions((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function updateReview<K extends keyof HomepageReview>(
    index: number,
    key: K,
    value: HomepageReview[K],
  ) {
    setReviews((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  return (
    <form action={action} className="admin-content-form homepage-content-form">
      <input
        type="hidden"
        name="homepageContent"
        value={JSON.stringify(homepageContent)}
      />
      <section className="admin-pricing-editor field-wide">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Homepage cards</span>
            <h2>Featured excursions</h2>
          </div>
          <button
            className="button button-outline button-small"
            type="button"
            disabled={excursions.length >= 12}
            onClick={() => setExcursions((items) => [...items, createExcursion()])}
          >
            Add excursion
          </button>
        </div>
        <p className="admin-note-small">
          Prices are indicative USD amounts per person. Availability and final
          pricing should be confirmed by your team.
        </p>
        {excursions.map((excursion, index) => (
          <fieldset className="admin-itinerary-day" key={`excursion-${index}`}>
            <legend>Excursion {index + 1}</legend>
            <label className="field">
              Title
              <input
                value={excursion.title}
                maxLength={120}
                onChange={(event) =>
                  updateExcursion(index, "title", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              Duration
              <select
                value={excursion.duration}
                onChange={(event) =>
                  updateExcursion(index, "duration", event.target.value)
                }
              >
                <option>Half day</option>
                <option>Full day</option>
                <option>Multi-day</option>
              </select>
            </label>
            <label className="field field-wide">
              Description
              <textarea
                rows={2}
                value={excursion.description}
                maxLength={500}
                onChange={(event) =>
                  updateExcursion(index, "description", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              Indicative price per person (USD)
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={excursion.priceUsd}
                onChange={(event) =>
                  updateExcursion(index, "priceUsd", Number(event.target.value))
                }
                required
              />
            </label>
            <label className="field">
              Image
              <select
                value={excursion.image}
                onChange={(event) =>
                  updateExcursion(index, "image", event.target.value)
                }
                required
              >
                <option value="">Choose media</option>
                {mediaChoices.map((media) => (
                  <option value={media.value} key={media.value}>
                    {media.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-wide">
              Image alt text
              <input
                value={excursion.imageAlt}
                maxLength={250}
                onChange={(event) =>
                  updateExcursion(index, "imageAlt", event.target.value)
                }
                required
              />
            </label>
            <button
              className="button button-outline button-small"
              type="button"
              disabled={excursions.length <= 1}
              onClick={() =>
                setExcursions((items) =>
                  items.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              Remove excursion
            </button>
          </fieldset>
        ))}
      </section>

      <section className="admin-pricing-editor field-wide">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Homepage stories</span>
            <h2>Guest reviews</h2>
          </div>
          <button
            className="button button-outline button-small"
            type="button"
            disabled={reviews.length >= 12}
            onClick={() => setReviews((items) => [...items, createReview()])}
          >
            Add review
          </button>
        </div>
        <p className="admin-note-small">
          Publish genuine, approved guest feedback only.
        </p>
        {reviews.map((review, index) => (
          <fieldset className="admin-itinerary-day" key={`review-${index}`}>
            <legend>Review {index + 1}</legend>
            <label className="field field-wide">
              Review
              <textarea
                rows={3}
                value={review.quote}
                maxLength={1000}
                onChange={(event) =>
                  updateReview(index, "quote", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              Guest name
              <input
                value={review.name}
                maxLength={100}
                onChange={(event) =>
                  updateReview(index, "name", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              Guest country
              <input
                value={review.country}
                maxLength={100}
                onChange={(event) =>
                  updateReview(index, "country", event.target.value)
                }
                required
              />
            </label>
            <label className="field">
              Rating
              <select
                value={review.rating}
                onChange={(event) =>
                  updateReview(index, "rating", Number(event.target.value))
                }
              >
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option value={rating} key={rating}>
                    {rating} out of 5
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button button-outline button-small"
              type="button"
              onClick={() =>
                setReviews((items) =>
                  items.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              Remove review
            </button>
          </fieldset>
        ))}
      </section>
      <button className="button button-dark field-wide">Save homepage content</button>
    </form>
  );
}
