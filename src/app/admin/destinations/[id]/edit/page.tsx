import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { AdminDestinationForm } from "@/components/admin-destination-form";
import { saveDestination } from "@/app/admin/destinations/actions";
import { requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getAdminMediaChoices } from "@/lib/admin-media";

export const metadata: Metadata = {
  title: "Edit destination",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff([
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.CONTENT_EDITOR,
  ]);
  const { id } = await params;
  const [destination, mediaChoices] = await Promise.all([
    prisma.destination.findUnique({ where: { id } }),
    getAdminMediaChoices(),
  ]);
  if (!destination) notFound();

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Edit {destination.name}</h1>
          <p>Changes apply to public pages, not historical booking snapshots.</p>
        </div>
        <Link className="button button-outline" href="/admin/destinations">
          All destinations
        </Link>
      </div>
      <AdminDestinationForm
        mediaChoices={mediaChoices}
        initialValues={{
          id: destination.id,
          name: destination.name,
          slug: destination.slug,
          country: destination.country,
          summary: destination.summary,
          description: destination.description ?? "",
          heroImage: destination.heroImage ?? "",
          heroImageAlt: destination.heroImageAlt ?? "",
          seoTitle: destination.seoTitle ?? "",
          seoDescription: destination.seoDescription ?? "",
          isPublished: destination.isPublished,
        }}
        action={saveDestination}
      />
    </main>
  );
}
