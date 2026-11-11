import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StaffPermission, StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { AdminSafariForm } from "@/components/admin-safari-form";
import { requireStaffPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { saveSafari } from "@/app/admin/safaris/actions";
import { getAdminMediaChoices } from "@/lib/admin-media";

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
  const staff = await requireStaffPermission(contentRoles, StaffPermission.CATALOG_MANAGEMENT);
  const { id } = await params;
  const [safari, destinations, mediaChoices] = await Promise.all([
    prisma.safari.findUnique({
      where: { id },
      include: {
        itineraryDays: { orderBy: { dayNumber: "asc" } },
        seasonalPrices: { orderBy: [{ startMonth: "asc" }, { startDay: "asc" }] },
      },
    }),
    prisma.destination.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, isPublished: true },
      orderBy: { name: "asc" },
    }),
    getAdminMediaChoices(),
  ]);
  if (!safari) notFound();

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
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
        mediaChoices={mediaChoices}
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
          seasonalPrices: safari.seasonalPrices.map((price) => ({
            seasonName: price.seasonName,
            startMonth: price.startMonth,
            startDay: price.startDay,
            endMonth: price.endMonth,
            endDay: price.endDay,
            pricePerPerson: price.pricePerPerson.toString(),
            currency: price.currency,
            isEstimate: price.isEstimate,
          })),
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
