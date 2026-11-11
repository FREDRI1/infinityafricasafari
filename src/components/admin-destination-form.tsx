"use client";

import Image from "next/image";
import { useState } from "react";
import { localMedia } from "@/data/media";
import type { AdminMediaChoice } from "@/lib/admin-media";

export type DestinationEditorValues = {
  id?: string;
  name: string;
  slug: string;
  country: string;
  summary: string;
  description: string;
  heroImage: string;
  heroImageAlt: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
};

type Props = {
  mediaChoices: AdminMediaChoice[];
  initialValues?: DestinationEditorValues;
  action: (formData: FormData) => Promise<void>;
};

const emptyValues: DestinationEditorValues = {
  name: "",
  slug: "",
  country: "",
  summary: "",
  description: "",
  heroImage: localMedia[1].src,
  heroImageAlt: localMedia[1].alt,
  seoTitle: "",
  seoDescription: "",
  isPublished: false,
};

export function AdminDestinationForm({
  mediaChoices,
  initialValues = emptyValues,
  action,
}: Props) {
  const [selectedImage, setSelectedImage] = useState(initialValues.heroImage);
  const [imageAlt, setImageAlt] = useState(initialValues.heroImageAlt);
  const selectedMedia = mediaChoices.find((item) => item.value === selectedImage);

  return (
    <form action={action} className="admin-content-form">
      {initialValues.id && (
        <input type="hidden" name="id" value={initialValues.id} />
      )}
      <label className="field">
        Destination name
        <input name="name" defaultValue={initialValues.name} maxLength={100} required />
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
      <label className="field">
        Country
        <input
          name="country"
          defaultValue={initialValues.country}
          maxLength={100}
          required
        />
      </label>
      <label className="field field-wide">
        Short introduction
        <textarea
          name="summary"
          defaultValue={initialValues.summary}
          rows={3}
          maxLength={1500}
          required
        />
      </label>
      <label className="field field-wide">
        Destination overview
        <textarea
          name="description"
          defaultValue={initialValues.description}
          rows={6}
          maxLength={10000}
          required
        />
      </label>
      <label className="field">
        Hero image
        <select
          name="heroImage"
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
          name="heroImageAlt"
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
      <label className="field">
        SEO title <span className="field-optional">Optional</span>
        <input name="seoTitle" defaultValue={initialValues.seoTitle} maxLength={70} />
      </label>
      <label className="field field-wide">
        SEO description <span className="field-optional">Optional</span>
        <textarea
          name="seoDescription"
          defaultValue={initialValues.seoDescription}
          rows={3}
          maxLength={200}
        />
      </label>
      <label className="publish-toggle field-wide">
        <input
          type="checkbox"
          name="isPublished"
          value="true"
          defaultChecked={initialValues.isPublished}
        />
        <span>
          <strong>Publish this destination</strong>
          <small>Published destinations appear on the public homepage.</small>
        </span>
      </label>
      <p className="admin-warning field-wide">
        Destination descriptions should be reviewed for accuracy before
        publication. Images in the library are illustrative.
      </p>
      <button className="button button-dark field-wide">Save destination</button>
    </form>
  );
}
