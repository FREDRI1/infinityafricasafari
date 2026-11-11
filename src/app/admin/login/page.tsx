import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const { setup } = await searchParams;
  const configured = Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);
  if (configured && (await auth())) redirect("/admin");

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
        {!configured || setup === "required" ? (
          <div className="admin-setup-notice" role="status">
            Staff access is not configured. Add the database URL and
            authentication secret, then create the first staff account using
            the documented seed command.
          </div>
        ) : (
          <AdminLoginForm />
        )}
      </div>
    </main>
  );
}
