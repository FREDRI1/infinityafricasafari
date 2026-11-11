import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { AdminSafariForm } from "@/components/admin-safari-form";
import { requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { saveSafari } from "@/app/admin/safaris/actions";

export const metadata: Metadata = {
  title: "Edit safari",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const contentRoles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

export default async function EditSafariPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff(contentRoles);
  const { id } = await params;
  const [safari, destinations] = await Promise.all([
    prisma.safari.findUnique({
      where: { id },
      include: { itineraryDays: { orderBy: { dayNumber: "asc" } } },
    }),
    prisma.destination.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, isPublished: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!safari) notFound();

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Edit safari</h1>
          <p>Changes to this content do not alter historical booking snapshots.</p>
        </div>
        <Link className="button button-outline" href="/admin/safaris">
          All safaris
        </Link>
      </div>
      <AdminSafariForm
        destinations={destinations}
        initialValues={{
          id: safari.id,
          title: safari.title,
          slug: safari.slug,
          summary: safari.summary,
          description: safari.description ?? "",
          durationDays: safari.durationDays,
          category: safari.category,
          region: safari.region ?? "",
          destinationId: safari.destinationId ?? "",
          coverImage: safari.coverImage ?? "",
          imageAlt: safari.imageAlt ?? "",
          highlights: safari.highlights,
          isPublished: safari.isPublished,
          itinerary: safari.itineraryDays.map((day) => ({
            title: day.title,
            description: day.description,
          })),
        }}
        action={saveSafari}
      />
    </main>
  );
}
