import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/admin-login-form";
import { AdminSessionSignOut } from "@/components/admin-session-signout";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; disabled?: string; session?: string }>;
}) {
  const { setup, disabled, session: sessionStatus } = await searchParams;
  const configured = Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);
  const session = configured ? await auth() : null;
  const currentUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isActive: true, role: true, authVersion: true },
      })
    : null;
  const inactiveSession = Boolean(session?.user?.id && !currentUser?.isActive);
  const expiredSession = Boolean(
    session?.user?.id &&
      currentUser?.isActive &&
      currentUser.authVersion !== session.user.authVersion,
  );
  if (currentUser?.isActive && !expiredSession) {
    redirect(
      currentUser.role === StaffRole.CONTENT_EDITOR
        ? "/admin/safaris"
        : "/admin",
    );
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            I
          </span>
          <span className="brand-wordmark">
            <strong>INFINITY</strong>
            <small>STAFF PORTAL</small>
          </span>
        </Link>
        <span className="eyebrow">Private access</span>
        <h1>Welcome <em>back.</em></h1>
        <p>Sign in with your authorized staff account to continue.</p>
        {(disabled === "1" || inactiveSession || sessionStatus === "expired" || expiredSession) && (
          <div className="admin-setup-notice" role="status">
            {expiredSession || sessionStatus === "expired"
              ? "Your session has expired because your password was changed. Sign out before signing in again."
              : "This staff account is inactive or no longer has access. Contact a super administrator if you need access restored."}
          </div>
        )}
        {!configured || setup === "required" ? (
          <div className="admin-setup-notice" role="status">
            Staff access is not configured. Add the database URL and
            authentication secret, then create the first staff account using
            the documented seed command.
          </div>
        ) : inactiveSession || expiredSession ? (
          <AdminSessionSignOut />
        ) : (
          <AdminLoginForm />
        )}
      </div>
    </main>
  );
}
