import type { Metadata } from "next";
import { CheckCircle2, LockKeyhole, Settings2 } from "lucide-react";
import { AdminTopbar } from "@/components/admin-topbar";
import { saveOperationalSettings } from "@/app/admin/settings/actions";
import { requireStaff } from "@/lib/admin";
import { getOperationalSettings } from "@/lib/operational-settings";
import { StaffRole } from "@prisma/client";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const staff = await requireStaff([StaffRole.SUPER_ADMIN, StaffRole.ADMIN]);
  const [settings, params] = await Promise.all([
    getOperationalSettings(),
    searchParams,
  ]);

  return (
    <main className="admin-shell page-width settings-page">
      <AdminTopbar role={staff.role} />
      <header className="settings-heading">
        <div>
          <span className="eyebrow">System administration</span>
          <h1>Settings</h1>
          <p>Manage booking availability and where new request alerts are sent.</p>
        </div>
      </header>

      {params.saved === "1" && (
        <p className="settings-saved" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          Your operational settings have been saved.
        </p>
      )}

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
