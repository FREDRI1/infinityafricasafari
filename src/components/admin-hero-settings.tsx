"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImagePlus, Plus, Trash2, Video } from "lucide-react";
import type { AdminMediaChoice } from "@/lib/admin-media";
import type { HeroConfigContent } from "@/lib/hero-config";
import { saveHeroConfig } from "@/app/admin/settings/actions";

const modes = [
  {
    value: "SINGLE_IMAGE",
    label: "Single image",
    description: "One still image with a subtle parallax effect.",
  },
  {
    value: "ANIMATED_SLIDESHOW",
    label: "Animated slideshow",
    description: "A gentle crossfade between selected images.",
  },
  {
    value: "VIDEO",
    label: "Video background",
    description: "A local, looping MP4 behind the hero copy.",
  },
] as const;

type HeroModeValue = (typeof modes)[number]["value"];

export function AdminHeroSettings({
  config,
  mediaChoices,
  saved,
  videoChoices,
}: {
  config: HeroConfigContent;
  mediaChoices: AdminMediaChoice[];
  saved: boolean;
  videoChoices: AdminMediaChoice[];
}) {
  const [mode, setMode] = useState<HeroModeValue>(config.mode);
  const [imageUrls, setImageUrls] = useState([...config.imageUrls]);

  function changeMode(nextMode: HeroModeValue) {
    setMode(nextMode);
    if (nextMode === "VIDEO") {
      setImageUrls([]);
    } else if (nextMode === "SINGLE_IMAGE") {
      setImageUrls(
        imageUrls.length
          ? [imageUrls[0]]
          : mediaChoices[0]
            ? [mediaChoices[0].value]
            : [],
      );
    } else if (
      nextMode === "ANIMATED_SLIDESHOW" &&
      imageUrls.length < 2
    ) {
      const additions = mediaChoices
        .map((choice) => choice.value)
        .filter((value) => !imageUrls.includes(value));
      setImageUrls([...imageUrls, ...additions].slice(0, 2));
    }
  }

  function addImage(value: string) {
    if (!value || imageUrls.includes(value)) return;
    setImageUrls(
      mode === "SINGLE_IMAGE"
        ? [value]
        : [...imageUrls, value].slice(0, 8),
    );
  }

  return (
    <section className="settings-panel hero-settings-panel" aria-labelledby="hero-settings-title">
      <div className="settings-panel-heading">
        <span className="settings-panel-icon"><ImagePlus size={20} /></span>
        <div>
          <span className="analytics-kicker">The Server Room</span>
          <h2 id="hero-settings-title">Homepage hero</h2>
        </div>
      </div>

      {saved && (
        <p className="settings-saved hero-settings-saved" role="status">
          Your homepage hero settings have been saved.
        </p>
      )}

      <form action={saveHeroConfig} className="hero-settings-form">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />

        <fieldset className="hero-mode-fieldset">
          <legend>Choose a background mode</legend>
          <div className="hero-mode-options">
            {modes.map((item) => (
              <label
                className={`hero-mode-option${mode === item.value ? " is-selected" : ""}`}
                key={item.value}
              >
                <input
                  checked={mode === item.value}
                  name="hero-mode-choice"
                  onChange={() => changeMode(item.value)}
                  type="radio"
                  value={item.value}
                />
                <span className="hero-mode-option-icon">
                  {item.value === "VIDEO" ? <Video size={18} /> : <ImagePlus size={18} />}
                </span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </label>
            ))}
          </div>
        </fieldset>

        {mode !== "VIDEO" ? (
          <div className="hero-media-editor">
            <label className="settings-field" htmlFor="hero-image-choice">
              <span>{mode === "SINGLE_IMAGE" ? "Hero image" : "Add a slideshow image"}</span>
              <small>
                Select from your media library. Slideshow mode supports 2–8 images.
              </small>
              <select
                id="hero-image-choice"
                defaultValue=""
                onChange={(event) => {
                  addImage(event.target.value);
                  event.currentTarget.value = "";
                }}
              >
                <option value="" disabled>
                  {mediaChoices.length ? "Choose an image" : "No media available"}
                </option>
                {mediaChoices.map((choice) => (
                  <option
                    disabled={mode === "ANIMATED_SLIDESHOW" && imageUrls.includes(choice.value)}
                    key={choice.value}
                    value={choice.value}
                  >
                    {choice.category} — {choice.alt}
                  </option>
                ))}
              </select>
            </label>

            {imageUrls.length > 0 ? (
              <div className="hero-image-list" aria-label="Selected hero images">
                {imageUrls.map((value, index) => {
                  const choice = mediaChoices.find((item) => item.value === value);
                  if (!choice) return null;
                  return (
                    <div className="hero-image-choice" key={value}>
                      <Image
                        alt={choice.alt}
                        height={64}
                        src={choice.src}
                        width={96}
                      />
                      <span>
                        <strong>{mode === "ANIMATED_SLIDESHOW" ? `Slide ${index + 1}` : "Selected image"}</strong>
                        <small>{choice.alt}</small>
                      </span>
                      <button
                        aria-label={`Remove ${choice.alt}`}
                        className="hero-image-remove"
                        onClick={() =>
                          setImageUrls(imageUrls.filter((image) => image !== value))
                        }
                        type="button"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="hero-editor-note">
                Choose {mode === "SINGLE_IMAGE" ? "one image" : "at least two images"} to continue.
              </p>
            )}
          </div>
        ) : (
          <label className="settings-field hero-video-field" htmlFor="hero-video-url">
            <span>MP4 background video</span>
            <small>
              Select an MP4 already uploaded to the media library. Your heading,
              supporting text, search and actions stay in the same positions.
            </small>
            <select
              defaultValue={config.videoUrl ?? ""}
              id="hero-video-url"
              name="videoUrl"
              required
            >
              <option value="" disabled>
                {videoChoices.length ? "Choose an MP4 video" : "Upload an MP4 to the media library first"}
              </option>
              {config.videoUrl?.startsWith("/") && (
                <option value={config.videoUrl}>Existing local video asset</option>
              )}
              {videoChoices.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.category} — {choice.alt}
                </option>
              ))}
            </select>
            <Link className="hero-upload-video-link" href="/admin/media">
              Upload a video in Media library
            </Link>
          </label>
        )}

        <div className="hero-copy-fields">
          <label className="settings-field" htmlFor="hero-heading">
            <span>Hero heading</span>
            <small>
              Keep it concise. Add a line break to control the heading layout on
              large screens.
            </small>
            <textarea
              defaultValue={config.headingText}
              id="hero-heading"
              maxLength={120}
              name="headingText"
              required
              rows={2}
            />
          </label>
          <label className="settings-field" htmlFor="hero-subheading">
            <span>Supporting text</span>
            <textarea
              defaultValue={config.subheadingText}
              id="hero-subheading"
              maxLength={300}
              name="subheadingText"
              required
              rows={3}
            />
          </label>
        </div>

        <div className="hero-save-row">
          <p>Changes update the public homepage as soon as they are saved.</p>
          <button
            className="button button-dark settings-submit"
            disabled={
              mode === "SINGLE_IMAGE"
                ? imageUrls.length !== 1
                : mode === "ANIMATED_SLIDESHOW" &&
                  (imageUrls.length < 2 || imageUrls.length > 8)
            }
            type="submit"
          >
            <Plus size={16} aria-hidden="true" />
            Save homepage hero
          </button>
        </div>
      </form>
    </section>
  );
}
