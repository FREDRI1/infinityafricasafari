import Link from "next/link";

export default function UnauthorizedAdminPage() {
  return (
    <main className="admin-shell page-width">
      <section className="admin-empty">
        <span className="eyebrow">Access restricted</span>
        <h1>This staff role cannot access this area.</h1>
        <p>Contact your system administrator if you believe this is an error.</p>
        <Link className="button button-dark" href="/">
          Return to the website
        </Link>
      </section>
    </main>
  );
}
