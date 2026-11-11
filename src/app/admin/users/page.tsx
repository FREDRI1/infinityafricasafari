import type { Metadata } from "next";
import { KeyRound, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { StaffPermission, StaffRole } from "@prisma/client";
import { createStaffUser, updateStaffUser } from "@/app/admin/users/actions";
import { AdminTopbar } from "@/components/admin-topbar";
import { requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Users & roles",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const roleLabels: Record<StaffRole, string> = {
  SUPER_ADMIN: "Super administrator",
  ADMIN: "Administrator",
  SALES_MANAGER: "Sales manager",
  CONTENT_EDITOR: "Content editor",
};

const permissionLabels: Record<StaffPermission, string> = {
  BOOKING_OPERATIONS: "Bookings",
  CATALOG_MANAGEMENT: "Safaris & destinations",
  WEBSITE_CONTENT: "Website content",
  MEDIA_LIBRARY: "Media library",
  SYSTEM_SETTINGS: "Settings & maintenance mode",
  ANALYTICS: "Reports & analytics",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const staff = await requireStaff([StaffRole.SUPER_ADMIN]);
  const [users, params] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
    }),
    searchParams,
  ]);
  const activeCount = users.filter((user) => user.isActive).length;

  return (
    <main className="admin-shell page-width staff-users-page">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <header className="staff-users-heading">
        <div>
          <span className="eyebrow">System administration</span>
          <h1>Users &amp; roles</h1>
          <p>Manage staff access with role-based permissions and audited changes.</p>
        </div>
        <div className="staff-users-summary">
          <UsersRound size={18} aria-hidden="true" />
          <span><strong>{activeCount}</strong> active staff</span>
        </div>
      </header>

      {(params.created === "1" || params.saved === "1") && (
        <p className="settings-saved" role="status">
          <ShieldCheck size={17} aria-hidden="true" />
          {params.created === "1"
            ? "Staff account created. Share the temporary password securely."
            : "Staff account changes have been saved."}
        </p>
      )}

      <section className="staff-create-panel" aria-labelledby="create-staff-title">
        <div className="settings-panel-heading">
          <span className="settings-panel-icon"><UserPlus size={20} /></span>
          <div>
            <span className="analytics-kicker">Add a teammate</span>
            <h2 id="create-staff-title">Create staff account</h2>
          </div>
        </div>
        <form action={createStaffUser} className="staff-create-form">
          <label>
            <span>Full name</span>
            <input autoComplete="name" maxLength={100} name="name" required />
          </label>
          <label>
            <span>Work email</span>
            <input
              autoComplete="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </label>
          <label>
            <span>Role</span>
            <select defaultValue={StaffRole.SALES_MANAGER} name="role">
              {Object.values(StaffRole).map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Temporary password</span>
            <input
              autoComplete="new-password"
              maxLength={72}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
          <fieldset className="staff-permissions-fieldset">
            <legend>Additional privileges</legend>
            <p>These are added to the selected role&apos;s standard access.</p>
            <div className="staff-permissions-grid">
              {Object.values(StaffPermission).map((permission) => (
                <label key={permission}>
                  <input name="permissions" type="checkbox" value={permission} />
                  <span>{permissionLabels[permission]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="staff-password-note">
            Use at least 12 characters. Provide the initial password through a
            secure channel; it is never displayed again.
          </p>
          <button className="button button-dark" type="submit">
            Create account
          </button>
        </form>
      </section>

      <section className="staff-list-section" aria-labelledby="staff-list-title">
        <div className="analytics-panel-heading">
          <div>
            <span className="analytics-kicker">Access directory</span>
            <h2 id="staff-list-title">Staff accounts</h2>
          </div>
        </div>
        <div className="staff-user-list">
          {users.map((user) => {
            const action = updateStaffUser.bind(null, user.id);
            return (
              <article
                className={`staff-user-card${user.isActive ? "" : " is-inactive"}`}
                key={user.id}
              >
                <div className="staff-user-identity">
                  <span className="staff-user-avatar" aria-hidden="true">
                    {(user.name?.trim().charAt(0) || user.email.charAt(0)).toUpperCase()}
                  </span>
                  <div>
                    <h3>{user.name || "Unnamed staff member"}</h3>
                    <p>{user.email}</p>
                    <small>
                      Added {user.createdAt.toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                      {user.id === staff.id ? " · You" : ""}
                    </small>
                  </div>
                </div>
                <form action={action} className="staff-user-form">
                  <label>
                    <span>Name</span>
                    <input
                      autoComplete="name"
                      defaultValue={user.name ?? ""}
                      maxLength={100}
                      name="name"
                      required
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      autoComplete="email"
                      defaultValue={user.email}
                      maxLength={254}
                      name="email"
                      required
                      type="email"
                    />
                  </label>
                  <label>
                    <span>Role</span>
                    <select
                      defaultValue={user.role}
                      disabled={user.id === staff.id}
                      name="role"
                    >
                      {Object.values(StaffRole).map((role) => (
                        <option key={role} value={role}>{roleLabels[role]}</option>
                      ))}
                    </select>
                    {user.id === staff.id && (
                      <input name="role" type="hidden" value={user.role} />
                    )}
                  </label>
                  <fieldset className="staff-permissions-fieldset">
                    <legend>Additional privileges</legend>
                    <p>
                      Role access is retained; select any extra areas this teammate needs.
                      Super administrators already have full access.
                    </p>
                    <div className="staff-permissions-grid">
                      {Object.values(StaffPermission).map((permission) => (
                        <label key={permission}>
                          <input
                            defaultChecked={user.permissions.includes(permission)}
                            disabled={user.role === StaffRole.SUPER_ADMIN}
                            name="permissions"
                            type="checkbox"
                            value={permission}
                          />
                          <span>{permissionLabels[permission]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label>
                    <span>Account</span>
                    <select
                      defaultValue={String(user.isActive)}
                      disabled={user.id === staff.id}
                      name="isActive"
                    >
                      <option value="true">Active</option>
                      <option value="false">Deactivated</option>
                    </select>
                    {user.id === staff.id && (
                      <input name="isActive" type="hidden" value="true" />
                    )}
                  </label>
                  <label className="staff-password-reset">
                    <span>Reset password <small>(optional)</small></span>
                    <input
                      autoComplete="new-password"
                      maxLength={72}
                      minLength={12}
                      name="password"
                      placeholder="Leave blank to keep current"
                      type="password"
                    />
                  </label>
                  <button className="button button-outline" type="submit">
                    Save changes
                  </button>
                </form>
                <div className="staff-role-note">
                  <KeyRound size={14} aria-hidden="true" />
                  {roleLabels[user.role]}
                  <span className={user.isActive ? "staff-status-active" : "staff-status-inactive"}>
                    {user.isActive ? "Active" : "Deactivated"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <p className="settings-footnote">
        Only a super administrator can manage users and assign privileges. Role
        access is preserved, and at least one active super administrator must remain.
      </p>
    </main>
  );
}
