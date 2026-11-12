"use client";

import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Palette } from "lucide-react";
import { useState } from "react";
import { saveBrandSettings } from "@/app/admin/settings/actions";
import type { AdminMediaChoice } from "@/lib/admin-media";
import type { BrandSettings } from "@/lib/brand-settings";

function MediaPreview({
  choice,
  label,
}: {
  choice: AdminMediaChoice | undefined;
  label: string;
}) {
  return (
    <div className={`brand-media-preview${choice ? "" : " is-empty"}`}>
      {choice ? (
        <Image
          alt={choice.alt}
          height={64}
          src={choice.src}
          width={128}
        />
      ) : (
        <span>{label}</span>
      )}
    </div>
  );
}

export function AdminBrandSettings({
  settings,
  mediaChoices,
  saved,
}: {
  settings: BrandSettings;
  mediaChoices: AdminMediaChoice[];
  saved: boolean;
}) {
  const [logo, setLogo] = useState(settings.logo);
  const [icon, setIcon] = useState(settings.icon);
  const logoChoice = mediaChoices.find((choice) => choice.value === logo);
  const iconChoice = mediaChoices.find((choice) => choice.value === icon);

  return (
    <section
      className="settings-panel brand-settings-panel"
      aria-labelledby="brand-settings-title"
    >
      <div className="settings-panel-heading">
        <span className="settings-panel-icon"><Palette size={20} /></span>
        <div>
          <span className="analytics-kicker">Website identity</span>
          <h2 id="brand-settings-title">Brand &amp; identity</h2>
        </div>
      </div>

      {saved && (
        <p className="settings-saved" role="status">
          Your website brand settings have been saved.
        </p>
      )}

      <form action={saveBrandSettings} className="brand-settings-form">
        <div className="brand-identity-fields">
          <label className="settings-field" htmlFor="brand-name">
            <span>Company / website name</span>
            <small>
              This name appears in the browser title, search previews, and text
              logo.
            </small>
            <input
              autoComplete="organization"
              defaultValue={settings.name}
              id="brand-name"
              maxLength={80}
              name="name"
              required
            />
          </label>
          <label className="settings-field" htmlFor="brand-tagline">
            <span>Brand tagline</span>
            <small>
              Used in the browser title and under the text logo when no image
              logo is set.
            </small>
            <input
              defaultValue={settings.tagline}
              id="brand-tagline"
              maxLength={120}
              name="tagline"
            />
          </label>
        </div>

        <div className="brand-assets-grid">
          <div className="brand-asset-field">
            <label className="settings-field" htmlFor="brand-logo">
              <span>Website logo</span>
              <small>Choose a clear, transparent image for the header and footer.</small>
              <select
                id="brand-logo"
                name="logo"
                onChange={(event) => setLogo(event.target.value)}
                value={logo}
              >
                <option value="">Use the company name as a text logo</option>
                {mediaChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.category} — {choice.alt}
                  </option>
                ))}
              </select>
            </label>
            <MediaPreview choice={logoChoice} label="Text logo preview" />
          </div>

          <div className="brand-asset-field">
            <label className="settings-field" htmlFor="brand-icon">
              <span>Browser tab icon (favicon)</span>
              <small>A square PNG works best in browser tabs and bookmarks.</small>
              <select
                id="brand-icon"
                name="icon"
                onChange={(event) => setIcon(event.target.value)}
                value={icon}
              >
                <option value="">Keep the current website icon</option>
                {mediaChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.category} — {choice.alt}
                  </option>
                ))}
              </select>
            </label>
            <MediaPreview choice={iconChoice} label="Current website icon" />
          </div>
        </div>

        {!mediaChoices.length && (
          <p className="brand-media-note">
            Upload a logo or icon in the{" "}
            <Link href="/admin/media">media library</Link> before selecting it here.
          </p>
        )}

        <div className="hero-save-row">
          <p>
            <ImagePlus size={15} aria-hidden="true" />
            Changes are reflected across the public website.
          </p>
          <button className="button button-dark settings-submit" type="submit">
            Save brand identity
          </button>
        </div>
      </form>
    </section>
  );
}
