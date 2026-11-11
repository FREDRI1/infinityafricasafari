import type { Metadata } from "next";
import { CheckCircle2, LockKeyhole, Settings2, Wrench } from "lucide-react";
import { AdminTopbar } from "@/components/admin-topbar";
import {
  saveMaintenanceSettings,
  saveOperationalSettings,
} from "@/app/admin/settings/actions";
import { AdminHeroSettings } from "@/components/admin-hero-settings";
import { requireStaffPermission } from "@/lib/admin";
import { getAdminMediaChoices } from "@/lib/admin-media";
import { getHeroConfig } from "@/lib/hero-config";
import { getOperationalSettings } from "@/lib/operational-settings";
import { getMaintenanceSettings } from "@/lib/maintenance-settings";
import { StaffPermission, StaffRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    heroSaved?: string;
    maintenanceSaved?: string;
  }>;
}) {
  const staff = await requireStaffPermission(
    [StaffRole.SUPER_ADMIN, StaffRole.ADMIN],
    StaffPermission.SYSTEM_SETTINGS,
  );
  const [settings, params, heroConfig, mediaChoices, videoChoices, maintenance] = await Promise.all([
    getOperationalSettings(),
    searchParams,
    getHeroConfig(),
    getAdminMediaChoices(),
    getAdminMediaChoices({ mediaType: "video" }),
    getMaintenanceSettings(),
  ]);

  return (
    <main className="admin-shell page-width settings-page">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <header className="settings-heading">
        <div>
          <span className="eyebrow">System administration</span>
          <h1>Settings</h1>
          <p>Manage your homepage presentation and booking operations.</p>
        </div>
      </header>

      {params.saved === "1" && (
        <p className="settings-saved" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          Your operational settings have been saved.
        </p>
      )}
      {params.maintenanceSaved === "1" && (
        <p className="settings-saved" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          Marketplace access settings have been saved.
        </p>
      )}

      <AdminHeroSettings
        config={heroConfig}
        mediaChoices={mediaChoices}
        saved={params.heroSaved === "1"}
        videoChoices={videoChoices}
      />

      <section className="settings-panel" aria-labelledby="marketplace-access-title">
        <div className="settings-panel-heading">
          <span className="settings-panel-icon"><Wrench size={20} /></span>
          <div>
            <span className="analytics-kicker">Marketplace access</span>
            <h2 id="marketplace-access-title">Maintenance mode</h2>
          </div>
          <span className={`maintenance-state${maintenance.enabled ? " is-active" : ""}`}>
            {maintenance.enabled ? "Marketplace locked" : "Marketplace open"}
          </span>
        </div>
        <form action={saveMaintenanceSettings} className="settings-form">
          <label className="settings-field">
            <span>Marketplace availability</span>
            <small>
              When locked, public pages show the maintenance notice. The admin
              portal remains available so staff can reopen the marketplace.
            </small>
            <select defaultValue={String(maintenance.enabled)} name="enabled">
              <option value="false">Open to visitors</option>
              <option value="true">Under maintenance</option>
            </select>
          </label>
          <label className="settings-field">
            <span>Background image</span>
            <select
              defaultValue={maintenance.backgroundImage}
              name="backgroundImage"
              required
            >
              {mediaChoices.map((media) => (
                <option key={media.value} value={media.value}>
                  {media.alt || media.category}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            <span>Notice heading</span>
            <input
              defaultValue={maintenance.heading}
              maxLength={100}
              name="heading"
              required
            />
          </label>
          <label className="settings-field">
            <span>Visitor message</span>
            <textarea
              defaultValue={maintenance.message}
              maxLength={500}
              name="message"
              required
              rows={3}
            />
          </label>
          <button className="button button-dark settings-submit" type="submit">
            Save marketplace access
          </button>
        </form>
      </section>

      <section className="settings-panel" aria-labelledby="booking-settings-title">
        <div className="settings-panel-heading">
          <span className="settings-panel-icon"><Settings2 size={20} /></span>
          <div>
            <span className="analytics-kicker">Booking operations</span>
            <h2 id="booking-settings-title">Request handling</h2>
          </div>
        </div>
        <form action={saveOperationalSettings} className="settings-form">
          <label className="settings-field">
            <span>Accept new booking requests</span>
            <small>
              When paused, the booking service will not create new requests.
              Existing requests and staff access are unaffected.
            </small>
            <select
              defaultValue={String(settings.bookingRequestsEnabled)}
              name="bookingRequestsEnabled"
            >
              <option value="true">Open — accept requests</option>
              <option value="false">Paused — temporarily stop requests</option>
            </select>
          </label>

          <label className="settings-field">
            <span>Booking notification email</span>
            <small>
              New request alerts go here. Leave blank to use the server&apos;s
              ADMIN_NOTIFICATION_EMAIL setting.
            </small>
            <input
              autoComplete="email"
              defaultValue={settings.notificationEmail}
              maxLength={254}
              name="notificationEmail"
              placeholder="bookings@example.com"
              type="email"
            />
          </label>

          <div className="settings-security-note">
            <LockKeyhole size={17} aria-hidden="true" />
            <p>
              Email delivery still requires the server-side Resend credentials
              and verified sender. Secrets are managed in deployment settings,
              never stored in this form.
            </p>
          </div>

          <button className="button button-dark settings-submit" type="submit">
            Save operational settings
          </button>
        </form>
      </section>

      <p className="settings-footnote">
        Changes are recorded in the staff audit log. Your company name and core
        brand identity remain Infinity Africa Safari.
      </p>
    </main>
  );
}
